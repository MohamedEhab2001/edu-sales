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
  potentialLeads: 0,
  joinedLeads: 0,
  conversionRate: 0,
  overdueFollowUps: 0,
  callsToday: 0,
  upcomingCalls: 0,
  statusBreakdown: [],
  fieldBreakdown: [],
  potentialFieldBreakdown: [],
  salespersonBreakdown: [],
};

function PanelLoadingState({ rows = 4, chart = false }: { rows?: number; chart?: boolean }) {
  return (
    <div className={`dashboard-skeleton${chart ? " dashboard-skeleton--chart" : ""}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="dashboard-skeleton-row" key={index}>
          {chart ? null : <span className="skeleton dashboard-skeleton-avatar" />}
          <div>
            <span className="skeleton dashboard-skeleton-title" />
            <span className="skeleton dashboard-skeleton-copy" />
          </div>
          <span className="skeleton dashboard-skeleton-tail" />
        </div>
      ))}
    </div>
  );
}

function FieldBars({
  fields,
  status,
}: {
  fields: Analytics["fieldBreakdown"];
  status?: "potential";
}) {
  const maxCount = Math.max(1, ...fields.map(({ count }) => count));

  return (
    <div className="bar-list">
      {fields.map(({ label, count }) => (
        <Link
          className="bar-row"
          href={{ pathname: "/leads", query: { field: label, ...(status && { status }) } }}
          key={label}
        >
          <div><span dir="auto">{label}</span><strong>{count}</strong></div>
          <div className="bar-track" aria-hidden="true">
            <i style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

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

  const metrics: Array<{ label: string; value: string | number; detail: string; icon: IconName; tone: string; href: string }> = [
    { label: "Active leads", value: analytics.totalLeads, detail: "Across all pipeline stages", icon: "people", tone: "indigo", href: "/leads" },
    { label: "Potential clients", value: analytics.potentialLeads, detail: "Qualified opportunities", icon: "trend", tone: "amber", href: "/leads?status=potential" },
    { label: "Converted", value: analytics.joinedLeads, detail: `${analytics.conversionRate}% conversion`, icon: "check", tone: "green", href: "/leads?joined=true" },
    { label: "Calls today", value: analytics.callsToday, detail: `${analytics.upcomingCalls} upcoming`, icon: "phone", tone: "blue", href: "/calls" },
    { label: "Overdue follow-ups", value: analytics.overdueFollowUps, detail: "Need attention now", icon: "clock", tone: "rose", href: "/leads?followUp=overdue" },
  ];
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

      <section className="metric-grid" aria-label="Sales metrics" aria-busy={loading}>
        {metrics.map((metric) => (
          <Link className={`metric-card metric-card--${metric.tone}`} href={metric.href} key={metric.label}>
            <div className="metric-icon"><Icon name={metric.icon} /></div>
            <span>{metric.label}</span>
            <strong>{loading ? <span className="skeleton metric-skeleton-value" aria-hidden="true" /> : metric.value}</strong>
            <small>{loading ? <span className="skeleton metric-skeleton-detail" aria-hidden="true" /> : metric.detail}</small>
          </Link>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--overview">
        <article className="panel panel--chart">
          <header className="panel-header">
            <div><h2>Leads by field</h2><p>Your strongest segments at a glance.</p></div>
          </header>
          {loading ? <PanelLoadingState rows={4} chart /> : analytics.fieldBreakdown.length ? (
            <FieldBars fields={analytics.fieldBreakdown} />
          ) : <EmptyState icon="trend" title="No field data yet" description="Field analytics will appear after the first leads are added." />}
        </article>

        <article className="panel panel--chart panel--potential-fields" aria-busy={loading}>
          <header className="panel-header">
            <div>
              <h2>Potential clients by field</h2>
              <p>Select a field to see its potential clients.</p>
            </div>
          </header>
          {loading ? <PanelLoadingState chart /> : analytics.potentialFieldBreakdown.length ? (
            <FieldBars fields={analytics.potentialFieldBreakdown} status="potential" />
          ) : <EmptyState icon="trend" title="No potential clients yet" description="Leads appear here when moved to Potential client." />}
        </article>

        <article className="panel">
          <header className="panel-header">
            <div><h2>Upcoming calls</h2><p>The next conversations on the calendar.</p></div>
            <Link href="/calls">View all</Link>
          </header>
          {loading ? <PanelLoadingState rows={4} /> : calls.length ? (
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
          {loading ? <PanelLoadingState rows={4} /> : followUps.length ? (
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
          <header className="panel-header"><div><h2>Salesperson performance</h2><p>Lead load and converted outcomes.</p></div></header>
          {loading ? <PanelLoadingState rows={4} /> : analytics.salespersonBreakdown.length ? (
            <div className="salesperson-list">
              {analytics.salespersonBreakdown.map((person) => (
                <div key={person.label}>
                  <span className="avatar avatar--soft">{person.label.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span>
                  <div><strong>{person.label}</strong><small>{person.count} leads assigned</small></div>
                  <b>{person.joined}<small> converted</small></b>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="people" title="No salesperson data" description="Salesperson names are saved as the team uses them." />}
        </article>
      </section>
    </div>
  );
}
