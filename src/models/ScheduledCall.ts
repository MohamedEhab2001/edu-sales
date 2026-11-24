import { InferSchemaType, Schema, models, model, type Model } from "mongoose";

const scheduledCallSchema = new Schema(
  {
    scheduledAt: { type: Date, required: true, index: true },
    contactName: { type: String, required: true, trim: true },
    field: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    socialMedia: { type: String, trim: true },
    assignedSalesperson: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    notes: { type: String, trim: true },
    completedAt: Date,
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
  },
  { timestamps: true },
);

export type ScheduledCallDocument = InferSchemaType<typeof scheduledCallSchema>;
export const ScheduledCallModel = (models.ScheduledCall as Model<ScheduledCallDocument> | undefined) || model<ScheduledCallDocument>("ScheduledCall", scheduledCallSchema);
