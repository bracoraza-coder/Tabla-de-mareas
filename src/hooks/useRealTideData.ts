import { useState, useEffect } from 'react';
import { Port, TideDayData, MarineWeather } from '../types';
import { calculateTideDayData, calculateBeaufort, degToCompass } from '../utils/tideEngine';

export interface UseRealTideDataResult {
  tideData: TideDayData;
  weatherData: MarineWeather;
  loading: boolean;
  error: string | null;
  isLiveApi: boolean;
  apiLoading: boolean;
  apiError: string | null;
  dataSource: 'open-meteo' | 'fallback-matematico';
}

/**
 * Custom hook to fetch real data for a given port and date.
 * Fetches Open-Meteo Marine & Weather API in real time with an automatic 5s timeout.
 * Provides resilient fallback to local mathematical estimation engine.
 */
export function useRealTideData(port: Port, date: Date): UseRealTideDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'open-meteo' | 'fallback-matematico'>('fallback-matematico');

  // Initialize with local algorithmic calculation for immediate render
  const [tideData, setTideData] = useState<TideDayData>(() => calculateTideDayData(port, date));
  const [weatherData, setWeatherData] = useState<MarineWeather>({
    windSpeedKnots: 12,
    windDirection: 'N',
    windDegrees: 0,
    windGustKnots: 15,
    waveHeightMeters: 1.2,
    waveDirection: 'N',
    wavePeriodSeconds: 8,
    waterTemp: 16,
    seaStateName: 'Marejadilla',
    beaufortScale: 4,
    beaufortDescription: 'Brisa Moderada',
    temp: 18,
    feelsLike: 17,
    condition: 'Despejado',
    pressureHpa: 1015,
    pressureTrend: 'estable',
    humidityPercent: 65,
    uvIndex: 5,
    visibilityKm: 10,
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setApiLoading(true);
    setError(null);
    setApiError(null);

    // Update tide local model first
    const localTides = calculateTideDayData(port, date);
    if (isMounted) setTideData(localTides);

    const fetchMarineData = async () => {
      try {
        const lat = port.lat;
        const lng = port.lng;

        // Open-Meteo endpoints
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`;
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period&timezone=auto`;

        const safeFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;

        // 5 second safety timeout to prevent hanging UI
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera excedido en Open-Meteo API (5s)')), 5000)
        );

        const fetchAll = Promise.all([
          safeFetch(weatherUrl),
          safeFetch(marineUrl)
        ]);

        const [weatherRes, marineRes] = await Promise.race([fetchAll, timeoutPromise]);

        if (!isMounted) return;

        let gotRealWeather = false;

        // 1. Weather API response
        if (weatherRes && weatherRes.ok) {
          const wData = await weatherRes.json();
          if (wData.current) {
            const curr = wData.current;
            const windKnots = curr.wind_speed_10m / 1.852;
            const gustKnots = curr.wind_gusts_10m / 1.852;
            const bfInfo = calculateBeaufort(windKnots);

            setWeatherData(prev => ({
              ...prev,
              windSpeedKnots: Math.round(windKnots),
              windGustKnots: Math.round(gustKnots),
              windDegrees: curr.wind_direction_10m,
              windDirection: degToCompass(curr.wind_direction_10m),
              temp: Math.round(curr.temperature_2m),
              feelsLike: Math.round(curr.apparent_temperature),
              pressureHpa: Math.round(curr.surface_pressure),
              humidityPercent: curr.relative_humidity_2m,
              beaufortScale: bfInfo.beaufortScale,
              beaufortDescription: bfInfo.beaufortDescription,
              condition: curr.weather_code > 50 ? 'Lluvia' : curr.weather_code > 0 ? 'Nublado' : 'Despejado'
            }));
            gotRealWeather = true;
          }
        }

        // 2. Marine API response
        if (marineRes && marineRes.ok) {
          const mData = await marineRes.json();
          if (mData.current) {
            const mc = mData.current;
            let ss = 'Calma';
            if (mc.wave_height > 0.1) ss = 'Rizada';
            if (mc.wave_height > 0.5) ss = 'Marejadilla';
            if (mc.wave_height > 1.25) ss = 'Marejada';
            if (mc.wave_height > 2.5) ss = 'Fuerte Marejada';
            if (mc.wave_height > 4) ss = 'Mar Gruesa';

            setWeatherData(prev => ({
              ...prev,
              waveHeightMeters: mc.wave_height != null ? Number(mc.wave_height.toFixed(2)) : prev.waveHeightMeters,
              wavePeriodSeconds: mc.wave_period != null ? Math.round(mc.wave_period) : prev.wavePeriodSeconds,
              waveDirection: mc.wave_direction ? degToCompass(mc.wave_direction) : prev.waveDirection,
              seaStateName: ss
            }));
            gotRealWeather = true;
          }
        }

        if (gotRealWeather) {
          setIsLiveApi(true);
          setDataSource('open-meteo');
          setApiError(null);
        } else {
          setIsLiveApi(false);
          setDataSource('fallback-matematico');
          setApiError('Respuesta sin datos de Open-Meteo. Usando estimación matemática local.');
        }

      } catch (err: any) {
        if (isMounted) {
          console.warn('[Open-Meteo API Fallback Active]:', err?.message || err);
          setIsLiveApi(false);
          setDataSource('fallback-matematico');
          setApiError(err?.message || 'Error de conexión. Usando modelo matemático local.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setApiLoading(false);
        }
      }
    };

    fetchMarineData();

    return () => {
      isMounted = false;
    };
  }, [port, date]);

  return {
    tideData,
    weatherData,
    loading,
    error,
    isLiveApi,
    apiLoading,
    apiError,
    dataSource
  };
}

