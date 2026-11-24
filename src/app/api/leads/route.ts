import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { LeadModel } from "@/models/Lead";
import { buildLeadFilter, createLead } from "@/services/lead-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const filter = buildLeadFilter(request.nextUrl.searchParams);
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get("limit") ?? 25)));
    const [items, total] = await Promise.all([
      LeadModel.find(filter)
        .sort({ nextFollowUpAt: 1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LeadModel.countDocuments(filter),
    ]);

    return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiSession();
    const lead = await createLead(await request.json());
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
