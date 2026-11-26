"use client";

import { FormEvent, useState } from "react";
import { clientApi, localDateTimeToIso, toDateTimeLocal } from "@/lib/client-api";
import { SmartInput } from "@/components/ui/smart-input";
import { CLIENT_INTEREST_LEVELS, LEAD_STATUSES, type Lead } from "@/types/crm";
import { statusLabel } from "@/components/ui/status-pill";
import { interestLabel } from "@/components/ui/interest-pill";

type LeadFieldValues = Pick<Lead, "name" | "phone" | "field" | "assignedSalesperson" | "socialMedia" | "bookedDate" | "status" | "nextFollowUpAt" | "interestLevel" | "finalNotes" | "joined">;

export function readLeadFields(form: FormData) {
  return {
    name: form.get("name"),
    field: form.get("field"),
    phone: form.get("phone"),
    socialMedia: form.get("socialMedia"),
    bookedDate: localDateTimeToIso(String(form.get("bookedDate") ?? "")),
    status: form.get("status"),
    interestLevel: form.get("interestLevel"),
    joined: form.get("joined") === "on",
    assignedSalesperson: form.get("assignedSalesperson"),
    finalNotes: form.get("finalNotes"),
    nextFollowUpAt: localDateTimeToIso(String(form.get("nextFollowUpAt") ?? "")),
  };
}

export function LeadForm({
  initial,
  fields,
  salespeople,
  onSaved,
  onCancel,
}: {
  initial?: Lead;
  fields: string[];
  salespeople: string[];
  onSaved: (lead: Lead) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = readLeadFields(new FormData(event.currentTarget));
      const data = await clientApi<{ lead: Lead }>(initial ? `/api/leads/${initial._id}` : "/api/leads", {
        method: initial ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      onSaved(data.lead);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <LeadFields initial={initial} fields={fields} salespeople={salespeople} />
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Saving…" : initial ? "Save changes" : "Add lead"}</button>
      </div>
    </form>
  );
}

export function LeadFields({
  initial,
  fields,
  salespeople,
}: {
  initial?: Partial<LeadFieldValues>;
  fields: string[];
  salespeople: string[];
}) {
  return (
    <>
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Name *</span>
          <input name="name" required minLength={2} defaultValue={initial?.name} placeholder="Lead name" />
        </label>
        <label className="field">
          <span>Phone number *</span>
          <input name="phone" required minLength={7} defaultValue={initial?.phone} placeholder="+20 10…" />
        </label>
        <label className="field">
          <span>Field *</span>
          <SmartInput id="lead-field" name="field" required options={fields} defaultValue={initial?.field} placeholder="e.g. Medical education" />
          <small>Type a new value or select a saved one.</small>
        </label>
        <label className="field">
          <span>Assigned salesperson *</span>
          <SmartInput id="lead-salesperson" name="assignedSalesperson" required options={salespeople} defaultValue={initial?.assignedSalesperson} placeholder="Salesperson name" />
        </label>
        <label className="field">
          <span>Social media</span>
          <input name="socialMedia" defaultValue={initial?.socialMedia} placeholder="Profile or page URL" />
        </label>
        <label className="field">
          <span>Booked date</span>
          <input name="bookedDate" type="datetime-local" defaultValue={toDateTimeLocal(initial?.bookedDate)} />
        </label>
        <label className="field">
          <span>Pipeline status</span>
          <select name="status" defaultValue={initial?.status ?? "new"}>
            {LEAD_STATUSES.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Next follow-up</span>
          <input name="nextFollowUpAt" type="datetime-local" defaultValue={toDateTimeLocal(initial?.nextFollowUpAt)} />
        </label>
        <label className="field">
          <span>Client interest</span>
          <select name="interestLevel" defaultValue={initial?.interestLevel ?? "unrated"}>
            {CLIENT_INTEREST_LEVELS.map((level) => <option value={level} key={level}>{interestLabel(level)}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Final notes</span>
        <textarea name="finalNotes" rows={4} defaultValue={initial?.finalNotes} placeholder="Context, objections and anything the team should know…" />
      </label>
      <label className="check-field">
        <input name="joined" type="checkbox" defaultChecked={initial?.joined ?? false} />
        <span>Converted — this lead has paid or subscribed</span>
      </label>
    </>
  );
}
