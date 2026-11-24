import { InferSchemaType, Schema, models, model, type Model } from "mongoose";
import { LEAD_STATUSES } from "@/types/crm";

const followUpSchema = new Schema(
  {
    scheduledAt: Date,
    completedAt: Date,
    response: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    outcome: { type: String, enum: LEAD_STATUSES },
    assignedSalesperson: { type: String, trim: true },
    nextFollowUpAt: Date,
  },
  { timestamps: true },
);

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    phoneNormalized: { type: String, required: true, unique: true, index: true },
    socialMedia: { type: String, trim: true },
    bookedDate: Date,
    joined: { type: Boolean, default: false, index: true },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    assignedSalesperson: { type: String, required: true, trim: true, index: true },
    finalNotes: { type: String, trim: true },
    lastFollowUpAt: Date,
    nextFollowUpAt: { type: Date, index: true },
    followUps: { type: [followUpSchema], default: [] },
    archivedAt: Date,
  },
  { timestamps: true },
);

leadSchema.index({ name: "text", phone: "text", finalNotes: "text" });

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const LeadModel = (models.Lead as Model<LeadDocument> | undefined) || model<LeadDocument>("Lead", leadSchema);
