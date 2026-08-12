/**
 * Helps format dates into specific strings locked to a timezone.
 * Resolves hydration mismatches where the server renders UTC and client renders local.
 */
export function formatZonedHHMM(timestamp: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  } catch (e) {
    // fallback if timezone string is invalid
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export function getZoneAbbreviation(timestamp: number, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short'
    }).formatToParts(new Date(timestamp));
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch (e) {
    return '';
  }
}

/**
 * Get Year, Month, Day digits locked to a specific timezone
 */
export function getZonedParts(timestamp: number, timeZone: string) {
  const d = new Date(timestamp);
  const options = { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
  
  return {
    year: parseInt(parts.find(p => p.type === 'year')?.value || d.getFullYear().toString(), 10),
    month: parseInt(parts.find(p => p.type === 'month')?.value || (d.getMonth() + 1).toString(), 10),
    day: parseInt(parts.find(p => p.type === 'day')?.value || d.getDate().toString(), 10),
  };
}
