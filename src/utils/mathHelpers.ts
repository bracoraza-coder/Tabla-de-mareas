/**
 * Common math utilities for harmonic and solunar calculations.
 */

// Normalized modulo (handles negative numbers correctly)
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Julian day calculation (approximate)
export function getJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

// Very rough approximation of lunar phase (0 = new, 0.5 = full, 1 = new)
export function getLunarPhase(date: Date): number {
  const jd = getJulianDay(date);
  // Known new moon approx: 2451550.1 (Jan 6 2000)
  const daysSinceNew = jd - 2451550.1;
  const synodicMonth = 29.53058867;
  return mod(daysSinceNew / synodicMonth, 1);
}

// Calculate tide coefficient (30-120) based solely on lunar phase
export function calculateCoefficient(phase: number): number {
  // Coef peaks at New (0/1) and Full (0.5)
  // Distance from syzygy (0 or 0.5)
  let dist = phase > 0.5 ? Math.abs(phase - 1) : phase;
  if (phase > 0.25 && phase <= 0.5) dist = Math.abs(phase - 0.5);
  if (phase > 0.5 && phase <= 0.75) dist = Math.abs(phase - 0.5);
  
  // dist goes from 0 (Spring) to 0.25 (Neap)
  // map 0 -> 120, 0.25 -> 30
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
  
  // Illumination %
  // 0% at 0/1, 100% at 0.5
  const illumination = (0.5 - Math.abs(phase - 0.5)) * 2 * 100;
  
  return { name, icon, isWaxing, illumination };
}

// Dummy sunrise/sunset based roughly on latitude (highly simplified)
export function getSunriseSunset(date: Date, lat: number) {
  // In reality, this requires complex astronomical formulas.
  // We mock this slightly varying by month for visual realism.
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
