export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return `${hasPlus ? "+" : ""}${digits}`;
}

export function normalizeOption(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function optionKey(value: string) {
  return normalizeOption(value).toLocaleLowerCase("en");
}
