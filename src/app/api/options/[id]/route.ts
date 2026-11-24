import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { normalizeOption, optionKey } from "@/lib/normalization";
import { OptionModel } from "@/models/Option";

type Context = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  value: z.string().trim().min(1).max(80).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const option = await OptionModel.findByIdAndUpdate(
      id,
      {
        ...input,
        ...(input.value
          ? { value: normalizeOption(input.value), valueKey: optionKey(input.value) }
          : {}),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!option) return NextResponse.json({ message: "Saved value not found." }, { status: 404 });
    return NextResponse.json({ option });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const { id } = await params;
    const option = await OptionModel.findByIdAndUpdate(id, { active: false }, { new: true }).lean();
    if (!option) return NextResponse.json({ message: "Saved value not found." }, { status: 404 });
    return NextResponse.json({ option });
  } catch (error) {
    return apiError(error);
  }
}
