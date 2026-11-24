"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { formatDateTime, formatRelative, isOverdue } from "@/lib/format";
import { useOptions } from "@/hooks/use-options";
import type { Lead, LeadStatus } from "@/types/crm";
import { LEAD_STATUSES } from "@/types/crm";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill, statusLabel } from "@/components/ui/status-pill";
import { LeadForm } from "@/components/forms/lead-form";
import { FollowUpForm } from "@/components/forms/follow-up-form";

interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  pages: number;
}

export function LeadsClient() {
  const options = useOptions();
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [field, setField] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [joined, setJoined] = useState("");
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("new") === "1") setAddOpen(true);
    if (query.get("followUp")) setFollowUp(query.get("followUp") ?? "");
    const leadId = query.get("lead");
    if (leadId) {
      clientApi<{ lead: Lead }>(`/api/leads/${leadId}`).then((data) => setActiveLead(data.lead)).catch(() => undefined);
    }
  }, []);

  const queryString = useMemo(() => {
    const query = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) query.set("search", search);
    if (status) query.set("status", status);
    if (field) query.set("field", field);
    if (salesperson) query.set("salesperson", salesperson);
    if (joined) query.set("joined", joined);
    if (followUp) query.set("followUp", followUp);
    return query.toString();
  }, [field, followUp, joined, page, salesperson, search, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientApi<LeadListResponse>(`/api/leads?${queryString}`);
      setItems(data.items);
      setTotal(data.total);
      setPages(Math.max(1, data.pages));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load leads.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 220);
    return () => clearTimeout(timeout);
  }, [load]);

  function updateActive(lead: Lead) {
    setActiveLead(lead);
    setItems((current) => current.map((item) => item._id === lead._id ? lead : item));
    void options.refresh();
  }

  async function archiveLead() {
    if (!activeLead || !window.confirm(`Archive ${activeLead.name}?`)) return;
    await clientApi(`/api/leads/${activeLead._id}`, { method: "DELETE" });
    setActiveLead(null);
    void load();
  }

  const hasFilters = search || status || field || salesperson || joined || followUp;

  return (
    <div className="page-wrap">
      <header className="page-header page-header--compact">
        <div>
          <span className="eyebrow">Lead workspace</span>
          <h1>Keep every conversation moving.</h1>
          <p>{total} active leads with their latest status, owner and next follow-up.</p>
        </div>
        <div className="page-actions">
          <a className="button button--secondary" href={`/api/export/leads?${queryString}`}><Icon name="download" /> Export CSV</a>
          <button className="button button--primary" type="button" onClick={() => setAddOpen(true)}><Icon name="plus" /> Add lead</button>
        </div>
      </header>

      <section className="filter-panel" aria-label="Lead filters">
        <label className="search-field"><Icon name="search" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, phone or social media…" /></label>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((item) => <option value={item} key={item}>{statusLabel(item)}</option>)}
        </select>
        <select value={field} onChange={(event) => { setField(event.target.value); setPage(1); }} aria-label="Filter by field">
          <option value="">All fields</option>
          {options.fields.map((item) => <option value={item.value} key={item._id}>{item.value}</option>)}
        </select>
        <select value={salesperson} onChange={(event) => { setSalesperson(event.target.value); setPage(1); }} aria-label="Filter by salesperson">
          <option value="">All salespeople</option>
          {options.salespeople.map((item) => <option value={item.value} key={item._id}>{item.value}</option>)}
        </select>
        <select value={followUp} onChange={(event) => { setFollowUp(event.target.value); setPage(1); }} aria-label="Filter by follow-up">
          <option value="">Any follow-up</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">Not scheduled</option>
        </select>
        <select value={joined} onChange={(event) => { setJoined(event.target.value); setPage(1); }} aria-label="Filter by joined state">
          <option value="">Joined or not</option>
          <option value="true">Joined</option>
          <option value="false">Not joined</option>
        </select>
        {hasFilters ? <button className="filter-clear" type="button" onClick={() => { setSearch(""); setStatus(""); setField(""); setSalesperson(""); setJoined(""); setFollowUp(""); setPage(1); }}>Clear</button> : null}
      </section>

      <section className="panel panel--table">
        {error ? <div className="alert alert--error">{error}</div> : null}
        {loading ? <div className="loading-state">Loading leads…</div> : items.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lead</th><th>Field</th><th>Contact</th><th>Owner</th><th>Status</th><th>Next follow-up</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {items.map((lead) => (
                  <tr key={lead._id} className={isOverdue(lead.nextFollowUpAt) && !lead.joined ? "row--overdue" : ""}>
                    <td><button className="table-person" type="button" onClick={() => setActiveLead(lead)}><span className="avatar avatar--soft">{lead.name.slice(0, 2).toUpperCase()}</span><span><strong>{lead.name}</strong><small>Added {formatRelative(lead.createdAt)}</small></span></button></td>
                    <td>{lead.field}</td>
                    <td><a href={`tel:${lead.phone}`} className="contact-link">{lead.phone}</a>{lead.socialMedia ? <a href={lead.socialMedia} target="_blank" rel="noreferrer"><small>Social profile</small></a> : null}</td>
                    <td>{lead.assignedSalesperson}</td>
                    <td><StatusPill status={lead.status} /></td>
                    <td className={isOverdue(lead.nextFollowUpAt) && !lead.joined ? "text-danger" : ""}>{formatRelative(lead.nextFollowUpAt)}<small>{formatDateTime(lead.nextFollowUpAt)}</small></td>
                    <td>{lead.joined ? <span className="joined-mark"><Icon name="check" /> Yes</span> : <span className="muted">No</span>}</td>
                    <td><button className="table-action" type="button" onClick={() => setActiveLead(lead)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon="leads" title="No leads found" description={hasFilters ? "Try clearing one or more filters." : "Add the first lead to start your sales workspace."} />}
        <footer className="table-footer">
          <span>Showing {items.length} of {total}</span>
          <div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><b>{page} / {pages}</b><button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
        </footer>
      </section>

      <Modal open={addOpen} title="Add a lead" description="New fields and salesperson names will be saved automatically." onClose={() => setAddOpen(false)} wide>
        <LeadForm fields={options.fields.map((item) => item.value)} salespeople={options.salespeople.map((item) => item.value)} onCancel={() => setAddOpen(false)} onSaved={(lead) => { setAddOpen(false); setActiveLead(lead); void load(); void options.refresh(); }} />
      </Modal>

      <Modal open={Boolean(activeLead) && !editOpen} title={activeLead?.name ?? "Lead details"} description={activeLead ? `${activeLead.field} · ${activeLead.phone}` : undefined} onClose={() => setActiveLead(null)} wide>
        {activeLead ? (
          <div className="lead-detail">
            <div className="lead-detail-top">
              <div className="lead-summary-card">
                <div className="lead-summary-heading"><StatusPill status={activeLead.status} />{activeLead.joined ? <span className="joined-mark"><Icon name="check" /> Joined</span> : null}</div>
                <dl>
                  <div><dt>Salesperson</dt><dd>{activeLead.assignedSalesperson}</dd></div>
                  <div><dt>Booked</dt><dd>{formatDateTime(activeLead.bookedDate)}</dd></div>
                  <div><dt>Last follow-up</dt><dd>{formatDateTime(activeLead.lastFollowUpAt)}</dd></div>
                  <div><dt>Next follow-up</dt><dd className={isOverdue(activeLead.nextFollowUpAt) ? "text-danger" : ""}>{formatDateTime(activeLead.nextFollowUpAt)}</dd></div>
                </dl>
                {activeLead.finalNotes ? <div className="note-box"><span>Final notes</span><p>{activeLead.finalNotes}</p></div> : null}
                <div className="summary-actions"><button className="button button--secondary" type="button" onClick={() => setEditOpen(true)}>Edit lead</button><button className="button button--danger-ghost" type="button" onClick={archiveLead}>Archive</button></div>
              </div>
              <FollowUpForm lead={activeLead} responses={options.responses.map((item) => item.value)} salespeople={options.salespeople.map((item) => item.value)} onSaved={updateActive} />
            </div>

            <section className="timeline-section">
              <header><h3>Follow-up history</h3><span>{activeLead.followUps.length} responses</span></header>
              {activeLead.followUps.length ? (
                <div className="timeline">
                  {[...activeLead.followUps].reverse().map((item) => (
                    <article key={item._id}>
                      <span className="timeline-dot" />
                      <div><header><strong>{item.response}</strong>{item.outcome ? <StatusPill status={item.outcome} /> : null}</header><p>{item.notes || "No additional notes."}</p><footer><span>{item.assignedSalesperson || activeLead.assignedSalesperson}</span><time>{formatDateTime(item.completedAt || item.createdAt)}</time>{item.nextFollowUpAt ? <span>Next: {formatDateTime(item.nextFollowUpAt)}</span> : null}</footer></div>
                    </article>
                  ))}
                </div>
              ) : <EmptyState icon="note" title="No follow-ups yet" description="The first response will appear here as a permanent history entry." />}
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal open={editOpen && Boolean(activeLead)} title="Edit lead" description="Update qualification, ownership or the next action." onClose={() => setEditOpen(false)} wide>
        {activeLead ? <LeadForm initial={activeLead} fields={options.fields.map((item) => item.value)} salespeople={options.salespeople.map((item) => item.value)} onCancel={() => setEditOpen(false)} onSaved={(lead) => { updateActive(lead); setEditOpen(false); }} /> : null}
      </Modal>
    </div>
  );
}
