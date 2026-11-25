import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiSession } from "@/lib/api-auth";
import { cairoDayBounds } from "@/lib/date";
import { connectToDatabase } from "@/lib/db";
import { LeadModel } from "@/models/Lead";
import { ScheduledCallModel } from "@/models/ScheduledCall";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiSession();
    await connectToDatabase();
    const now = new Date();
    const { start, end } = cairoDayBounds(now);
    const active = { archivedAt: { $exists: false } };

    const [
      totalLeads,
      potentialLeads,
      joinedLeads,
      overdueFollowUps,
      callsToday,
      upcomingCalls,
      statusBreakdown,
      fieldBreakdown,
      salespersonBreakdown,
    ] = await Promise.all([
      LeadModel.countDocuments(active),
      LeadModel.countDocuments({ ...active, status: "potential" }),
      LeadModel.countDocuments({ ...active, joined: true }),
      LeadModel.countDocuments({ ...active, nextFollowUpAt: { $lt: now }, joined: false }),
      ScheduledCallModel.countDocuments({
        status: "scheduled",
        scheduledAt: { $gte: start, $lt: end },
      }),
      ScheduledCallModel.countDocuments({ status: "scheduled", scheduledAt: { $gte: now } }),
      LeadModel.aggregate([
        { $match: active },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      LeadModel.aggregate([
        { $match: active },
        { $group: { _id: "$field", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      LeadModel.aggregate([
        { $match: active },
        {
          $group: {
            _id: "$assignedSalesperson",
            count: { $sum: 1 },
            joined: { $sum: { $cond: ["$joined", 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
      totalLeads,
      potentialLeads,
      joinedLeads,
      conversionRate: totalLeads ? Math.round((joinedLeads / totalLeads) * 1000) / 10 : 0,
      overdueFollowUps,
      callsToday,
      upcomingCalls,
      statusBreakdown: statusBreakdown.map((item) => ({ label: item._id, count: item.count })),
      fieldBreakdown: fieldBreakdown.map((item) => ({ label: item._id, count: item.count })),
      salespersonBreakdown: salespersonBreakdown.map((item) => ({
        label: item._id,
        count: item.count,
        joined: item.joined,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
