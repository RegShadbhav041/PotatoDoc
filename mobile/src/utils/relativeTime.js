// Relative timestamps for the notice feed ("2h ago", "3d ago").
// Backend created_at comes from SQLite datetime('now') => UTC "YYYY-MM-DD HH:MM:SS".
const SQLITE_UTC = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/** Parse a backend/local timestamp into a Date, or null when unparseable. */
export function parseTimestamp(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  // SQLite's datetime('now') is UTC but carries no zone marker.
  const iso = SQLITE_UTC.test(raw) ? `${raw.replace(" ", "T")}Z` : raw;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human-friendly age: "just now" | "12m ago" | "5h ago" | "3d ago" | "30 Sep 2026". */
export function relativeTime(value, now = Date.now()) {
  const date = parseTimestamp(value);
  if (!date) return "";
  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Good morning" / "Good afternoon" / "Good evening" from the local hour. */
export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}
