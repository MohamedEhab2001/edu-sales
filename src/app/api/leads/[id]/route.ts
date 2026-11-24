import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { LeadModel } from "@/models/Lead";
import { updateLead } from "@/services/lead-service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const { id } = await params;
    const lead = await LeadModel.findById(id).lean();
    if (!lead) return NextResponse.json({ message: "Lead not found." }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    const { id } = await params;
    const lead = await updateLead(id, await request.json());
    return NextResponse.json({ lead });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const { id } = await params;
    const lead = await LeadModel.findByIdAndUpdate(
      id,
      { archivedAt: new Date(), status: "lost" },
      { new: true },
    ).lean();
    if (!lead) return NextResponse.json({ message: "Lead not found." }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    return apiError(error);
  }
}
