export function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-EG", {
    timeZone: "Africa/Cairo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelative(value?: string) {
  if (!value) return "Not scheduled";
  const deltaMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(deltaMinutes) < 60) return formatter.format(deltaMinutes, "minute");
  const hours = Math.round(deltaMinutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function isOverdue(value?: string) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}
