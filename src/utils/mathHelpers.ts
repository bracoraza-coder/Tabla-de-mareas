import { WindClassification } from '../types';

/**
 * Common math utilities for harmonic, wind vector, and solunar calculations.
 */

// String Sanitization for User Inputs
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>'"&;/]/g, '') // remove HTML/script injection characters
    .trim()
    .slice(0, 200); // cap length to avoid overflow
}

// Normalized modulo (handles negative numbers correctly)
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Julian day calculation
export function getJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

// Lunar phase normalized value (0 = new moon, 0.5 = full moon, 1 = new moon)
export function getLunarPhase(date: Date): number {
  const jd = getJulianDay(date);
  // Known new moon reference: 2451550.1 (Jan 6 2000)
  const daysSinceNew = jd - 2451550.1;
  const synodicMonth = 29.53058867;
  return mod(daysSinceNew / synodicMonth, 1);
}

// Lunar Age in Days (0 to 29.53 days)
export function getLunarAgeDays(date: Date): number {
  const phase = getLunarPhase(date);
  return Number((phase * 29.53058867).toFixed(1));
}

// Calculate tide coefficient (30-120) based on lunar phase (Spring / Syzygy vs Neap / Quadrature)
export function calculateCoefficient(phase: number): number {
  // Coef peaks at New (0/1) and Full (0.5)
  let dist = phase > 0.5 ? Math.abs(phase - 1) : phase;
  if (phase > 0.25 && phase <= 0.5) dist = Math.abs(phase - 0.5);
  if (phase > 0.5 && phase <= 0.75) dist = Math.abs(phase - 0.5);
  
  // dist goes from 0 (Spring/Sizigia) to 0.25 (Neap/Cuadratura)
  const normalized = 1 - (dist / 0.25);
  const coef = 30 + normalized * 90;
  return Math.round(coef);
}

export function getMoonPhaseDetails(phase: number) {
  const isWaxing = phase > 0 && phase < 0.5;
  let name = 'Luna Nueva';
  let icon = '🌑';
  if (phase > 0.03 && phase < 0.22) { name = 'Cuarto Creciente'; icon = '🌒'; }
  else if (phase >= 0.22 && phase < 0.28) { name = 'Cuarto Creciente'; icon = '🌓'; }
  else if (phase >= 0.28 && phase < 0.47) { name = 'Luna Gibosa Crec.'; icon = '🌔'; }
  else if (phase >= 0.47 && phase < 0.53) { name = 'Luna Llena'; icon = '🌕'; }
  else if (phase >= 0.53 && phase < 0.72) { name = 'Luna Gibosa Meng.'; icon = '🌖'; }
  else if (phase >= 0.72 && phase < 0.78) { name = 'Cuarto Menguante'; icon = '🌗'; }
  else if (phase >= 0.78 && phase < 0.97) { name = 'Cuarto Menguante'; icon = '🌘'; }
  
  // Exact Illumination % using cosine angle formula
  const lunarAgeRad = phase * 2 * Math.PI;
  const illumination = Number((((1 - Math.cos(lunarAgeRad)) / 2) * 100).toFixed(1));
  
  return { name, icon, isWaxing, illumination };
}

// MÓDULO 3: Vectorial Wind vs Coast Model (Terral / Onshore / Costero)
export function getWindTypeAndRating(windDegrees: number, beachAngle: number = 0): WindClassification {
  // Calculate absolute angular difference on a 360 circle
  let diff = Math.abs(windDegrees - beachAngle) % 360;
  if (diff > 180) diff = 360 - diff;

  if (diff >= 135) {
    return {
      windType: 'Terral (Offshore)',
      ratingText: 'Excelente',
      angleDiff: Math.round(diff),
      isOffshore: true,
      isOnshore: false,
      description: 'Viento de tierra a mar. Ahueca la ola y limpia la cresta (Ideal para surf y pesca).'
    };
  } else if (diff <= 45) {
    return {
      windType: 'Onshore (Mar de Tierra)',
      ratingText: 'Desfavorable',
      angleDiff: Math.round(diff),
      isOffshore: false,
      isOnshore: true,
      description: 'Viento de mar a tierra. Achafana la ola y genera mar picada (Desfavorable).'
    };
  } else {
    return {
      windType: 'Costero (Sideshore)',
      ratingText: 'Aceptable',
      angleDiff: Math.round(diff),
      isOffshore: false,
      isOnshore: false,
      description: 'Viento paralelo a la costa. Condiciones aceptables de oleaje.'
    };
  }
}

// Sunrise and sunset approximation based on date and latitude
export function getSunriseSunset(date: Date, lat: number) {
  const month = date.getMonth();
  const isSummer = lat > 0 ? (month > 3 && month < 9) : (month < 3 || month > 9);
  
  let srH = 7, srM = 15, ssH = 18, ssM = 45;
  
  if (isSummer) {
    srH -= 1; ssH += 2;
  }
  
  return {
    sunrise: `${String(srH).padStart(2,'0')}:${String(srM).padStart(2,'0')}`,
    sunset: `${String(ssH).padStart(2,'0')}:${String(ssM).padStart(2,'0')}`
  };
}
