import type { FilterQuery, UpdateQuery } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { optionalDate } from "@/lib/date";
import { normalizePhone } from "@/lib/normalization";
import { rememberLeadOptions, rememberOption } from "@/lib/options";
import { LeadModel, type LeadDocument } from "@/models/Lead";
import { leadSchema, leadUpdateSchema, followUpSchema } from "@/lib/validations";

export async function createLead(rawInput: unknown) {
  const input = leadSchema.parse(rawInput);
  await connectToDatabase();
  const phoneNormalized = normalizePhone(input.phone);

  const lead = await LeadModel.create({
    ...input,
    phoneNormalized,
    bookedDate: optionalDate(input.bookedDate),
    nextFollowUpAt: optionalDate(input.nextFollowUpAt),
    joined: input.joined || input.status === "joined",
  });

  await rememberLeadOptions(input);
  return lead.toObject();
}

export async function updateLead(id: string, rawInput: unknown) {
  const input = leadUpdateSchema.parse(rawInput);
  await connectToDatabase();

  const update: UpdateQuery<LeadDocument> = { ...input };
  if (input.phone) update.phoneNormalized = normalizePhone(input.phone);
  if ("bookedDate" in input) update.bookedDate = optionalDate(input.bookedDate);
  if ("nextFollowUpAt" in input) update.nextFollowUpAt = optionalDate(input.nextFollowUpAt);
  if (input.status === "joined") update.joined = true;

  const lead = await LeadModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!lead) throw new Error("Lead not found.");
  await rememberLeadOptions(input);
  return lead;
}

export async function addFollowUp(id: string, rawInput: unknown) {
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
      ...(input.outcome === "joined" ? { joined: true } : {}),
    },
  };

  const lead = await LeadModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!lead) throw new Error("Lead not found.");
  await Promise.all([
    rememberOption("response", input.response),
    rememberOption("salesperson", input.assignedSalesperson),
  ]);
  return lead;
}

export function buildLeadFilter(searchParams: URLSearchParams) {
  const filter: FilterQuery<LeadDocument> = { archivedAt: { $exists: false } };
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const field = searchParams.get("field");
  const salesperson = searchParams.get("salesperson");
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
  if (joined === "true" || joined === "false") filter.joined = joined === "true";
  if (followUp === "overdue") filter.nextFollowUpAt = { $lt: new Date() };
  if (followUp === "upcoming") filter.nextFollowUpAt = { $gte: new Date() };
  if (followUp === "none") filter.nextFollowUpAt = { $exists: false };

  return filter;
}
