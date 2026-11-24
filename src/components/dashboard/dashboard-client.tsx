"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { Analytics, Lead, ScheduledCall } from "@/types/crm";
import { Icon, type IconName } from "@/components/ui/icon";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";

const emptyAnalytics: Analytics = {
  totalLeads: 0,
  joinedLeads: 0,
  conversionRate: 0,
  overdueFollowUps: 0,
  callsToday: 0,
  upcomingCalls: 0,
  statusBreakdown: [],
  fieldBreakdown: [],
  salespersonBreakdown: [],
};

export function DashboardClient() {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [calls, setCalls] = useState<ScheduledCall[]>([]);
  const [followUps, setFollowUps] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, callData, leadData] = await Promise.all([
        clientApi<Analytics>("/api/analytics"),
        clientApi<{ items: ScheduledCall[] }>(`/api/calls?status=scheduled&from=${encodeURIComponent(new Date().toISOString())}`),
        clientApi<{ items: Lead[] }>("/api/leads?followUp=overdue&limit=6"),
      ]);
      setAnalytics(analyticsData);
      setCalls(callData.items.slice(0, 5));
      setFollowUps(leadData.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics: Array<{ label: string; value: string | number; detail: string; icon: IconName; tone: string }> = [
    { label: "Active leads", value: analytics.totalLeads, detail: "Across all pipeline stages", icon: "people", tone: "indigo" },
    { label: "Joined", value: analytics.joinedLeads, detail: `${analytics.conversionRate}% conversion`, icon: "check", tone: "green" },
    { label: "Calls today", value: analytics.callsToday, detail: `${analytics.upcomingCalls} upcoming`, icon: "phone", tone: "blue" },
    { label: "Overdue follow-ups", value: analytics.overdueFollowUps, detail: "Need attention now", icon: "clock", tone: "rose" },
  ];
  const maxField = Math.max(1, ...analytics.fieldBreakdown.map((item) => item.count));

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">Sales overview</span>
          <h1>Good work starts with a clear next step.</h1>
          <p>See what needs attention, what is moving, and where the team is converting.</p>
        </div>
        <div className="page-actions">
          <Link className="button button--secondary" href="/calls"><Icon name="calendar" /> Schedule call</Link>
          <Link className="button button--primary" href="/leads?new=1"><Icon name="plus" /> Add lead</Link>
        </div>
      </header>

      <section className="metric-grid" aria-label="Sales metrics">
        {metrics.map((metric) => (
          <article className={`metric-card metric-card--${metric.tone}`} key={metric.label}>
            <div className="metric-icon"><Icon name={metric.icon} /></div>
            <span>{metric.label}</span>
            <strong>{loading ? "—" : metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel panel--chart">
          <header className="panel-header">
            <div><h2>Leads by field</h2><p>Your strongest segments at a glance.</p></div>
          </header>
          {analytics.fieldBreakdown.length ? (
            <div className="bar-list">
              {analytics.fieldBreakdown.map((item) => (
                <div className="bar-row" key={item.label}>
                  <div><span>{item.label}</span><strong>{item.count}</strong></div>
                  <div className="bar-track"><i style={{ width: `${Math.max(8, (item.count / maxField) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="trend" title="No field data yet" description="Field analytics will appear after the first leads are added." />}
        </article>

        <article className="panel">
          <header className="panel-header">
            <div><h2>Upcoming calls</h2><p>The next conversations on the calendar.</p></div>
            <Link href="/calls">View all</Link>
          </header>
          {calls.length ? (
            <div className="compact-list">
              {calls.map((call) => (
                <Link className="compact-item" href="/calls" key={call._id}>
                  <span className="compact-icon"><Icon name="phone" /></span>
                  <div><strong>{call.contactName}</strong><small>{call.field} · {call.assignedSalesperson}</small></div>
                  <time>{formatRelative(call.scheduledAt)}<small>{formatDateTime(call.scheduledAt)}</small></time>
                </Link>
              ))}
            </div>
          ) : <EmptyState icon="calendar" title="No calls scheduled" description="Schedule a call and it will appear here." />}
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <article className="panel">
          <header className="panel-header">
            <div><h2>Overdue follow-ups</h2><p>Leads waiting for the next touch.</p></div>
            <Link href="/leads?followUp=overdue">Open queue</Link>
          </header>
          {followUps.length ? (
            <div className="table-wrap table-wrap--compact">
              <table>
                <thead><tr><th>Lead</th><th>Status</th><th>Owner</th><th>Due</th></tr></thead>
                <tbody>
                  {followUps.map((lead) => (
                    <tr key={lead._id}>
                      <td><Link href={`/leads?lead=${lead._id}`}><strong>{lead.name}</strong><small>{lead.field}</small></Link></td>
                      <td><StatusPill status={lead.status} /></td>
                      <td>{lead.assignedSalesperson}</td>
                      <td className="text-danger">{formatRelative(lead.nextFollowUpAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon="check" title="Follow-ups are clear" description="Nothing is overdue right now." />}
        </article>

        <article className="panel">
          <header className="panel-header"><div><h2>Salesperson performance</h2><p>Lead load and joined outcomes.</p></div></header>
          {analytics.salespersonBreakdown.length ? (
            <div className="salesperson-list">
              {analytics.salespersonBreakdown.map((person) => (
                <div key={person.label}>
                  <span className="avatar avatar--soft">{person.label.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span>
                  <div><strong>{person.label}</strong><small>{person.count} leads assigned</small></div>
                  <b>{person.joined}<small> joined</small></b>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="people" title="No salesperson data" description="Salesperson names are saved as the team uses them." />}
        </article>
      </section>
    </div>
  );
}
