import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { normalizePhone } from "@/lib/normalization";
import { rememberLeadOptions, rememberOption } from "@/lib/options";
import { LeadModel } from "@/models/Lead";
import { ScheduledCallModel } from "@/models/ScheduledCall";
import { completeCallSchema } from "@/lib/validations";
import { addFollowUp, createLead, updateLead } from "@/services/lead-service";

type Context = { params: Promise<{ id: string }> };

const completionSchema = completeCallSchema.extend({
  existingLeadId: z.string().nullable().optional(),
});

function activeLeadByPhone(phone: string) {
  return LeadModel.findOne({
    phoneNormalized: normalizePhone(phone),
    archivedAt: { $exists: false },
  });
}

export async function GET(_: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const { id } = await params;
    const call = await ScheduledCallModel.findById(id).lean();
    if (!call) return NextResponse.json({ message: "Call not found." }, { status: 404 });
    if (call.status !== "scheduled") {
      return NextResponse.json({ message: "Only scheduled calls can be completed." }, { status: 409 });
    }

    const lead = await activeLeadByPhone(call.phone).select("-followUps").lean();
    return NextResponse.json({ lead });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    await requireApiSession();
    const parsed = completionSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid call details." },
        { status: 400 },
      );
    }
    const input = parsed.data;
    const { id } = await params;
    const mongoose = await connectToDatabase();
    const result = await mongoose.connection.transaction(async (session) => {
      const call = await ScheduledCallModel.findById(id).session(session);
      if (!call) return { status: 404, body: { message: "Call not found." } };
      if (call.status === "completed" && call.leadId) {
        return { status: 200, body: { leadId: String(call.leadId) } };
      }
      if (call.status !== "scheduled") {
        return { status: 409, body: { message: "Only scheduled calls can be completed." } };
      }

      const matchPhone = input.existingLeadId ? call.phone : input.lead.phone;
      const existing = await activeLeadByPhone(matchPhone).session(session);
      const matchedId = existing ? String(existing._id) : null;
      if (input.existingLeadId !== undefined && input.existingLeadId !== matchedId) {
        return {
          status: 409,
          body: { message: "The matching lead changed. Reopen the form to review it, or use a different phone number." },
        };
      }

      const lead = existing ?? await createLead(input.lead, session);
      const leadId = String(lead._id);
      if (input.existingLeadId) await updateLead(leadId, input.lead, session);

      const completedAt = new Date();
      if (input.initialFollowUp) {
        await addFollowUp(leadId, {
          ...input.initialFollowUp,
          completedAt: completedAt.toISOString(),
        }, session);
      }

      call.status = "completed";
      call.completedAt = completedAt;
      call.leadId = lead._id;
      await call.save({ session });

      return { status: 200, body: { leadId, existing: Boolean(existing) }, saved: true };
    });

    if (result.saved) {
      await Promise.all([
        rememberLeadOptions(input.lead),
        rememberOption("response", input.initialFollowUp?.response),
      ]).catch((error) => console.error("Could not save call suggestions.", error));
    }
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return apiError(error);
  }
}
