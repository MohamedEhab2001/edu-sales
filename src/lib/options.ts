import { OptionModel } from "@/models/Option";
import { normalizeOption, optionKey } from "@/lib/normalization";
import type { OptionType } from "@/types/crm";

export async function rememberOption(type: OptionType, rawValue?: string) {
  if (!rawValue?.trim()) return;
  const value = normalizeOption(rawValue);
  await OptionModel.updateOne(
    { type, valueKey: optionKey(value) },
    {
      $set: { value, active: true },
      $setOnInsert: { type, valueKey: optionKey(value) },
      $inc: { usageCount: 1 },
    },
    { upsert: true },
  );
}

export async function rememberLeadOptions(input: {
  field?: string;
  assignedSalesperson?: string;
}) {
  await Promise.all([
    rememberOption("field", input.field),
    rememberOption("salesperson", input.assignedSalesperson),
  ]);
}
