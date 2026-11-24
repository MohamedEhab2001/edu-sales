import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { normalizePhone } from "@/lib/normalization";
import { LeadModel } from "@/models/Lead";
import { ScheduledCallModel } from "@/models/ScheduledCall";
import { completeCallSchema } from "@/lib/validations";
import { addFollowUp, createLead } from "@/services/lead-service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    const input = completeCallSchema.parse(await request.json());
    await connectToDatabase();
    const { id } = await params;
    const call = await ScheduledCallModel.findById(id);
    if (!call) return NextResponse.json({ message: "Call not found." }, { status: 404 });
    if (call.status === "completed" && call.leadId) {
      return NextResponse.json({ message: "This call was already completed.", leadId: call.leadId });
    }

    const existing = await LeadModel.findOne({
      phoneNormalized: normalizePhone(input.lead.phone),
      archivedAt: { $exists: false },
    });

    const lead = existing ?? (await createLead(input.lead));
    const leadId = String(lead._id);
    if (input.initialFollowUp) await addFollowUp(leadId, input.initialFollowUp);

    call.status = "completed";
    call.completedAt = new Date();
    call.leadId = lead._id;
    await call.save();

    return NextResponse.json({ leadId, existing: Boolean(existing) });
  } catch (error) {
    return apiError(error);
  }
}
