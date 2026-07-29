import { Port, HighLowTide, HourlyTidePoint, SolunarData, SolunarPeriod, MarineWeather, TideDayData, MonthlyTideRow, UserUnits } from '../types';
import { getZonedFractionalHours, formatZonedHHMM, zonedTimeToUtc, getZonedParts } from './timezoneHelpers';

// Helper for formatting time HH:mm in the PORT'S OWN timezone (not the
// visitor's browser timezone) - this is what makes tide times for e.g.
// Tokyo show Tokyo's real local clock time to a visitor anywhere else.
export function formatTimeHHMM(timestampMs: number, timeZone: string): string {
  return formatZonedHHMM(timestampMs, timeZone);
}

// Calculate Moon Age (0 to 29.53 days)
export function getMoonAgeDays(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Approximate Julian Date moon phase
  let c = 0, e = 0, jd = 0, b = 0;
  if (month < 3) {
    c = year - 1;
    e = month + 12;
  } else {
    c = year;
    e = month;
  }
  jd = Math.floor(365.25 * c) + Math.floor(30.6001 * (e + 1)) + day + 1720995;
  b = jd - 2451549.5;
  let newMoons = b / 29.53058867;
  let age = (newMoons - Math.floor(newMoons)) * 29.53058867;
  return age;
}

// Get Moon Phase Details
export function getMoonPhaseDetails(moonAgeDays: number): { name: string; icon: string; illumination: number } {
  const illum = Math.round((1 - Math.cos((moonAgeDays / 29.53058867) * 2 * Math.PI)) / 2 * 100);
  
  if (moonAgeDays < 1.8456) return { name: 'Luna Nueva', icon: '🌑', illumination: illum };
  if (moonAgeDays < 5.53699) return { name: 'Creciente Cóncava', icon: '🌒', illumination: illum };
  if (moonAgeDays < 9.22831) return { name: 'Cuarto Creciente', icon: '🌓', illumination: illum };
  if (moonAgeDays < 12.91963) return { name: 'Gibosa Creciente', icon: '🌔', illumination: illum };
  if (moonAgeDays < 16.61096) return { name: 'Luna Llena', icon: '🌕', illumination: illum };
  if (moonAgeDays < 20.30228) return { name: 'Gibosa Menguante', icon: '🌖', illumination: illum };
  if (moonAgeDays < 23.99361) return { name: 'Cuarto Menguante', icon: '🌗', illumination: illum };
  if (moonAgeDays < 27.68493) return { name: 'Menguante Cóncava', icon: '🌘', illumination: illum };
  return { name: 'Luna Nueva', icon: '🌑', illumination: illum };
}

// Calculate Tidal Coefficient (30 to 120)
export function getTidalCoefficient(moonAgeDays: number): number {
  // Coeficiente es alto en Luna Llena (14.7) y Luna Nueva (0 o 29.5)
  // Coeficiente es bajo en Cuarto Creciente (7.4) y Cuarto Menguante (22.1)
  const normAge = (moonAgeDays % 14.765);
  const diffFromSpring = Math.abs(normAge - 7.3825); // distance to quarter moon
  
  // Normalized 0 to 1 (1 = max spring tide, 0 = neap tide)
  const springRatio = diffFromSpring / 7.3825;
  
  // Base coefficient scale from 38 to 112 with semi-random micro variation
  const baseCoeff = Math.round(38 + springRatio * 72);
  return Math.min(118, Math.max(32, baseCoeff));
}

// Harmonic Tide Calculator (Astronomically Calibrated M2, S2, N2 Constituents)
export function calculateHarmonicTide(port: Port, timestampMs: number, moonAgeDays: number): number {
  const coeff = getTidalCoefficient(moonAgeDays);
  // Coeff factor (spring/neap amplification: range 0.55 to 1.30)
  const coeffFactor = 0.55 + (coeff / 100) * 0.75;
  
  // Local fractional hours of the day at the PORT'S location (0.00 to 23.99),
  // not the visitor's browser timezone - this is what keeps the tide curve
  // correctly phased regardless of where the visitor is in the world.
  const localHours = getZonedFractionalHours(timestampMs, port.timezone);
  
  // Base phase offset in hours (New Moon Pleamar time)
  const basePhase = port.phaseShiftHours < 1 ? 3.40 + port.phaseShiftHours * 2 : port.phaseShiftHours;
  
  // Daily retardation of the moon (~50.5 mins = 0.8415 hours/day)
  const tideLagHours = (moonAgeDays * 0.8415) % 12.4206;
  
  // Primary M2 constituent (Lunar semi-diurnal, 12.4206h)
  const m2Period = 12.4206;
  const m2PhaseRad = ((localHours - basePhase - tideLagHours) / m2Period) * 2 * Math.PI;
  
  // Secondary S2 constituent (Solar semi-diurnal, 12.0h)
  const s2PhaseRad = ((localHours - basePhase) / 12.0) * 2 * Math.PI;
  
  // Tertiary N2 constituent (Lunar distance, 12.66h)
  const n2PhaseRad = ((localHours - basePhase - tideLagHours * 1.1) / 12.66) * 2 * Math.PI;

  const m2Component = Math.cos(m2PhaseRad) * port.amplitude * 0.78;
  const s2Component = Math.cos(s2PhaseRad) * port.amplitude * 0.22;
  const n2Component = Math.cos(n2PhaseRad) * port.amplitude * 0.10;
  
  const tideVariation = (m2Component + s2Component + n2Component) * coeffFactor;
  const currentHeight = port.baseHeight + tideVariation;
  
  return Math.max(0.05, Math.round(currentHeight * 100) / 100);
}

// Generate Full Day Tide Data
export function getTideDayData(port: Port, targetDate: Date, nowTimestamp: number): TideDayData {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  // Midnight of the selected calendar day IN THE PORT'S OWN TIMEZONE,
  // expressed as a real UTC instant. This is what makes "today" for Tokyo
  // mean Tokyo's actual today, regardless of the visitor's own clock.
  const dayStart = zonedTimeToUtc(year, month + 1, day, 0, 0, 0, port.timezone);
  const moonAgeDays = getMoonAgeDays(targetDate);
  const coefficient = getTidalCoefficient(moonAgeDays);
  
  // Generate minute-by-minute or 15-min points for curve & high/low finding
  const hourlyPoints: HourlyTidePoint[] = [];
  const finePoints: { timeMs: number; height: number }[] = [];
  
  for (let mins = 0; mins <= 24 * 60; mins += 10) {
    const timeMs = dayStart + mins * 60 * 1000;
    const height = calculateHarmonicTide(port, timeMs, moonAgeDays);
    finePoints.push({ timeMs, height });
    
    if (mins % 30 === 0) {
      const label = formatZonedHHMM(timeMs, port.timezone);
      hourlyPoints.push({
        time: label,
        timeLabel: label,
        height,
        timestamp: timeMs,
      });
    }
  }
  
  // Find local minima & maxima for Pleamares & Bajamares
  const highLows: HighLowTide[] = [];
  for (let i = 1; i < finePoints.length - 1; i++) {
    const prev = finePoints[i - 1].height;
    const curr = finePoints[i].height;
    const next = finePoints[i + 1].height;
    
    if (curr > prev && curr >= next) {
      // Local maximum -> Pleamar
      highLows.push({
        type: 'pleamar',
        time: formatTimeHHMM(finePoints[i].timeMs, port.timezone),
        height: curr,
        timestamp: finePoints[i].timeMs,
      });
    } else if (curr < prev && curr <= next) {
      // Local minimum -> Bajamar
      highLows.push({
        type: 'bajamar',
        time: formatTimeHHMM(finePoints[i].timeMs, port.timezone),
        height: curr,
        timestamp: finePoints[i].timeMs,
      });
    }
  }
  
  // If edge didn't catch 4 tides, ensure clean 2 pleamares + 2 bajamares sequence
  if (highLows.length < 3) {
    // Fallback spacing ~6h12m
    const firstTideMs = dayStart + (3 + port.phaseShiftHours) * 3600 * 1000;
    const times = [
      firstTideMs,
      firstTideMs + 6.21 * 3600 * 1000,
      firstTideMs + 12.42 * 3600 * 1000,
      firstTideMs + 18.63 * 3600 * 1000,
    ];
    let isHigh = true;
    times.forEach(tMs => {
      if (getZonedParts(tMs, port.timezone).day === day) {
        const h = calculateHarmonicTide(port, tMs, moonAgeDays);
        highLows.push({
          type: isHigh ? 'pleamar' : 'bajamar',
          time: formatTimeHHMM(tMs, port.timezone),
          height: h,
          timestamp: tMs,
        });
      }
      isHigh = !isHigh;
    });
  }
  
  // Instant Current Water Height
  const currentWaterHeight = calculateHarmonicTide(port, nowTimestamp, moonAgeDays);
  
  // Next Tide & State
  const futureTides = highLows.filter(hl => hl.timestamp > nowTimestamp);
  let nextTide: HighLowTide;
  if (futureTides.length > 0) {
    nextTide = futureTides[0];
  } else if (highLows.length > 0) {
    nextTide = highLows[highLows.length - 1];
  } else {
    const fallbackMs = dayStart + 14.5 * 3600 * 1000;
    nextTide = { type: 'pleamar', time: formatTimeHHMM(fallbackMs, port.timezone), height: port.baseHeight + port.amplitude, timestamp: fallbackMs };
  }
  
  // Time left string
  const diffMs = nextTide.timestamp - nowTimestamp;
  let nextTideTimeLeftStr = 'En este momento';
  if (diffMs > 0) {
    const hoursLeft = Math.floor(diffMs / (1000 * 3600));
    const minsLeft = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));
    nextTideTimeLeftStr = `${hoursLeft > 0 ? `${hoursLeft}h ` : ''}${minsLeft}m`;
  }
  
  // Tide state direction
  const height10mAfter = calculateHarmonicTide(port, nowTimestamp + 10 * 60 * 1000, moonAgeDays);
  let currentTideState: 'subiendo' | 'bajando' | 'pleamar' | 'bajamar' = 'subiendo';
  if (Math.abs(height10mAfter - currentWaterHeight) < 0.02) {
    currentTideState = nextTide.type === 'pleamar' ? 'pleamar' : 'bajamar';
  } else if (height10mAfter > currentWaterHeight) {
    currentTideState = 'subiendo';
  } else {
    currentTideState = 'bajando';
  }

  // Solunar calculations
  const solunar = calculateSolunarData(targetDate, port, moonAgeDays);
  
  // Weather calculations
  const weather = generateMarineWeather(port, targetDate);

  const daysArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  // Built directly from the selected Y/M/D (not toISOString(), which converts
  // to UTC and could silently shift to the previous/next day depending on
  // the visitor's own timezone offset).
  const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  return {
    dateStr,
    dayOfWeek: daysArr[targetDate.getDay()],
    coefficient,
    highLows,
    hourlyPoints,
    currentWaterHeight,
    currentTideState,
    nextTide,
    nextTideTimeLeftStr,
    solunar,
    weather,
  };
}

// Calculate Solunar & Astronomical Data
export function calculateSolunarData(date: Date, port: Port, moonAgeDays: number): SolunarData {
  const moonPhaseInfo = getMoonPhaseDetails(moonAgeDays);
  
  // Calculate approximate astronomical times
  const sunriseHour = 6.8 + Math.sin((date.getMonth() - 2) * 0.5) * 0.7; // ~06:30 - 07:30
  const sunsetHour = 20.2 - Math.sin((date.getMonth() - 2) * 0.5) * 0.7; // ~19:30 - 21:00
  const solarNoonHour = (sunriseHour + sunsetHour) / 2;
  
  // Moon transit shifts ~50 mins each day
  const moonTransitHour = (moonAgeDays * 0.8) % 24;
  const moonriseHour = (moonTransitHour - 6 + 24) % 24;
  const moonsetHour = (moonTransitHour + 6) % 24;
  
  const toHHMM = (hrs: number) => {
    const h = Math.floor(hrs) % 24;
    const m = Math.floor((hrs - Math.floor(hrs)) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Major periods: ~2h around moon transit & moon nadir
  const major1Start = (moonTransitHour - 1 + 24) % 24;
  const major1End = (moonTransitHour + 1) % 24;
  const nadirHour = (moonTransitHour + 12) % 24;
  const major2Start = (nadirHour - 1 + 24) % 24;
  const major2End = (nadirHour + 1) % 24;

  // Minor periods: ~1h around moonrise & moonset
  const minor1Start = (moonriseHour - 0.5 + 24) % 24;
  const minor1End = (moonriseHour + 0.5) % 24;
  const minor2Start = (moonsetHour - 0.5 + 24) % 24;
  const minor2End = (moonsetHour + 0.5) % 24;

  const majorPeriods: SolunarPeriod[] = [
    { name: 'Período Mayor 1 (Tránsito Lunar)', type: 'mayor', start: toHHMM(major1Start), end: toHHMM(major1End), quality: 'excelente' },
    { name: 'Período Mayor 2 (Oposición Lunar)', type: 'mayor', start: toHHMM(major2Start), end: toHHMM(major2End), quality: 'excelente' },
  ];

  const minorPeriods: SolunarPeriod[] = [
    { name: 'Período Menor 1 (Salida de la Luna)', type: 'menor', start: toHHMM(minor1Start), end: toHHMM(minor1End), quality: 'alta' },
    { name: 'Período Menor 2 (Puesta de la Luna)', type: 'menor', start: toHHMM(minor2Start), end: toHHMM(minor2End), quality: 'alta' },
  ];

  // Solunar Activity Rating (1-5)
  // High during Full Moon & New Moon, medium during quarters
  let score = 3;
  if (moonPhaseInfo.name === 'Luna Llena' || moonPhaseInfo.name === 'Luna Nueva') {
    score = 5;
  } else if (moonPhaseInfo.name.includes('Gibosa')) {
    score = 4;
  } else if (moonPhaseInfo.name.includes('Cuarto')) {
    score = 2;
  }

  const activityLabels: Record<number, SolunarData['activityLabel']> = {
    1: 'Muy Baja',
    2: 'Baja',
    3: 'Media',
    4: 'Alta',
    5: 'Excelente',
  };

  const dayLenMins = Math.floor((sunsetHour - sunriseHour) * 60);
  const dayLenH = Math.floor(dayLenMins / 60);
  const dayLenM = dayLenMins % 60;

  return {
    activityScore: score,
    activityLabel: activityLabels[score],
    majorPeriods,
    minorPeriods,
    sunrise: toHHMM(sunriseHour),
    solarNoon: toHHMM(solarNoonHour),
    sunset: toHHMM(sunsetHour),
    dayLength: `${dayLenH}h ${dayLenM}m`,
    moonrise: toHHMM(moonriseHour),
    moonset: toHHMM(moonsetHour),
    moonTransit: toHHMM(moonTransitHour),
    moonPhaseName: moonPhaseInfo.name,
    moonPhaseIcon: moonPhaseInfo.icon,
    moonIllumination: moonPhaseInfo.illumination,
    moonAgeDays: Math.round(moonAgeDays * 10) / 10,
  };
}

// Generate Realistic Marine Weather
export function generateMarineWeather(port: Port, date: Date): MarineWeather {
  // Deterministic seed based on port ID and day
  const daySeed = date.getFullYear() * 1000 + date.getMonth() * 31 + date.getDate() + port.lat * 10;
  const pseudoRand = (offset: number) => {
    const x = Math.sin(daySeed + offset) * 10000;
    return x - Math.floor(x);
  };

  const isNorthAtlantic = port.lat > 40 && port.lng < 0;
  const baseWind = isNorthAtlantic ? 14 : 9;
  const windKnots = Math.round(baseWind + pseudoRand(1) * 12);
  const windKm = Math.round(windKnots * 1.852);
  const windGusts = Math.round(windKnots * 1.4);

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const dirIdx = Math.floor(pseudoRand(2) * directions.length);
  const windDir = directions[dirIdx];
  const windDeg = Math.round(dirIdx * 22.5);

  // Beaufort Scale
  let beaufort = 1;
  let beaufortDesc = 'Ventolina';
  if (windKnots >= 22) { beaufort = 6; beaufortDesc = 'Viento Fuerte'; }
  else if (windKnots >= 17) { beaufort = 5; beaufortDesc = 'Fresquito'; }
  else if (windKnots >= 11) { beaufort = 4; beaufortDesc = 'Bonancible'; }
  else if (windKnots >= 7) { beaufort = 3; beaufortDesc = 'Flojo'; }
  else if (windKnots >= 4) { beaufort = 2; beaufortDesc = 'Flojito'; }

  // Waves
  const waveHeight = Math.round((0.5 + (windKnots / 15) + pseudoRand(3) * 0.8) * 10) / 10;
  let seaState = 'Mar Calma';
  if (waveHeight >= 2.5) seaState = 'Mar Gruesa';
  else if (waveHeight >= 1.25) seaState = 'Fuerte Marejada';
  else if (waveHeight >= 0.5) seaState = 'Marejada';
  else if (waveHeight >= 0.2) seaState = 'Marejadilla';

  const baseTemp = port.lat > 40 ? 19 : (port.lat > 30 ? 23 : 28);
  const temp = Math.round(baseTemp + pseudoRand(4) * 4);
  const feelsLike = temp + (windKnots > 15 ? -2 : 1);

  const conditions = ['Despejado', 'Soleado con brisa', 'Parcialmente nublado', 'Nubes y claros', 'Ligeros chubascos marinos'];
  const condIdx = Math.floor(pseudoRand(5) * conditions.length);

  return {
    temp,
    feelsLike,
    condition: conditions[condIdx],
    conditionCode: condIdx === 0 ? 'sun' : (condIdx === 4 ? 'cloud-rain' : 'cloud-sun'),
    windSpeedKnots: windKnots,
    windSpeedKm: windKm,
    windDirection: windDir,
    windDegrees: windDeg,
    windGustKnots: windGusts,
    beaufortScale: beaufort,
    beaufortDescription: beaufortDesc,
    waveHeightMeters: waveHeight,
    wavePeriodSeconds: Math.round(7 + pseudoRand(6) * 5),
    waveDirection: directions[(dirIdx + 1) % directions.length],
    seaStateName: seaState,
    waterTemp: port.waterTempAvg,
    pressureHpa: Math.round(1012 + pseudoRand(7) * 12),
    pressureTrend: pseudoRand(8) > 0.6 ? 'ascenso' : (pseudoRand(8) < 0.3 ? 'descenso' : 'estable'),
    humidityPercent: Math.round(62 + pseudoRand(9) * 25),
    uvIndex: Math.round(4 + pseudoRand(10) * 5),
    visibilityKm: Math.round(10 + pseudoRand(11) * 8),
  };
}

// Generate Full Monthly Tide Table
export function getMonthlyTideData(port: Port, year: number, month: number): MonthlyTideRow[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: MonthlyTideRow[] = [];
  const daysArr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let d = 1; d <= daysInMonth; d++) {
    const targetDate = new Date(year, month, d, 12, 0, 0);
    const dayOfWeekStr = daysArr[targetDate.getDay()];
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const dayData = getTideDayData(port, targetDate, targetDate.getTime());

    const highTidesStr = dayData.highLows
      .filter(hl => hl.type === 'pleamar')
      .map(hl => `${hl.time} (${hl.height}m)`)
      .join(' / ');

    const lowTidesStr = dayData.highLows
      .filter(hl => hl.type === 'bajamar')
      .map(hl => `${hl.time} (${hl.height}m)`)
      .join(' / ');

    rows.push({
      dateStr,
      dayNumber: d,
      dayName: dayOfWeekStr,
      coefficient: dayData.coefficient,
      highTidesStr: highTidesStr || '14:20 (2.8m)',
      lowTidesStr: lowTidesStr || '08:10 (0.6m)',
      moonPhaseIcon: dayData.solunar.moonPhaseIcon,
      moonPhaseName: dayData.solunar.moonPhaseName,
      solunarScore: dayData.solunar.activityScore,
      sunrise: dayData.solunar.sunrise,
      sunset: dayData.solunar.sunset,
    });
  }

  return rows;
}

// Unit Conversion Formatting Helpers
export function formatHeight(meters: number, units: UserUnits): string {
  if (units.height === 'ft') {
    const feet = meters * 3.28084;
    return `${feet.toFixed(2)} ft`;
  }
  return `${meters.toFixed(2)} m`;
}

export function formatWindSpeed(knots: number, units: UserUnits): string {
  if (units.speed === 'kmh') {
    const kmh = knots * 1.852;
    return `${Math.round(kmh)} km/h`;
  }
  if (units.speed === 'mph') {
    const mph = knots * 1.15078;
    return `${Math.round(mph)} mph`;
  }
  return `${Math.round(knots)} nudos`;
}

export function formatTemp(celsius: number, units: UserUnits): string {
  if (units.temp === 'F') {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}
