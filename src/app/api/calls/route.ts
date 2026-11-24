import type { FilterQuery } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { optionalDate } from "@/lib/date";
import { rememberLeadOptions } from "@/lib/options";
import { ScheduledCallModel, type ScheduledCallDocument } from "@/models/ScheduledCall";
import { callSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const status = request.nextUrl.searchParams.get("status");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const salesperson = request.nextUrl.searchParams.get("salesperson");
    const filter: FilterQuery<ScheduledCallDocument> = {};

    if (status) filter.status = status;
    if (salesperson) filter.assignedSalesperson = salesperson;
    if (from || to) {
      filter.scheduledAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }

    const items = await ScheduledCallModel.find(filter).sort({ scheduledAt: 1 }).limit(250).lean();
    return NextResponse.json({ items });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiSession();
    const input = callSchema.parse(await request.json());
    await connectToDatabase();
    const call = await ScheduledCallModel.create({
      ...input,
      scheduledAt: optionalDate(input.scheduledAt),
    });
    await rememberLeadOptions(input);
    return NextResponse.json({ call: call.toObject() }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
