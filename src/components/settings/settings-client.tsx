"use client";

import { FormEvent, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { useOptions } from "@/hooks/use-options";
import type { OptionType, SavedOption } from "@/types/crm";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";

const groups: Array<{ type: OptionType; title: string; description: string }> = [
  { type: "field", title: "Lead fields", description: "Industries and course niches used in lead and call forms." },
  { type: "salesperson", title: "Salespeople", description: "Names available for lead ownership and call assignment." },
  { type: "response", title: "Follow-up responses", description: "Reusable result labels such as Interested or No answer." },
];

export function SettingsClient() {
  const options = useOptions();
  const [saving, setSaving] = useState<OptionType | "">("");
  const [error, setError] = useState("");

  async function add(event: FormEvent<HTMLFormElement>, type: OptionType) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = String(form.get("value") ?? "").trim();
    if (!value) return;
    setSaving(type);
    setError("");
    try {
      await clientApi("/api/options", { method: "POST", body: JSON.stringify({ type, value }) });
      formElement.reset();
      await options.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save value.");
    } finally {
      setSaving("");
    }
  }

  async function archive(item: SavedOption) {
    if (!window.confirm(`Remove “${item.value}” from future select boxes? Existing records will not change.`)) return;
    await clientApi(`/api/options/${item._id}`, { method: "DELETE" });
    await options.refresh();
  }

  return (
    <div className="page-wrap">
      <header className="page-header page-header--compact">
        <div>
          <span className="eyebrow">Workspace configuration</span>
          <h1>Saved values that grow with the team.</h1>
          <p>Fields, salesperson names and responses are also saved automatically whenever someone types a new value.</p>
        </div>
      </header>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <section className="settings-grid">
        {groups.map((group) => {
          const items = options.items.filter((item) => item.type === group.type);
          return (
            <article className="panel settings-card" key={group.type}>
              <header><span className="settings-icon"><Icon name={group.type === "field" ? "trend" : group.type === "salesperson" ? "people" : "note"} /></span><div><h2>{group.title}</h2><p>{group.description}</p></div></header>
              <form className="inline-add-form" onSubmit={(event) => add(event, group.type)}><input name="value" placeholder={`Add ${group.title.toLowerCase().replace(/s$/, "")}`} /><button className="button button--primary" type="submit" disabled={saving === group.type}><Icon name="plus" /> Add</button></form>
              {items.length ? <div className="option-list">{items.map((item) => <div key={item._id}><div><strong>{item.value}</strong><small>Used {item.usageCount} times</small></div><button type="button" onClick={() => archive(item)}>Remove</button></div>)}</div> : <EmptyState icon="settings" title="No saved values" description="Add one here or type it in a lead form." />}
            </article>
          );
        })}
      </section>
    </div>
  );
}
