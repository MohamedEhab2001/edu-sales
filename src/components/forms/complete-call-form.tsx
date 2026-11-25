"use client";

import { FormEvent, useState } from "react";
import { clientApi, localDateTimeToIso } from "@/lib/client-api";
import { SmartInput } from "@/components/ui/smart-input";
import { LEAD_STATUSES, type LeadStatus, type ScheduledCall } from "@/types/crm";
import { statusLabel } from "@/components/ui/status-pill";

export function CompleteCallForm({
  call,
  fields,
  salespeople,
  responses,
  onCompleted,
  onCancel,
}: {
  call: ScheduledCall;
  fields: string[];
  salespeople: string[];
  responses: string[];
  onCompleted: (leadId: string) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status")) as LeadStatus;
    try {
      const data = await clientApi<{ leadId: string }>(`/api/calls/${call._id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          lead: {
            name: form.get("name"),
            field: form.get("field"),
            phone: form.get("phone"),
            socialMedia: form.get("socialMedia"),
            bookedDate: call.scheduledAt,
            joined: form.get("joined") === "on",
            status,
            assignedSalesperson: form.get("assignedSalesperson"),
            finalNotes: form.get("finalNotes"),
            nextFollowUpAt: localDateTimeToIso(String(form.get("nextFollowUpAt") ?? "")),
          },
          initialFollowUp: {
            response: form.get("response"),
            notes: form.get("followUpNotes"),
            outcome: status,
            assignedSalesperson: form.get("assignedSalesperson"),
            nextFollowUpAt: localDateTimeToIso(String(form.get("nextFollowUpAt") ?? "")),
          },
        }),
      });
      onCompleted(data.leadId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not complete call.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="call-summary-strip">
        <div><span>Scheduled</span><strong>{new Date(call.scheduledAt).toLocaleString()}</strong></div>
        <div><span>Phone</span><strong>{call.phone}</strong></div>
      </div>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="form-grid form-grid--2">
        <label className="field"><span>Name *</span><input name="name" required defaultValue={call.contactName} /></label>
        <label className="field"><span>Phone *</span><input name="phone" required defaultValue={call.phone} /></label>
        <label className="field"><span>Field *</span><SmartInput id="complete-field" name="field" required options={fields} defaultValue={call.field} /></label>
        <label className="field"><span>Salesperson *</span><SmartInput id="complete-salesperson" name="assignedSalesperson" required options={salespeople} defaultValue={call.assignedSalesperson} /></label>
        <label className="field"><span>Social media</span><input name="socialMedia" defaultValue={call.socialMedia} /></label>
        <label className="field">
          <span>Call outcome *</span>
          <select name="status" defaultValue="follow_up" required>
            {LEAD_STATUSES.filter((status) => status !== "new").map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}
          </select>
        </label>
        <label className="field"><span>Response *</span><SmartInput id="complete-response" name="response" required options={responses} placeholder="What was their response?" /></label>
        <label className="field"><span>Next follow-up</span><input name="nextFollowUpAt" type="datetime-local" /></label>
      </div>
      <label className="field"><span>Follow-up notes</span><textarea name="followUpNotes" rows={3} defaultValue={call.notes} /></label>
      <label className="field"><span>Final lead notes</span><textarea name="finalNotes" rows={3} placeholder="Long-term context or qualification notes…" /></label>
      <label className="check-field">
        <input name="joined" type="checkbox" defaultChecked={false} />
        <span>Converted — this lead has paid or subscribed</span>
      </label>
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Completing…" : "Complete call and create lead"}</button>
      </div>
    </form>
  );
}
