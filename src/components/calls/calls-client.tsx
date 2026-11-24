"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/client-api";
import { formatDateTime, formatRelative, isOverdue } from "@/lib/format";
import { useOptions } from "@/hooks/use-options";
import type { CallStatus, ScheduledCall } from "@/types/crm";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { CallForm } from "@/components/forms/call-form";
import { CompleteCallForm } from "@/components/forms/complete-call-form";

const tabs: Array<{ value: CallStatus; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function CallsClient() {
  const router = useRouter();
  const options = useOptions();
  const [items, setItems] = useState<ScheduledCall[]>([]);
  const [status, setStatus] = useState<CallStatus>("scheduled");
  const [salesperson, setSalesperson] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ScheduledCall | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ status });
      if (salesperson) query.set("salesperson", salesperson);
      const data = await clientApi<{ items: ScheduledCall[] }>(`/api/calls?${query}`);
      setItems(data.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load calls.");
    } finally {
      setLoading(false);
    }
  }, [salesperson, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelCall(call: ScheduledCall) {
    if (!window.confirm(`Cancel the call with ${call.contactName}?`)) return;
    await clientApi(`/api/calls/${call._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    void load();
  }

  return (
    <div className="page-wrap">
      <header className="page-header page-header--compact">
        <div>
          <span className="eyebrow">Call calendar</span>
          <h1>Turn each booked call into a clear outcome.</h1>
          <p>Prepare the conversation, complete it, then continue in the lead follow-up timeline.</p>
        </div>
        <button className="button button--primary" type="button" onClick={() => setScheduleOpen(true)}><Icon name="plus" /> Schedule call</button>
      </header>

      <section className="call-toolbar">
        <div className="tab-list" role="tablist">
          {tabs.map((tab) => <button className={status === tab.value ? "is-active" : ""} type="button" role="tab" aria-selected={status === tab.value} key={tab.value} onClick={() => setStatus(tab.value)}>{tab.label}</button>)}
        </div>
        <select value={salesperson} onChange={(event) => setSalesperson(event.target.value)} aria-label="Filter calls by salesperson">
          <option value="">All salespeople</option>
          {options.salespeople.map((item) => <option value={item.value} key={item._id}>{item.value}</option>)}
        </select>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {loading ? <div className="panel loading-state">Loading calls…</div> : items.length ? (
        <section className="call-list">
          {items.map((call) => {
            const overdue = status === "scheduled" && isOverdue(call.scheduledAt);
            return (
              <article className={`call-card ${overdue ? "call-card--overdue" : ""}`} key={call._id}>
                <div className="call-date-tile"><span>{new Date(call.scheduledAt).toLocaleString("en-EG", { timeZone: "Africa/Cairo", month: "short" })}</span><strong>{new Date(call.scheduledAt).toLocaleString("en-EG", { timeZone: "Africa/Cairo", day: "2-digit" })}</strong><small>{new Date(call.scheduledAt).toLocaleString("en-EG", { timeZone: "Africa/Cairo", hour: "numeric", minute: "2-digit" })}</small></div>
                <div className="call-card-main">
                  <div className="call-card-heading"><div><span className={`call-status call-status--${call.status}`}>{overdue ? "Overdue" : call.status}</span><h2>{call.contactName}</h2></div><span className="avatar avatar--soft">{call.assignedSalesperson.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span></div>
                  <div className="call-meta"><span><Icon name="phone" /> {call.phone}</span><span><Icon name="people" /> {call.field}</span><span><Icon name="calendar" /> {formatRelative(call.scheduledAt)}</span></div>
                  {call.notes ? <p className="call-notes">{call.notes}</p> : null}
                  <footer><div><span>Assigned to</span><strong>{call.assignedSalesperson}</strong></div><div className="call-actions">
                    {call.status === "scheduled" ? <><button className="button button--secondary" type="button" onClick={() => cancelCall(call)}>Cancel</button><button className="button button--primary" type="button" onClick={() => setActiveCall(call)}>Complete call</button></> : null}
                    {call.status === "completed" && call.leadId ? <button className="button button--secondary" type="button" onClick={() => router.push(`/leads?lead=${call.leadId}`)}>Open lead</button> : null}
                  </div></footer>
                </div>
              </article>
            );
          })}
        </section>
      ) : <div className="panel"><EmptyState icon="calendar" title={`No ${status} calls`} description={status === "scheduled" ? "Schedule the next sales call to start the queue." : `Calls marked ${status} will appear here.`} /></div>}

      <Modal open={scheduleOpen} title="Schedule a call" description="The call becomes a lead only after you complete it." onClose={() => setScheduleOpen(false)} wide>
        <CallForm fields={options.fields.map((item) => item.value)} salespeople={options.salespeople.map((item) => item.value)} onCancel={() => setScheduleOpen(false)} onSaved={() => { setScheduleOpen(false); void load(); void options.refresh(); }} />
      </Modal>

      <Modal open={Boolean(activeCall)} title="Complete scheduled call" description={activeCall ? `Create or update the lead for ${activeCall.contactName}.` : undefined} onClose={() => setActiveCall(null)} wide>
        {activeCall ? <CompleteCallForm call={activeCall} fields={options.fields.map((item) => item.value)} salespeople={options.salespeople.map((item) => item.value)} responses={options.responses.map((item) => item.value)} onCancel={() => setActiveCall(null)} onCompleted={(leadId) => router.push(`/leads?lead=${leadId}`)} /> : null}
      </Modal>
    </div>
  );
}
