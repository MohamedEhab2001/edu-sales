"use client";

import { FormEvent, useState } from "react";
import { clientApi, localDateTimeToIso } from "@/lib/client-api";
import { SmartInput } from "@/components/ui/smart-input";
import { CLIENT_INTEREST_LEVELS, LEAD_STATUSES, type Lead } from "@/types/crm";
import { statusLabel } from "@/components/ui/status-pill";
import { interestLabel } from "@/components/ui/interest-pill";

export function FollowUpForm({
  lead,
  responses,
  salespeople,
  onSaved,
}: {
  lead: Lead;
  responses: string[];
  salespeople: string[];
  onSaved: (lead: Lead) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setError("");
    const form = new FormData(formElement);
    try {
      const data = await clientApi<{ lead: Lead }>(`/api/leads/${lead._id}/follow-ups`, {
        method: "POST",
        body: JSON.stringify({
          response: form.get("response"),
          notes: form.get("notes"),
          outcome: form.get("outcome") || undefined,
          interestLevel: form.get("interestLevel"),
          assignedSalesperson: form.get("assignedSalesperson"),
          nextFollowUpAt: localDateTimeToIso(String(form.get("nextFollowUpAt") ?? "")),
        }),
      });
      formElement.reset();
      onSaved(data.lead);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save follow-up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="follow-up-form" onSubmit={submit}>
      <h3>Add follow-up result</h3>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Response *</span>
          <SmartInput id="follow-up-response" name="response" required options={responses} placeholder="e.g. Interested" />
        </label>
        <label className="field">
          <span>Handled by</span>
          <SmartInput id="follow-up-salesperson" name="assignedSalesperson" options={salespeople} defaultValue={lead.assignedSalesperson} />
        </label>
        <label className="field">
          <span>Update status</span>
          <select name="outcome" defaultValue="">
            <option value="">Keep current status</option>
            {LEAD_STATUSES.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Next follow-up</span>
          <input name="nextFollowUpAt" type="datetime-local" />
        </label>
        <label className="field">
          <span>Client interest</span>
          <select name="interestLevel" defaultValue={lead.interestLevel ?? "unrated"}>
            {CLIENT_INTEREST_LEVELS.map((level) => <option value={level} key={level}>{interestLabel(level)}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Notes</span>
        <textarea name="notes" rows={3} placeholder="What did they say? What should happen next?" />
      </label>
      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Save follow-up"}</button>
      </div>
    </form>
  );
}
