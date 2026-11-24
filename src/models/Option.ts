import { InferSchemaType, Schema, models, model, type Model } from "mongoose";

const optionSchema = new Schema(
  {
    type: { type: String, enum: ["field", "salesperson", "response"], required: true },
    value: { type: String, required: true, trim: true },
    valueKey: { type: String, required: true },
    active: { type: Boolean, default: true },
    usageCount: { type: Number, default: 1 },
  },
  { timestamps: true },
);

optionSchema.index({ type: 1, valueKey: 1 }, { unique: true });

export type OptionDocument = InferSchemaType<typeof optionSchema>;
export const OptionModel = (models.Option as Model<OptionDocument> | undefined) || model<OptionDocument>("Option", optionSchema);
