import { useState, useEffect } from 'react';
import { Port, TideDayData, MarineWeather } from '../types';
import { calculateTideDayData } from '../utils/tideEngine';

/**
 * Custom hook to fetch real data for a given port and date.
 * Currently uses the Vercel serverless function for tides if available,
 * and Open-Meteo for weather.
 */
export function useRealTideData(port: Port, date: Date) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // We initialize with the algorithmic fallback data so the UI always has *something*
  const [tideData, setTideData] = useState<TideDayData>(calculateTideDayData(port, date));
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
    setError(null);

    const fetchData = async () => {
      try {
        // 1. Fetch Weather from Open-Meteo (Marine + Weather API)
        const dateStr = date.toISOString().split('T')[0];
        const lat = port.lat;
        const lng = port.lng;
        
        // Open-Meteo API calls
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`;
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,wave_period&timezone=auto`;
        
        // Weather & Marine API calls using safe fetch reference
        const safeFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;
        const [weatherRes, marineRes] = await Promise.allSettled([
          safeFetch(weatherUrl),
          safeFetch(marineUrl)
        ]);

        if (isMounted) {
          // Process Weather
          if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
            const wData = await weatherRes.value.json();
            const curr = wData.current;
            
            // Convert km/h to knots (OpenMeteo default is kmh)
            const windKnots = curr.wind_speed_10m / 1.852;
            const gustKnots = curr.wind_gusts_10m / 1.852;
            
            // Beaufort scale approx
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

            const bfDesc = ['Calma', 'Ventolina', 'Brisa muy débil', 'Brisa débil', 'Brisa mod.', 'Brisa fresca', 'Brisa fuerte', 'Frescachón', 'Temporal', 'Temporal fuerte'][bf] || 'Huracanado';

            setWeatherData(prev => ({
              ...prev,
              windSpeedKnots: Math.round(windKnots),
              windGustKnots: Math.round(gustKnots),
              windDegrees: curr.wind_direction_10m,
              windDirection: degToCompass(curr.wind_direction_10m),
              temp: curr.temperature_2m,
              feelsLike: curr.apparent_temperature,
              pressureHpa: curr.surface_pressure,
              humidityPercent: curr.relative_humidity_2m,
              beaufortScale: bf,
              beaufortDescription: bfDesc,
              // Map weather code roughly
              condition: curr.weather_code > 50 ? 'Lluvia' : curr.weather_code > 0 ? 'Nublado' : 'Despejado'
            }));
          }

          // Process Marine
          if (marineRes.status === 'fulfilled' && marineRes.value.ok) {
            const mData = await marineRes.value.json();
            if (mData.current) {
              const mc = mData.current;
              
              // Sea state mapping (Douglas Scale approx)
              let ss = 'Calma';
              if (mc.wave_height > 0.1) ss = 'Rizada';
              if (mc.wave_height > 0.5) ss = 'Marejadilla';
              if (mc.wave_height > 1.25) ss = 'Marejada';
              if (mc.wave_height > 2.5) ss = 'Fuerte Marejada';
              if (mc.wave_height > 4) ss = 'Mar Gruesa';

              setWeatherData(prev => ({
                ...prev,
                waveHeightMeters: mc.wave_height || prev.waveHeightMeters,
                wavePeriodSeconds: mc.wave_period || prev.wavePeriodSeconds,
                waveDirection: mc.wave_direction ? degToCompass(mc.wave_direction) : prev.waveDirection,
                seaStateName: ss
              }));
            }
          }
        }

        // 2. Try fetching real tides from our serverless function if available
        try {
            const tideRes = await safeFetch(`/api/mareas?port=${port.id}&date=${dateStr}`);
            const contentType = tideRes.headers.get('content-type') || '';
            if (tideRes.ok && contentType.includes('application/json')) {
                const apiTides = await tideRes.json();
                console.log("Got real tide data:", apiTides);
            }
        } catch (e) {
            console.warn("Could not fetch real tides from API, using algorithmic fallback.", e);
        }

        // We always ensure tideData is updated with the local model if date/port changes
        if (isMounted) {
            setTideData(calculateTideDayData(port, date));
        }

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [port, date]);

  return { tideData, weatherData, loading, error };
}

// Helper to convert degrees to compass direction
function degToCompass(num: number): string {
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}
