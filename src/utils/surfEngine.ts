import { MarineWeather, TideDayData, UserUnits, Port } from '../types';

export type SurfRatingLabel = 'Plano' | 'Malo' | 'Regular' | 'Bueno' | 'Muy Bueno' | 'Excelente';

export interface SurfConditions {
  score: number; // 0 - 10
  rating: SurfRatingLabel;
  ratingColor: string; // tailwind color token base
  windQuality: 'Offshore' | 'Onshore' | 'Cruzado' | 'Variable';
  windQualityDesc: string;
  swellPowerLabel: string;
  boardRecommendation: string;
  bestWindow: string;
  tideAdvice: string;
  safetyNote: string | null;
  summary: string;
}

/** Angular difference between two compass bearings, 0-180. */
function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function getSurfConditions(
  weather: MarineWeather,
  dayData: TideDayData,
  port: Port,
  units: UserUnits
): SurfConditions {
  const { swellHeightMeters, swellPeriodSeconds, windSpeedKnots, windDegrees, swellDegrees, beaufortScale } = weather;

  // Wind vs swell relationship (approximate - assumes wind blowing roughly
  // opposite to the swell's direction of travel grooms the wave face).
  const diff = angleDiff(windDegrees, swellDegrees);
  let windQuality: SurfConditions['windQuality'];
  let windQualityDesc: string;
  if (windSpeedKnots <= 4) {
    windQuality = 'Variable';
    windQualityDesc = 'Viento prácticamente en calma: la superficie del agua estará limpia y sedosa.';
  } else if (diff <= 55) {
    windQuality = 'Onshore';
    windQualityDesc = 'El viento sopla en la misma dirección que el oleaje: tiende a desordenar y "picar" la cara de la ola.';
  } else if (diff >= 125) {
    windQuality = 'Offshore';
    windQualityDesc = 'El viento sopla de tierra hacia el mar: peina y da forma a la ola, condiciones más limpias y tubulares.';
  } else {
    windQuality = 'Cruzado';
    windQualityDesc = 'Viento cruzado respecto al oleaje: superficie parcialmente rizada, condiciones variables según el punto exacto de la playa.';
  }

  // Swell power (simplified surf-forecasting energy heuristic: height² × period)
  const power = swellHeightMeters * swellHeightMeters * swellPeriodSeconds;
  let swellPowerLabel: string;
  if (power < 4) swellPowerLabel = 'Mar de fondo débil, olas blandas';
  else if (power < 12) swellPowerLabel = 'Mar de fondo moderado';
  else if (power < 25) swellPowerLabel = 'Mar de fondo potente';
  else swellPowerLabel = 'Mar de fondo muy potente, energía elevada';

  // Score 0-10: rewards clean groundswell with good period, penalises weak
  // wind-chop-only conditions and excessive wind speed.
  let score = 0;
  score += Math.min(4.5, swellHeightMeters * 3.2);
  score += Math.min(3, (swellPeriodSeconds - 6) * 0.4);
  if (windQuality === 'Offshore') score += 2;
  else if (windQuality === 'Variable') score += 1.5;
  else if (windQuality === 'Cruzado') score += 0.5;
  if (windSpeedKnots > 20) score -= 1.5;
  if (windSpeedKnots > 28) score -= 1.5;
  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  let rating: SurfRatingLabel;
  let ratingColor: string;
  if (score < 1.5) { rating = 'Plano'; ratingColor = 'slate'; }
  else if (score < 3.5) { rating = 'Malo'; ratingColor = 'red'; }
  else if (score < 5) { rating = 'Regular'; ratingColor = 'amber'; }
  else if (score < 6.8) { rating = 'Bueno'; ratingColor = 'cyan'; }
  else if (score < 8.5) { rating = 'Muy Bueno'; ratingColor = 'blue'; }
  else { rating = 'Excelente'; ratingColor = 'emerald'; }

  let boardRecommendation: string;
  if (swellHeightMeters < 0.5) {
    boardRecommendation = 'Longboard o Fish: la ola tiene poca fuerza, necesitas más flotabilidad para coger velocidad.';
  } else if (swellHeightMeters < 1.1) {
    boardRecommendation = 'Shortboard funcional, Fish o Mid-length: buen tamaño para maniobrar con soltura.';
  } else if (swellHeightMeters < 2) {
    boardRecommendation = 'Shortboard de rocker medio-alto: la ola ya tiene empuje, prioriza control en la bajada.';
  } else {
    boardRecommendation = 'Tabla de olas grandes (gun) y experiencia previa: condiciones exigentes, no recomendado para principiantes.';
  }

  const risingOrFalling = dayData.currentTideState === 'subiendo' ? 'la marea subiendo' : dayData.currentTideState === 'bajando' ? 'la marea bajando' : 'el cambio de marea';
  const nextTideHl = dayData.nextTide;
  const bestWindow = `Suele haber más definición de olas con ${risingOrFalling}, especialmente en las 2-3h antes o después de la ${nextTideHl.type === 'pleamar' ? 'pleamar' : 'bajamar'} (${nextTideHl.time}h) - confírmalo en tu pico habitual, cada playa se comporta distinto según su profundidad y arena.`;

  const tideAdvice = dayData.coefficient >= 80
    ? 'Coeficiente de marea alto: corrientes más fuertes de lo habitual, ten precaución extra con el rip/resaca.'
    : 'Coeficiente de marea moderado: movimiento de agua estándar para la zona.';

  let safetyNote: string | null = null;
  if (windSpeedKnots > 25 && swellHeightMeters > 1.5) {
    safetyNote = 'Viento fuerte combinado con oleaje considerable: condiciones solo para surfistas con experiencia. Extrema la precaución y no surfees solo.';
  } else if (swellHeightMeters > 2.5) {
    safetyNote = 'Oleaje grande: recomendado únicamente para surfistas avanzados con buen conocimiento del pico.';
  } else if (beaufortScale >= 7) {
    safetyNote = 'Viento muy fuerte (Beaufort ≥7): condiciones potencialmente peligrosas para entrar al agua.';
  }

  const summary = `Hoy en ${port.name.split(' (')[0]}: mar de fondo de ${swellHeightMeters.toFixed(1)}m con periodo de ${swellPeriodSeconds}s desde el ${weather.swellDirection}, viento ${windQuality.toLowerCase()} de ${Math.round(windSpeedKnots)} nudos. ${swellPowerLabel}.`;

  return {
    score,
    rating,
    ratingColor,
    windQuality,
    windQualityDesc,
    swellPowerLabel,
    boardRecommendation,
    bestWindow,
    tideAdvice,
    safetyNote,
    summary,
  };
}
