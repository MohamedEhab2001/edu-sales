import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { rememberOption } from "@/lib/options";
import { OptionModel } from "@/models/Option";
import { optionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const type = request.nextUrl.searchParams.get("type");
    const filter = { active: true, ...(type ? { type } : {}) };
    const items = await OptionModel.find(filter).sort({ usageCount: -1, value: 1 }).lean();
    return NextResponse.json({ items });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const input = optionSchema.parse(await request.json());
    await rememberOption(input.type, input.value);
    const items = await OptionModel.find({ type: input.type, active: true })
      .sort({ usageCount: -1, value: 1 })
      .lean();
    return NextResponse.json({ items }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
