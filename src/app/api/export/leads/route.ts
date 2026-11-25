import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { LeadModel } from "@/models/Lead";
import { buildLeadFilter } from "@/services/lead-service";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    await requireApiSession();
    await connectToDatabase();
    const leads = await LeadModel.find(buildLeadFilter(request.nextUrl.searchParams))
      .sort({ createdAt: -1 })
      .lean();
    const header = [
      "Name",
      "Field",
      "Phone",
      "Social media",
      "Booked date",
      "Converted",
      "Status",
      "Client interest",
      "Salesperson",
      "Last follow-up",
      "Next follow-up",
      "Notes",
    ];
    const rows = leads.map((lead) => [
      lead.name,
      lead.field,
      lead.phone,
      lead.socialMedia,
      lead.bookedDate?.toISOString(),
      lead.joined ? "Yes" : "No",
      lead.status === "joined" ? "Call finalized" : lead.status,
      lead.interestLevel ?? "unrated",
      lead.assignedSalesperson,
      lead.lastFollowUpAt?.toISOString(),
      lead.nextFollowUpAt?.toISOString(),
      lead.finalNotes,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="edulato-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
