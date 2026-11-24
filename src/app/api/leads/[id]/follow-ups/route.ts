import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { addFollowUp } from "@/services/lead-service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    const { id } = await params;
    const lead = await addFollowUp(id, await request.json());
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
