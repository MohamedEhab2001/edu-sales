"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LeadFields, readLeadFields } from "@/components/forms/lead-form";
import { SmartInput } from "@/components/ui/smart-input";
import { clientApi } from "@/lib/client-api";
import type { Lead, ScheduledCall } from "@/types/crm";

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
  // Undefined means the lookup hasn't finished. Null means there's no matching lead.
  const [existingLead, setExistingLead] = useState<Lead | null>();
  const [loadingError, setLoadingError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const url = `/api/calls/${call._id}/complete`;

  useEffect(() => {
    const controller = new AbortController();
    clientApi<{ lead: Lead | null }>(url, { signal: controller.signal }).then(({ lead }) => {
      if (!controller.signal.aborted) setExistingLead(lead);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadingError("Could not load the lead details. Close this form and try again.");
    });
    return () => controller.abort();
  }, [url]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || existingLead === undefined) return;
    setSaving(true);
    setSaveError("");
    try {
      const form = new FormData(event.currentTarget);
      const lead = readLeadFields(form);
      const response = String(form.get("response") ?? "").trim();
      const notes = String(form.get("followUpNotes") ?? "").trim();
      const data = await clientApi<{ leadId: string }>(url, {
        method: "POST",
        body: JSON.stringify({
          lead,
          existingLeadId: existingLead?._id ?? null,
          initialFollowUp: response || notes ? {
            response: response || "Call completed",
            notes,
            outcome: lead.status,
            interestLevel: lead.interestLevel,
            assignedSalesperson: lead.assignedSalesperson,
            nextFollowUpAt: lead.nextFollowUpAt,
            scheduledAt: call.scheduledAt,
          } : undefined,
        }),
      });
      onCompleted(data.leadId);
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : "Could not complete the call.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingError) return <div className="alert alert--error" role="alert">{loadingError}</div>;
  if (existingLead === undefined) return <div className="loading-state" role="status">Loading lead details…</div>;

  return (
    <form className="form-stack" onSubmit={submit}>
      {saveError ? <div className="alert alert--error" role="alert">{saveError}</div> : null}
      {existingLead ? <p>Saving will update the existing lead for {existingLead.name}.</p> : null}
      <LeadFields
        initial={{
          ...existingLead,
          name: call.contactName,
          phone: call.phone,
          field: call.field,
          assignedSalesperson: call.assignedSalesperson,
          socialMedia: call.socialMedia || existingLead?.socialMedia,
          bookedDate: call.scheduledAt,
          status: existingLead?.status ?? "joined",
          finalNotes: existingLead?.finalNotes || call.notes,
        }}
        fields={fields}
        salespeople={salespeople}
      />
      <label className="field">
        <span>Call response (optional)</span>
        <SmartInput id="complete-response" name="response" options={responses} maxLength={120} placeholder="What was their response?" />
      </label>
      <label className="field">
        <span>Follow-up notes (optional)</span>
        <textarea name="followUpNotes" rows={3} defaultValue={existingLead?.finalNotes ? call.notes : undefined} />
        <small>Call responses and follow-up notes appear in the lead’s history.</small>
      </label>
      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : existingLead ? "Complete call and update lead" : "Complete call and add lead"}
        </button>
      </div>
    </form>
  );
}
