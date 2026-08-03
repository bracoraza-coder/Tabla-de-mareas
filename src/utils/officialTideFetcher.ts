import { Port } from '../types';

export interface OfficialTideResult {
  ok: boolean;
  source?: string;
  stationName?: string;
  reason?: string;
  tides?: { time: string; height: number; type: 'pleamar' | 'bajamar' }[];
}

/**
 * Calls our own backend (/api/mareas), which in turn queries the official
 * IHM API server-side. Never calls the IHM directly from the browser.
 * Always resolves (never throws) - on any failure it returns { ok: false }
 * so the caller can fall back to the local estimation model.
 */
export async function fetchOfficialTides(port: Port, dateStr: string): Promise<OfficialTideResult> {
  try {
    const shortName = port.name.split(' (')[0];
    const params = new URLSearchParams({
      port: port.id,
      portName: shortName,
      date: dateStr,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`/api/mareas?${params.toString()}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const data = await res.json();
    return data;
  } catch (err) {
    return { ok: false, reason: 'network-error' };
  }
}

/** Parses the backend's "HH:mm" or ISO time string into a real timestamp for the given date/timezone. */
export function parseOfficialTimeToTimestamp(timeStr: string, dateStr: string, timezone: string): number | null {
  // Accept "HH:mm", "HH:mm:ss", or a full ISO string.
  const isoMatch = timeStr.match(/^\d{4}-\d{2}-\d{2}T/);
  if (isoMatch) {
    const t = new Date(timeStr).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const hhmm = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!hhmm) return null;
  const [, hh, mm] = hhmm;
  const [y, mo, d] = dateStr.split('-').map(Number);

  // Reuse the same zoned-time-to-UTC conversion approach as the rest of the app.
  let guess = Date.UTC(y, mo - 1, d, parseInt(hh, 10), parseInt(mm, 10), 0);
  for (let i = 0; i < 2; i++) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const map: Record<string, string> = {};
    fmt.formatToParts(new Date(guess)).forEach(p => { map[p.type] = p.value; });
    const zonedAsUtc = Date.UTC(+map.year, +map.month - 1, +map.day, (+map.hour) % 24, +map.minute, +map.second);
    guess = Date.UTC(y, mo - 1, d, parseInt(hh, 10), parseInt(mm, 10), 0) - (zonedAsUtc - guess);
  }
  return guess;
}
