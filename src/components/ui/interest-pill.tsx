import type { ClientInterestLevel } from "@/types/crm";

const labels: Record<ClientInterestLevel, string> = {
  unrated: "Not rated",
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
};

export function InterestPill({ level }: { level: ClientInterestLevel }) {
  return <span className={`interest-pill interest-pill--${level}`}>{labels[level]}</span>;
}

export function interestLabel(level: ClientInterestLevel) {
  return labels[level];
}
