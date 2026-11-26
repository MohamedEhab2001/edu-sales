import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { rememberLeadOptions } from "@/lib/options";
import { callSchema } from "@/lib/validations";
import { ScheduledCallModel } from "@/models/ScheduledCall";

type Context = { params: Promise<{ id: string }> };

const updateSchema = callSchema.partial().extend({
  status: z.enum(["scheduled", "cancelled"]).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    const result = updateSchema.safeParse(await request.json());
    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid call details." },
        { status: 400 },
      );
    }
    const input = result.data;
    const { id } = await params;
    await connectToDatabase();
    const call = await ScheduledCallModel.findOneAndUpdate(
      { _id: id, status: "scheduled" },
      {
        ...input,
        ...(input.scheduledAt ? { scheduledAt: new Date(input.scheduledAt) } : {}),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!call) {
      if (await ScheduledCallModel.exists({ _id: id })) {
        return NextResponse.json({ message: "Only scheduled calls can be changed." }, { status: 409 });
      }
      return NextResponse.json({ message: "Call not found." }, { status: 404 });
    }
    await rememberLeadOptions(input).catch((error) => console.error("Could not save call suggestions.", error));
    return NextResponse.json({ call });
  } catch (error) {
    return apiError(error);
  }
}
