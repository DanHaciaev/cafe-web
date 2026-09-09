// SQLite's `current_timestamp` default produces "YYYY-MM-DD HH:MM:SS" in UTC
// with no timezone marker. Browsers parse that space-separated (non-ISO)
// form as local time instead of UTC, so `new Date(value)` silently skips the
// UTC → local conversion and every displayed time comes out wrong by the
// timezone offset. Rewriting to ISO-8601 with an explicit "Z" fixes that.
export function parseSqliteUtcDate(value: string): Date {
  return new Date(value.replace(" ", "T") + "Z");
}
