/**
 * Timezone-aware date helpers.
 *
 * The bug this file fixes: the app used to read hours/minutes with the
 * browser's own local timezone (Date.getHours/getMinutes), which is only
 * correct when the visitor happens to be in the same timezone as the
 * selected port. For any other port - e.g. someone in Spain checking the
 * tide table for Tokyo - the displayed times (and even the shape of the
 * tide curve itself) were silently wrong.
 *
 * Everything here uses Intl.DateTimeFormat with an explicit IANA `timeZone`,
 * which is a native, free, built-in browser API (no external service, no
 * library) that correctly handles each port's real offset and DST rules.
 */

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0 (Sun) - 6 (Sat)
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsFormatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    partsFormatterCache.set(timeZone, fmt);
  }
  return fmt;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Returns the calendar date/time as it appears in `timeZone` for a given instant. */
export function getZonedParts(timestampMs: number, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(new Date(timestampMs));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    // Intl can return "24" for midnight in some environments; normalise to 0.
    hour: parseInt(map.hour, 10) % 24,
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

/** Fractional hour of the day (0.00 - 23.99) as seen in the port's own timezone. */
export function getZonedFractionalHours(timestampMs: number, timeZone: string): number {
  const p = getZonedParts(timestampMs, timeZone);
  return p.hour + p.minute / 60 + p.second / 3600;
}

/** "HH:mm" as seen in the given timezone. */
export function formatZonedHHMM(timestampMs: number, timeZone: string): string {
  const p = getZonedParts(timestampMs, timeZone);
  return `${p.hour.toString().padStart(2, '0')}:${p.minute.toString().padStart(2, '0')}`;
}

/**
 * Converts a "wall clock" date/time in a given IANA timezone into the
 * corresponding absolute UTC timestamp (ms). Used to find, for example,
 * "00:00:00 in Tokyo" as a real point in time, regardless of the visitor's
 * own timezone.
 */
export function zonedTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): number {
  // Start with a naive guess treating the wall-clock values as UTC, then
  // correct twice using the zone's actual offset at that instant (two
  // passes is enough to converge even across DST transitions).
  let guess = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 2; i++) {
    const zoned = getZonedParts(guess, timeZone);
    const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
    const diff = zonedAsUtc - guess;
    guess = Date.UTC(year, month - 1, day, hour, minute, second) - diff;
  }
  return guess;
}

/** Short zone label for display, e.g. "JST", "CET", "GMT-5". */
export function getZoneAbbreviation(timestampMs: number, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' });
    const part = fmt.formatToParts(new Date(timestampMs)).find(p => p.type === 'timeZoneName');
    return part?.value || timeZone;
  } catch {
    return timeZone;
  }
}

/** UTC offset label, e.g. "UTC+9", "UTC-5". */
export function getUtcOffsetLabel(timestampMs: number, timeZone: string): string {
  const zoned = getZonedParts(timestampMs, timeZone);
  const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  const offsetMinutes = Math.round((zonedAsUtc - timestampMs) / 60000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${m.toString().padStart(2, '0')}` : ''}`;
}
