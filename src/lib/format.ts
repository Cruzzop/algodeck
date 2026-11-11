const DAY_MS = 86_400_000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return new Date(d.getTime() - 1);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Local-time date key, e.g. 2026-11-12. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Whole-day difference between a date and today (negative = past). */
export function daysFromToday(value: string | Date): number {
  const target = startOfDay(new Date(value));
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type DueTone = "danger" | "warn" | "soon" | "muted";

export function dueLabel(value: string | null): { text: string; tone: DueTone } {
  if (!value) return { text: "Not scheduled", tone: "muted" };
  const diff = daysFromToday(value);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, tone: "danger" };
  if (diff === 0) return { text: "Today", tone: "warn" };
  if (diff === 1) return { text: "Tomorrow", tone: "soon" };
  if (diff <= 14) return { text: `In ${diff}d`, tone: "soon" };
  return { text: formatDate(value), tone: "muted" };
}

export function relativeTime(value: string | Date): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return formatDate(value);
}

export function intervalLabel(days: number): string {
  if (days <= 0) return "10 min";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
