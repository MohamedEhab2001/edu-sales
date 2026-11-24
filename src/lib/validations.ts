import { z } from "zod";
import { LEAD_STATUSES } from "@/types/crm";

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalDate = z.string().datetime().optional().or(z.literal(""));

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  field: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  socialMedia: optionalText,
  bookedDate: optionalDate,
  joined: z.boolean().default(false),
  status: z.enum(LEAD_STATUSES).default("new"),
  assignedSalesperson: z.string().trim().min(2).max(80),
  finalNotes: optionalText,
  nextFollowUpAt: optionalDate,
});

export const leadUpdateSchema = leadSchema.partial();

export const followUpSchema = z.object({
  scheduledAt: optionalDate,
  completedAt: optionalDate,
  response: z.string().trim().min(1).max(120),
  notes: optionalText,
  outcome: z.enum(LEAD_STATUSES).optional(),
  assignedSalesperson: optionalText,
  nextFollowUpAt: optionalDate,
});

export const callSchema = z.object({
  scheduledAt: z.string().datetime(),
  contactName: z.string().trim().min(2).max(120),
  field: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  socialMedia: optionalText,
  assignedSalesperson: z.string().trim().min(2).max(80),
  notes: optionalText,
});

export const completeCallSchema = z.object({
  lead: leadSchema,
  initialFollowUp: followUpSchema.optional(),
});

export const optionSchema = z.object({
  type: z.enum(["field", "salesperson", "response"]),
  value: z.string().trim().min(1).max(80),
});
