import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { ScheduledCallModel } from "@/models/ScheduledCall";

type Context = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(["scheduled", "cancelled"]).optional(),
  notes: z.string().trim().max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const call = await ScheduledCallModel.findByIdAndUpdate(
      id,
      {
        ...input,
        ...(input.scheduledAt ? { scheduledAt: new Date(input.scheduledAt) } : {}),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!call) return NextResponse.json({ message: "Call not found." }, { status: 404 });
    return NextResponse.json({ call });
  } catch (error) {
    return apiError(error);
  }
}
