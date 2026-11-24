"use client";

import { FormEvent, useState } from "react";
import { clientApi, localDateTimeToIso } from "@/lib/client-api";
import { SmartInput } from "@/components/ui/smart-input";
import type { ScheduledCall } from "@/types/crm";

export function CallForm({
  fields,
  salespeople,
  onSaved,
  onCancel,
}: {
  fields: string[];
  salespeople: string[];
  onSaved: (call: ScheduledCall) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await clientApi<{ call: ScheduledCall }>("/api/calls", {
        method: "POST",
        body: JSON.stringify({
          scheduledAt: localDateTimeToIso(String(form.get("scheduledAt"))),
          contactName: form.get("contactName"),
          field: form.get("field"),
          phone: form.get("phone"),
          socialMedia: form.get("socialMedia"),
          assignedSalesperson: form.get("assignedSalesperson"),
          notes: form.get("notes"),
        }),
      });
      onSaved(data.call);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not schedule call.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>When *</span>
          <input name="scheduledAt" type="datetime-local" required />
        </label>
        <label className="field">
          <span>With who *</span>
          <input name="contactName" required minLength={2} placeholder="Contact name" />
        </label>
        <label className="field">
          <span>Field *</span>
          <SmartInput id="call-field" name="field" required options={fields} placeholder="Field" />
        </label>
        <label className="field">
          <span>Phone number *</span>
          <input name="phone" required minLength={7} placeholder="+20 10…" />
        </label>
        <label className="field">
          <span>Assigned salesperson *</span>
          <SmartInput id="call-salesperson" name="assignedSalesperson" required options={salespeople} placeholder="Salesperson name" />
        </label>
        <label className="field">
          <span>Social media</span>
          <input name="socialMedia" placeholder="Profile or page URL" />
        </label>
      </div>
      <label className="field">
        <span>Preparation notes</span>
        <textarea name="notes" rows={4} placeholder="What should the salesperson know before the call?" />
      </label>
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Scheduling…" : "Schedule call"}</button>
      </div>
    </form>
  );
}
