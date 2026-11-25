import type { LeadStatus } from "@/types/crm";

const labels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  potential: "Potential client",
  call_booked: "Call booked",
  joined: "Converted",
  lost: "Lost",
};

export function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{labels[status]}</span>;
}

export function statusLabel(status: LeadStatus) {
  return labels[status];
}
