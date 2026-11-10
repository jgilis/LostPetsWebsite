export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseObservedAt(
  value: string,
  now = Date.now(),
): Date | null {
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return null;
  if (at > now) return null;
  return new Date(at);
}
