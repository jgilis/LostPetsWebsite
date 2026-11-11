export const FLAG_REASON_CATEGORIES = [
  "spam",
  "wrong_animal",
  "unsafe",
  "other",
] as const;

export type FlagReasonCategory = (typeof FLAG_REASON_CATEGORIES)[number];

export const MAX_FLAG_NOTE_LENGTH = 400;

export function isFlagReasonCategory(
  value: string,
): value is FlagReasonCategory {
  return (FLAG_REASON_CATEGORIES as readonly string[]).includes(value);
}

export function formatFlagReason(
  category: FlagReasonCategory,
  note: string,
): string {
  const trimmed = note.trim().slice(0, MAX_FLAG_NOTE_LENGTH);
  return trimmed ? `${category}: ${trimmed}` : category;
}

export async function flagReport(reportId: string, reason: string) {
  const res = await fetch(
    "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/flag-report",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId, reason }),
    }
  );

  const data = await res.json();

  if (!data.success) {
    console.error(data.error);
    return false;
  }

  return true;
}