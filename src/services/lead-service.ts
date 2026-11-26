import type { ClientSession, FilterQuery, UpdateQuery } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { optionalDate } from "@/lib/date";
import { normalizePhone } from "@/lib/normalization";
import { rememberLeadOptions, rememberOption } from "@/lib/options";
import { LeadModel, type LeadDocument } from "@/models/Lead";
import { leadSchema, leadUpdateSchema, followUpSchema } from "@/lib/validations";

export async function createLead(rawInput: unknown, session?: ClientSession) {
  const input = leadSchema.parse(rawInput);
  await connectToDatabase();
  const phoneNormalized = normalizePhone(input.phone);

  const lead = new LeadModel({
    ...input,
    phoneNormalized,
    bookedDate: optionalDate(input.bookedDate),
    nextFollowUpAt: optionalDate(input.nextFollowUpAt),
    joined: input.joined,
  });
  await lead.save({ session });

  if (!session) await rememberLeadOptions(input);
  return lead.toObject();
}

export async function updateLead(id: string, rawInput: unknown, session?: ClientSession) {
  const input = leadUpdateSchema.parse(rawInput);
  await connectToDatabase();

  const update: UpdateQuery<LeadDocument> = { ...input };
  if (input.phone) update.phoneNormalized = normalizePhone(input.phone);
  for (const field of ["bookedDate", "nextFollowUpAt"] as const) {
    if (!(field in input)) continue;
    const date = optionalDate(input[field]);
    if (date) {
      update[field] = date;
    } else {
      delete update[field];
      update.$unset = { ...update.$unset, [field]: 1 };
    }
  }

  const lead = await LeadModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    session,
  }).lean();

  if (!lead) throw new Error("Lead not found.");
  if (!session) await rememberLeadOptions(input);
  return lead;
}

export async function addFollowUp(id: string, rawInput: unknown, session?: ClientSession) {
  const input = followUpSchema.parse(rawInput);
  await connectToDatabase();

  const completedAt = optionalDate(input.completedAt) ?? new Date();
  const nextFollowUpAt = optionalDate(input.nextFollowUpAt);
  const update: UpdateQuery<LeadDocument> = {
    $push: {
      followUps: {
        ...input,
        scheduledAt: optionalDate(input.scheduledAt),
        completedAt,
        nextFollowUpAt,
      },
    },
    $set: {
      lastFollowUpAt: completedAt,
      nextFollowUpAt,
      ...(input.outcome ? { status: input.outcome } : {}),
      ...(input.interestLevel ? { interestLevel: input.interestLevel } : {}),
    },
  };

  const lead = await LeadModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    session,
  }).lean();

  if (!lead) throw new Error("Lead not found.");
  if (!session) {
    await Promise.all([
      rememberOption("response", input.response),
      rememberOption("salesperson", input.assignedSalesperson),
    ]);
  }
  return lead;
}

export function buildLeadFilter(searchParams: URLSearchParams) {
  const filter: FilterQuery<LeadDocument> = { archivedAt: { $exists: false } };
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const field = searchParams.get("field");
  const salesperson = searchParams.get("salesperson");
  const interestLevel = searchParams.get("interestLevel");
  const joined = searchParams.get("joined");
  const followUp = searchParams.get("followUp");

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
      { socialMedia: { $regex: escaped, $options: "i" } },
    ];
  }
  if (status) filter.status = status;
  if (field) filter.field = field;
  if (salesperson) filter.assignedSalesperson = salesperson;
  if (interestLevel === "unrated") filter.interestLevel = { $in: ["unrated", null] };
  else if (interestLevel) filter.interestLevel = interestLevel;
  if (joined === "true" || joined === "false") filter.joined = joined === "true";
  if (followUp === "overdue") filter.nextFollowUpAt = { $lt: new Date() };
  if (followUp === "upcoming") filter.nextFollowUpAt = { $gte: new Date() };
  if (followUp === "none") filter.nextFollowUpAt = { $exists: false };

  return filter;
}
