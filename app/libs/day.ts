// app/libs/day.ts
// Convert a local date string (YYYY-MM-DD) or JS Date into a Date object
// that always represents the same "day" key in the DB by storing the
// UTC timestamp that corresponds to local midnight.
//
// Example: If user picks "2025-11-06" in Sri Lanka (UTC+5:30),
// this will return 2025-11-05T18:30:00.000Z — which is the UTC
// representation of 2025-11-06 00:00 local.
// Use this everywhere you store / query DailyCurrencyBalance.date
export function toDayDate(input: string | Date): Date {
  const d = input instanceof Date ? new Date(input) : new Date(input);
  // set to local midnight
  d.setHours(0, 0, 0, 0);
  // convert local midnight to UTC-equivalent timestamp
  const utcMs = d.getTime() - d.getTimezoneOffset() * 60_000;
  return new Date(utcMs);
}

// Helpful: when you need a YYYY-MM-DD string key (no TZ issues)
export function toDayKey(input: string | Date): string {
  const dt = toDayDate(input);
  // produce YYYY-MM-DD in UTC (which matches the stored DB day)
  return dt.toISOString().slice(0, 10);
}
