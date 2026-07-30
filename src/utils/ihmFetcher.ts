import { Port, HighLowTide, TideDayData, HourlyTidePoint, MonthlyTideRow } from '../types';
import { formatTimeHHMM } from './tideEngine';

function getPortTimeZone(port: Port): string {
  if (port.region.includes('Canaria') || port.name.includes('Tenerife') || port.name.includes('Hierro') || port.name.includes('Palma') || port.name.includes('Fuerteventura') || port.name.includes('Lanzarote') || port.name.includes('Gomera')) {
    return 'Atlantic/Canary';
  }
  return 'Europe/Madrid';
}

function parseAndConvertIhmTime(dateStr: string, timeStr: string, tz: string): { localDateStr: string, localTimeStr: string, timeMs: number } {
  const [yyyy, mm, dd] = dateStr.split('-');
  const [hh, min] = timeStr.split(':');
  
  // IHM is in UTC
  const dateUTC = new Date(Date.UTC(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh, 10), parseInt(min, 10), 0));
  const timeMs = dateUTC.getTime();
  
  const formatter = new Intl.DateTimeFormat('es-ES', { 
    timeZone: tz, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(dateUTC);
  const p: Record<string, string> = {};
  parts.forEach(part => p[part.type] = part.value);
  
  // Fallback for hour 24
  let h = p.hour;
  if (h === '24') h = '00';

  return {
    localDateStr: `${p.year}-${p.month}-${p.day}`,
    localTimeStr: `${h}:${p.minute}`,
    timeMs
  };
}

export async function fetchLiveIhmTides(port: Port, date: Date, fallback: TideDayData): Promise<TideDayData> {
  if (!port.ihmId) return fallback;

  try {
    const tz = getPortTimeZone(port);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    // For live, we fetch the whole month to ensure we don't miss cross-day local boundaries
    const monthStr = `${yyyy}${mm}`;
    const targetLocalDay = `${yyyy}-${mm}-${dd}`;

    const url = `/api/proxy/ihm?ihmId=${port.ihmId}&monthStr=${monthStr}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!res.ok) return fallback;
    
    const data = await res.json();
    if (!(data.data?.mareas?.datos?.marea) && !(data.mareas?.datos?.marea)) {
      return fallback;
    }
    
    const rawMareas = (data.data?.mareas?.datos?.marea || data.mareas?.datos?.marea);
    const newHighLows: HighLowTide[] = [];
    
    for (const m of rawMareas) {
      const { localDateStr, localTimeStr, timeMs } = parseAndConvertIhmTime(m.fecha, m.hora, tz);
      
      // Only keep the ones for our target local day!
      if (localDateStr === targetLocalDay) {
        newHighLows.push({
          type: m.tipo === 'pleamar' ? 'pleamar' : 'bajamar',
          time: localTimeStr,
          height: parseFloat(m.altura),
          timestamp: timeMs,
        });
      }
    }

    const baseTimestamp = new Date(yyyy, date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
    const newHourlyPoints: HourlyTidePoint[] = [];
    
    const allExtremes = [...newHighLows];
    if (allExtremes.length > 0) {
      const first = allExtremes[0];
      const prevTime = first.timestamp - 6.2 * 3600 * 1000;
      const prevType = first.type === 'pleamar' ? 'bajamar' : 'pleamar';
      const prevHeight = first.type === 'pleamar' ? first.height - port.amplitude : first.height + port.amplitude;
      allExtremes.unshift({ type: prevType, time: '', height: Math.max(0.1, prevHeight), timestamp: prevTime });
      
      const last = allExtremes[allExtremes.length - 1];
      const nextTime = last.timestamp + 6.2 * 3600 * 1000;
      const nextType = last.type === 'pleamar' ? 'bajamar' : 'pleamar';
      const nextHeight = last.type === 'pleamar' ? last.height - port.amplitude : last.height + port.amplitude;
      allExtremes.push({ type: nextType, time: '', height: Math.max(0.1, nextHeight), timestamp: nextTime });
    }
    
    for (let mins = 0; mins <= 24 * 60; mins += 30) {
      const timeMs = baseTimestamp + mins * 60 * 1000;
      const d = new Date(timeMs);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      
      let prevE = allExtremes[0];
      let nextE = allExtremes[1];
      
      for (let i = 0; i < allExtremes.length - 1; i++) {
        if (timeMs >= allExtremes[i].timestamp && timeMs <= allExtremes[i+1].timestamp) {
          prevE = allExtremes[i];
          nextE = allExtremes[i+1];
          break;
        }
      }
      
      const segmentDuration = nextE.timestamp - prevE.timestamp;
      let progress = 0;
      if (segmentDuration > 0) {
        progress = (timeMs - prevE.timestamp) / segmentDuration;
      }
      
      const factor = (1 - Math.cos(progress * Math.PI)) / 2;
      const height = prevE.height + (nextE.height - prevE.height) * factor;
      
      newHourlyPoints.push({
        time: `${hh}:${mm}`,
        timeLabel: `${hh}:${mm}`,
        height: Math.round(height * 100) / 100,
        timestamp: timeMs,
      });
    }

    return {
      ...fallback,
      highLows: newHighLows,
      hourlyPoints: newHourlyPoints,
    };

  } catch (err) {
    console.error('Error fetching IHM tides:', err);
    return fallback;
  }
}

export async function fetchMonthlyIhmTides(port: Port, year: number, month: number, fallbackRows: MonthlyTideRow[]): Promise<MonthlyTideRow[]> {
  if (!port.ihmId) return fallbackRows;

  try {
    const tz = getPortTimeZone(port);
    const yyyy = year.toString();
    const mm = String(month + 1).padStart(2, '0');
    const monthStr = `${yyyy}${mm}`;

    const url = `/api/proxy/ihm?ihmId=${port.ihmId}&monthStr=${monthStr}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!res.ok) return fallbackRows;
    
    const data = await res.json();
    if (!(data.data?.mareas?.datos?.marea) && !(data.mareas?.datos?.marea)) {
      return fallbackRows;
    }
    
    const rawMareas = (data.data?.mareas?.datos?.marea || data.mareas?.datos?.marea);
    const daysMap: Record<string, { high: string[], low: string[] }> = {};
    
    for (const m of rawMareas) {
      const { localDateStr, localTimeStr } = parseAndConvertIhmTime(m.fecha, m.hora, tz);

      if (!daysMap[localDateStr]) {
        daysMap[localDateStr] = { high: [], low: [] };
      }
      
      const heightFmt = parseFloat(m.altura).toFixed(1);
      if (m.tipo === 'pleamar') {
        daysMap[localDateStr].high.push(`${localTimeStr} (${heightFmt}m)`);
      } else {
        daysMap[localDateStr].low.push(`${localTimeStr} (${heightFmt}m)`);
      }
    }

    const newRows = fallbackRows.map(row => {
      const dayData = daysMap[row.dateStr];
      if (dayData) {
        return {
          ...row,
          highTidesStr: dayData.high.join(' / '),
          lowTidesStr: dayData.low.join(' / '),
        };
      }
      return row;
    });

    return newRows;

  } catch (err) {
    console.error('Error fetching monthly IHM tides:', err);
    return fallbackRows;
  }
}
