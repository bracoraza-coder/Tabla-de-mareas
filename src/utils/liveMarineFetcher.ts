import { Port, MarineWeather } from '../types';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes: matches Open-Meteo's own update cadence
const CACHE_PREFIX = 'tdm_marine_cache_';

interface CacheEntry {
  weather: MarineWeather;
  source: string;
  fetchedAt: number;
}

function readCache(portId: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + portId);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(portId: string, entry: CacheEntry) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + portId, JSON.stringify(entry));
  } catch {
    // Ignore quota/availability errors (private browsing, etc.)
  }
}

/** Instantly returns a cached reading for a port, if fresh enough, without any network call. */
export function getCachedMarineWeather(portId: string): { weather: MarineWeather; source: string } | null {
  const entry = readCache(portId);
  if (!entry) return null;
  return { weather: entry.weather, source: entry.source };
}

function degreesToCardinal(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

function knotsToBeaufort(knots: number): { scale: number; desc: string } {
  if (knots >= 34) return { scale: 8, desc: 'Temporal' };
  if (knots >= 28) return { scale: 7, desc: 'Fuerte Ventarrón' };
  if (knots >= 22) return { scale: 6, desc: 'Viento Fuerte' };
  if (knots >= 17) return { scale: 5, desc: 'Fresquito' };
  if (knots >= 11) return { scale: 4, desc: 'Bonancible' };
  if (knots >= 7) return { scale: 3, desc: 'Flojo' };
  if (knots >= 4) return { scale: 2, desc: 'Flojito' };
  return { scale: 1, desc: 'Ventolina' };
}

function waveHeightToSeaState(meters: number): string {
  if (meters >= 4.0) return 'Mar Muy Gruesa';
  if (meters >= 2.5) return 'Mar Gruesa';
  if (meters >= 1.25) return 'Fuerte Marejada';
  if (meters >= 0.5) return 'Marejada';
  if (meters >= 0.1) return 'Marejadilla';
  return 'Mar Calma';
}

function parseWmoWeatherCode(code: number): { condition: string; conditionCode: string } {
  if (code === 0) return { condition: 'Cielo Despejado', conditionCode: 'sun' };
  if (code >= 1 && code <= 3) return { condition: 'Parcialmente Nublado', conditionCode: 'cloud-sun' };
  if (code === 45 || code === 48) return { condition: 'Niebla Marina', conditionCode: 'cloud-fog' };
  if (code >= 51 && code <= 67) return { condition: 'Chubascos Marítimos', conditionCode: 'cloud-rain' };
  if (code >= 80 && code <= 82) return { condition: 'Lluvia y Brisa Marina', conditionCode: 'cloud-rain' };
  if (code >= 95) return { condition: 'Tormenta Costera', conditionCode: 'cloud-lightning' };
  return { condition: 'Nubes y Claros', conditionCode: 'cloud-sun' };
}

export async function fetchLiveMarineWeather(port: Port, fallback: MarineWeather, externalSignal?: AbortSignal): Promise<{
  weather: MarineWeather;
  isLive: boolean;
  source: string;
}> {
  try {
    const lat = port.lat;
    const lng = port.lng;

    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 4000);
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 4000);

    externalSignal?.addEventListener('abort', () => {
      controller1.abort();
      controller2.abort();
    });

    // Fetch Open-Meteo Weather Forecast & Marine APIs in parallel
    const [weatherRes, marineRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code&timezone=auto`,
        { signal: controller1.signal }
      ).catch(() => null).finally(() => clearTimeout(timeout1)),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,ocean_current_velocity,ocean_current_direction&timezone=auto`,
        { signal: controller2.signal }
      ).catch(() => null).finally(() => clearTimeout(timeout2))
    ]);

    if (!weatherRes || !weatherRes.ok) {
      return { weather: fallback, isLive: false, source: 'Modelo Hidrográfico Armónico Local' };
    }

    const weatherData = await weatherRes.json();
    const currentW = weatherData.current || {};

    let marineData = null;
    if (marineRes && marineRes.ok) {
      marineData = await marineRes.json();
    }
    const currentM = marineData?.current || {};

    const temp = Math.round(currentW.temperature_2m ?? fallback.temp);
    const feelsLike = Math.round(currentW.apparent_temperature ?? fallback.feelsLike);
    const humidityPercent = Math.round(currentW.relative_humidity_2m ?? fallback.humidityPercent);
    const pressureHpa = Math.round(currentW.surface_pressure ?? fallback.pressureHpa);

    // Wind speed converts from km/h to knots (1 km/h = 0.539957 knots)
    const windKm = Math.round(currentW.wind_speed_10m ?? (fallback.windSpeedKnots * 1.852));
    const windSpeedKnots = Math.round(windKm * 0.539957);
    const windGustKm = Math.round(currentW.wind_gusts_10m ?? (fallback.windGustKnots * 1.852));
    const windGustKnots = Math.round(windGustKm * 0.539957);

    const windDeg = currentW.wind_direction_10m ?? fallback.windDegrees;
    const windDirection = degreesToCardinal(windDeg);

    const beaufort = knotsToBeaufort(windSpeedKnots);
    const weatherCond = parseWmoWeatherCode(currentW.weather_code ?? 0);

    // Waves from Open-Meteo Marine API
    const waveHeightMeters = typeof currentM.wave_height === 'number'
      ? Math.round(currentM.wave_height * 10) / 10
      : fallback.waveHeightMeters;

    const wavePeriodSeconds = typeof currentM.wave_period === 'number'
      ? Math.round(currentM.wave_period)
      : fallback.wavePeriodSeconds;

    const waveDeg = typeof currentM.wave_direction === 'number'
      ? currentM.wave_direction
      : windDeg;
    const waveDirection = degreesToCardinal(waveDeg);

    const seaStateName = waveHeightToSeaState(waveHeightMeters);

    // Primary groundswell (the surfable component, separate from local
    // wind-driven chop) - Open-Meteo's marine model partitions this out
    // directly, which is exactly what surf forecasters use.
    const swellHeightMeters = typeof currentM.swell_wave_height === 'number'
      ? Math.round(currentM.swell_wave_height * 10) / 10
      : Math.round(waveHeightMeters * 0.85 * 10) / 10;

    const swellPeriodSeconds = typeof currentM.swell_wave_period === 'number'
      ? Math.round(currentM.swell_wave_period)
      : Math.max(wavePeriodSeconds, 9);

    const swellDeg = typeof currentM.swell_wave_direction === 'number'
      ? currentM.swell_wave_direction
      : waveDeg;
    const swellDirection = degreesToCardinal(swellDeg);

    const liveWeather: MarineWeather = {
      temp,
      feelsLike,
      condition: weatherCond.condition,
      conditionCode: weatherCond.conditionCode,
      windSpeedKnots,
      windSpeedKm: windKm,
      windDirection,
      windDegrees: windDeg,
      windGustKnots,
      beaufortScale: beaufort.scale,
      beaufortDescription: beaufort.desc,
      waveHeightMeters,
      wavePeriodSeconds,
      waveDirection,
      waveDegrees: waveDeg,
      seaStateName,
      swellHeightMeters,
      swellPeriodSeconds,
      swellDirection,
      swellDegrees: swellDeg,
      waterTemp: port.waterTempAvg,
      pressureHpa,
      pressureTrend: 'estable',
      humidityPercent,
      uvIndex: fallback.uvIndex,
      visibilityKm: fallback.visibilityKm,
    };

    const liveSource = 'Open-Meteo Marine API & Sistema Hidrográfico Real';
    writeCache(port.id, { weather: liveWeather, source: liveSource, fetchedAt: Date.now() });

    return {
      weather: liveWeather,
      isLive: true,
      source: liveSource
    };
  } catch {
    return { weather: fallback, isLive: false, source: 'Modelo Hidrográfico Armónico Local' };
  }
}
