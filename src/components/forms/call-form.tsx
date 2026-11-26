"use client";

import { FormEvent, useState } from "react";
import { clientApi, localDateTimeToIso, toDateTimeLocal } from "@/lib/client-api";
import { SmartInput } from "@/components/ui/smart-input";
import type { ScheduledCall } from "@/types/crm";

export function CallForm({
  initial,
  fields,
  salespeople,
  onSaved,
  onCancel,
}: {
  initial?: ScheduledCall;
  fields: string[];
  salespeople: string[];
  onSaved: (call: ScheduledCall) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaults = {
    scheduledAt: toDateTimeLocal(initial?.scheduledAt),
    contactName: initial?.contactName ?? "",
    field: initial?.field ?? "",
    phone: initial?.phone ?? "",
    socialMedia: initial?.socialMedia ?? "",
    assignedSalesperson: initial?.assignedSalesperson ?? "",
    notes: initial?.notes ?? "",
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const changes: Record<string, string> = {};
      for (const [name, defaultValue] of Object.entries(defaults)) {
        const value = String(form.get(name) ?? "");
        if (initial && value === defaultValue) continue;
        changes[name] = name === "scheduledAt" ? localDateTimeToIso(value) : value;
      }
      if (initial && Object.keys(changes).length === 0) {
        onCancel();
        return;
      }

      const data = await clientApi<{ call: ScheduledCall }>(initial ? `/api/calls/${initial._id}` : "/api/calls", {
        method: initial ? "PATCH" : "POST",
        body: JSON.stringify(changes),
      });
      onSaved(data.call);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save the call.");
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
          <input name="scheduledAt" type="datetime-local" required defaultValue={defaults.scheduledAt} />
        </label>
        <label className="field">
          <span>With who *</span>
          <input name="contactName" required minLength={2} defaultValue={defaults.contactName} placeholder="Contact name" />
        </label>
        <label className="field">
          <span>Field *</span>
          <SmartInput id="call-field" name="field" required options={fields} defaultValue={defaults.field} placeholder="Field" />
        </label>
        <label className="field">
          <span>Phone number *</span>
          <input name="phone" required minLength={7} defaultValue={defaults.phone} placeholder="+20 10…" />
        </label>
        <label className="field">
          <span>Assigned salesperson *</span>
          <SmartInput id="call-salesperson" name="assignedSalesperson" required options={salespeople} defaultValue={defaults.assignedSalesperson} placeholder="Salesperson name" />
        </label>
        <label className="field">
          <span>Social media</span>
          <input name="socialMedia" defaultValue={defaults.socialMedia} placeholder="Profile or page URL" />
        </label>
      </div>
      <label className="field">
        <span>Preparation notes</span>
        <textarea name="notes" rows={4} defaultValue={defaults.notes} placeholder="What should the salesperson know before the call?" />
      </label>
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : initial ? "Save changes" : "Schedule call"}
        </button>
      </div>
    </form>
  );
}
