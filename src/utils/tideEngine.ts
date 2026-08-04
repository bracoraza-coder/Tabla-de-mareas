import { Port, TideDayData, MonthlyTideRow, CurvePoint, TideEvent } from '../types';
import { getLunarPhase, calculateCoefficient, getMoonPhaseDetails, getSunriseSunset, mod } from './mathHelpers';
import { getZonedParts } from './timezoneHelpers';

/**
 * ------------------------------------------------------------------
 * ALGORITHMIC TIDE ENGINE
 * Generates realistic-looking synthetic tide data using harmonic math
 * based on the port's constants. 
 * Note: For production navigation, real IHM data is required.
 * ------------------------------------------------------------------
 */

export function calculateTideDayData(port: Port, date: Date): TideDayData {
  const jd = date.getTime() / 86400000;
  const lunarPhase = getLunarPhase(date);
  const coefficient = calculateCoefficient(lunarPhase);
  const moonDetails = getMoonPhaseDetails(lunarPhase);
  const sunInfo = getSunriseSunset(date, port.lat);

  // M2 Tidal constituent period is approx 12.4206 hours
  const lunarDayHours = 24.8412;
  
  // Phase shift based on port offset + lunar cycle
  const lunarCycleOffset = lunarPhase * lunarDayHours; 
  const portOffsetHours = port.phaseDelayMinutes / 60;
  let firstHighTideHour = mod(lunarCycleOffset + portOffsetHours, 12.4206);
  if (firstHighTideHour < 0) firstHighTideHour += 12.4206;

  const events: TideEvent[] = [];
  const curvePoints: CurvePoint[] = [];

  // Amplitude modulates with coefficient (30 = base, 120 = base+amp)
  const currentAmplitude = (coefficient / 120) * port.amplitude;

  // Generate 24 hours of points + calculate extremes
  for (let m = 0; m <= 24 * 60; m += 15) {
    const hours = m / 60;
    // Simple cosine wave for tide height
    const rads = ((hours - firstHighTideHour) / 12.4206) * 2 * Math.PI;
    const height = port.baseHeight + currentAmplitude * Math.cos(rads);
    
    curvePoints.push({
      time: `${String(Math.floor(hours)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`,
      height
    });

    // Detect peaks and valleys (roughly)
    if (m > 0 && m < 24 * 60) {
      const prevRads = (((m - 15)/60 - firstHighTideHour) / 12.4206) * 2 * Math.PI;
      const nextRads = (((m + 15)/60 - firstHighTideHour) / 12.4206) * 2 * Math.PI;
      
      const prevH = port.baseHeight + currentAmplitude * Math.cos(prevRads);
      const nextH = port.baseHeight + currentAmplitude * Math.cos(nextRads);

      if (height > prevH && height > nextH) {
        events.push({
          time: `${String(Math.floor(hours)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`,
          height,
          type: 'pleamar'
        });
      } else if (height < prevH && height < nextH) {
         events.push({
          time: `${String(Math.floor(hours)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`,
          height,
          type: 'bajamar'
        });
      }
    }
  }

  // Sort events
  events.sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number);
    const [bh, bm] = b.time.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  // Calculate current state for "today"
  const now = new Date();
  const options = { timeZone: port.timezone, hour12: false, hour: '2-digit', minute: '2-digit' } as const;
  const nowTimeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
  const [nh, nm] = nowTimeStr.split(':').map(Number);
  const nowMinutes = nh * 60 + nm;

  // Find exact current height
  const nowRads = ((nowMinutes/60 - firstHighTideHour) / 12.4206) * 2 * Math.PI;
  const currentWaterHeight = port.baseHeight + currentAmplitude * Math.cos(nowRads);

  // Determine state (subiendo/bajando) by looking 1 min ahead
  const nextMinRads = (((nowMinutes+1)/60 - firstHighTideHour) / 12.4206) * 2 * Math.PI;
  const nextWaterHeight = port.baseHeight + currentAmplitude * Math.cos(nextMinRads);
  const currentTideState = nextWaterHeight > currentWaterHeight ? 'subiendo' : 'bajando';

  // Find next event
  let nextTide = events[0];
  let nextTideTimeLeftStr = '--:--';
  for (const e of events) {
    const [eh, em] = e.time.split(':').map(Number);
    if ((eh * 60 + em) > nowMinutes) {
      nextTide = e;
      const diff = (eh * 60 + em) - nowMinutes;
      nextTideTimeLeftStr = `${String(Math.floor(diff/60)).padStart(2,'0')}:${String(diff%60).padStart(2,'0')}`;
      break;
    }
  }
  // If all events today have passed, next tide is tomorrow (mocked for UI)
  if ((nextTide.time.split(':').map(Number)[0] * 60 + nextTide.time.split(':').map(Number)[1]) <= nowMinutes) {
     nextTideTimeLeftStr = 'Mañana';
  }

  // Solunar calculations (simplified mock based on phase)
  const activityScore = Math.round((coefficient / 120) * 100);
  
  // Lunar transit approximation for periods
  const transitHour = mod(12 + lunarCycleOffset, 24);
  const majorPeriods = [
    { start: formatTime(transitHour - 1), end: formatTime(transitHour + 1) },
    { start: formatTime(mod(transitHour + 12 - 1, 24)), end: formatTime(mod(transitHour + 12 + 1, 24)) }
  ].sort((a, b) => a.start.localeCompare(b.start));

  const minorPeriods = [
    { start: formatTime(mod(transitHour + 6 - 0.5, 24)), end: formatTime(mod(transitHour + 6 + 0.5, 24)) },
    { start: formatTime(mod(transitHour + 18 - 0.5, 24)), end: formatTime(mod(transitHour + 18 + 0.5, 24)) }
  ].sort((a, b) => a.start.localeCompare(b.start));

  // Format date string correctly matching timezone
  const dateParts = getZonedParts(date.getTime(), port.timezone);
  const dateStr = `${dateParts.year}-${String(dateParts.month).padStart(2,'0')}-${String(dateParts.day).padStart(2,'0')}`;

  return {
    dateStr,
    highLows: events,
    curvePoints,
    coefficient,
    solunar: {
      moonPhaseName: moonDetails.name,
      illuminationPercent: moonDetails.illumination,
      isWaxing: moonDetails.isWaxing,
      activityScore,
      majorPeriods,
      minorPeriods
    },
    sunrise: sunInfo.sunrise,
    sunset: sunInfo.sunset,
    currentWaterHeight,
    currentTideState,
    nextTide,
    nextTideTimeLeftStr
  };
}

export function formatTime(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.floor((decimalHours - h) * 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

export function getMonthlyTideData(port: Port, year: number, month: number): MonthlyTideRow[] {
  const rows: MonthlyTideRow[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d, 12, 0, 0); // midday to avoid timezone edge case shifting days
    const data = calculateTideDayData(port, date);
    
    const highs = data.highLows.filter(e => e.type === 'pleamar').map(e => `${e.time}(${e.height.toFixed(1)}m)`).join(' ');
    const lows = data.highLows.filter(e => e.type === 'bajamar').map(e => `${e.time}(${e.height.toFixed(1)}m)`).join(' ');
    
    rows.push({
      dateStr: data.dateStr,
      dayNumber: d,
      dayName: dayNames[date.getDay()],
      coefficient: data.coefficient,
      highTidesStr: highs,
      lowTidesStr: lows,
      moonPhaseIcon: getMoonPhaseDetails(getLunarPhase(date)).icon,
      moonPhaseName: data.solunar.moonPhaseName,
      solunarScore: Math.max(1, Math.round(data.solunar.activityScore / 20)),
      sunrise: data.sunrise,
      sunset: data.sunset
    });
  }

  return rows;
}

export function formatHeight(meters: number, units: { height: 'm'|'ft' }) {
  if (units.height === 'ft') {
    return `${(meters * 3.28084).toFixed(2)} ft`;
  }
  return `${meters.toFixed(2)} m`;
}

export function degToCompass(num: number): string {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

export function calculateBeaufort(windKnots: number): { beaufortScale: number; beaufortDescription: string } {
  let bf = 0;
  if (windKnots < 1) bf = 0;
  else if (windKnots < 4) bf = 1;
  else if (windKnots < 7) bf = 2;
  else if (windKnots < 11) bf = 3;
  else if (windKnots < 17) bf = 4;
  else if (windKnots < 22) bf = 5;
  else if (windKnots < 28) bf = 6;
  else if (windKnots < 34) bf = 7;
  else if (windKnots < 41) bf = 8;
  else bf = 9;

  const beaufortDescription = ['Calma', 'Ventolina', 'Brisa muy débil', 'Brisa débil', 'Brisa mod.', 'Brisa fresca', 'Brisa fuerte', 'Frescachón', 'Temporal', 'Temporal fuerte'][bf] || 'Huracanado';
  return { beaufortScale: bf, beaufortDescription };
}

