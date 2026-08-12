import React, { useState } from 'react';
import { 
  Wind, 
  Waves, 
  ThermometerSnowflake,
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  Compass,
  ShieldCheck,
  Droplets
} from 'lucide-react';
import { MarineWeather as MarineWeatherType, UserUnits, Port } from '../types';
import { PressureGauge, CompassRose, DualTempGauge } from './gauges/WeatherGauges';
import { WeatherDetailModal } from './WeatherDetailModal';

// Imported generated professional weather imagery
import sunnyWeatherImg from '../assets/images/weather_sunny_day_coastal_1785798224299.webp';
import stormyWeatherImg from '../assets/images/weather_cloudy_stormy_coastal_1785798306933.webp';

import nightWeatherImg from '../assets/images/weather_night_coastal_1785798582753.webp';

interface MarineWeatherProps {
  weather: MarineWeatherType;
  units: UserUnits;
  port?: Port;
  isUpdating?: boolean;
}

export const MarineWeather: React.FC<MarineWeatherProps> = ({
  weather,
  units,
  port = { id: 'default', name: 'Puerto Principal', country: 'España', region: 'Costa', lat: 43, lng: -3, timezone: 'Europe/Madrid', baseHeight: 2, amplitude: 3, phaseDelayMinutes: 0 },
  isUpdating = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert speed
  const formatSpeed = (knots: number) => {
    if (units.speed === 'kmh') {
      return `${Math.round(knots * 1.852)} km/h`;
    }
    if (units.speed === 'mph') {
      return `${Math.round(knots * 1.15078)} mph`;
    }
    return `${knots} nudos`;
  };

  // Convert temp
  const formatTemp = (celsius: number) => {
    if (units.temp === 'F') {
      const f = (celsius * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Convert height
  const formatHeight = (meters: number) => {
    if (units.height === 'ft') {
      return `${(meters * 3.28084).toFixed(1)} ft`;
    }
    return `${meters.toFixed(1)} m`;
  };

  const currentHour = new Date().getHours();
  const isNight = currentHour < 7 || currentHour > 21;

  const isStormyOrCloudy = weather.condition.toLowerCase().includes('nub') || 
                           weather.condition.toLowerCase().includes('lluv') || 
                           weather.condition.toLowerCase().includes('storm') || 
                           weather.condition.toLowerCase().includes('rain') ||
                           weather.humidityPercent > 70;

  const currentImage = isNight ? nightWeatherImg : (isStormyOrCloudy ? stormyWeatherImg : sunnyWeatherImg);
  const statusBadgeText = isNight 
    ? '🌙 Noche Clara / Estrellada' 
    : isStormyOrCloudy 
      ? '⛅ Cielo Nuboso / Mar de Fondo' 
      : '☀️ Jornada Soleada y Despejada';

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Estado del Tiempo & Meteorología Marina</h2>
          </div>
        </div>

        {/* ================= PHOTOREALISTIC WEATHER VISUAL CARD (NON-CLICKABLE, JUST LIKE SURF SECTION) ================= */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="relative w-full aspect-[21/9] sm:aspect-[16/6] overflow-hidden bg-slate-950 flex items-center justify-center">
            <img
              src={currentImage}
              alt={weather.condition}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter contrast-105 brightness-95"
            />
            {/* Cinematic Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

            {/* Overlay Status Badge & Port info */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md text-cyan-300 font-black text-xs sm:text-sm tracking-wide shadow-lg flex items-center gap-2">
                  <span>{statusBadgeText}</span>
                </div>
                <div className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 backdrop-blur-md text-xs font-mono font-bold text-slate-200">
                  📍 {port.name} ({port.region})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-md text-cyan-200 font-mono font-bold text-xs shadow-lg">
                  {weather.condition} • {formatTemp(weather.temp)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div>
              Estado del mar: <strong className="text-cyan-300 uppercase">{weather.seaStateName}</strong> • Fuerza Beaufort {weather.beaufortScale} ({weather.beaufortDescription})
            </div>
            <div className="flex items-center gap-4">
              <span>Viento: <strong className="text-white">{formatSpeed(weather.windSpeedKnots)}</strong></span>
              <span>Olas: <strong className="text-blue-300">{formatHeight(weather.waveHeightMeters)}</strong></span>
            </div>
          </div>
        </div>

        {/* Main 3 Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Wind & Gusts Card */}
          <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-cyan-500 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Wind className="w-4 h-4 text-cyan-400" /> Viento y Rachas
              </div>
              <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold font-mono">
                {weather.windDirection} ({weather.windDegrees}°)
              </span>
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="w-36 h-36 shrink-0 drop-shadow-lg">
                <CompassRose degrees={weather.windDegrees} speedLabel={formatSpeed(weather.windSpeedKnots)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-black text-white font-mono leading-tight">
                  {formatSpeed(weather.windSpeedKnots)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Rachas hasta <strong className="text-cyan-300 font-mono">{formatSpeed(weather.windGustKnots)}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Procede de {weather.windDirection}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
              <span>Beaufort F{weather.beaufortScale}</span>
              <span className="text-cyan-300 font-bold uppercase">{weather.beaufortDescription}</span>
            </div>
          </div>

          {/* 2. Swell & Waves Card */}
          <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Waves className="w-4 h-4 text-blue-400" /> Oleaje & Mar de Fondo
              </div>
              <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                {weather.seaStateName}
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white font-mono">
                  {formatHeight(weather.waveHeightMeters)}
                </span>
                <span className="text-xs text-slate-400 font-mono">altura de ola</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>Período: <strong className="text-blue-300 font-mono">{weather.wavePeriodSeconds}s</strong></span>
                <span>Dir: <strong className="text-white font-mono">{weather.waveDirection}</strong></span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
              <span>Intervalo olas</span>
              <span className="text-blue-300 font-bold">{weather.wavePeriodSeconds >= 10 ? 'Mar de fondo largo' : 'Mar tendida'}</span>
            </div>
          </div>

          {/* 3. Water Sea Temp & Air Temp Card */}
          <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <ThermometerSnowflake className="w-4 h-4 text-emerald-400" /> Temp. Agua del Mar
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold font-mono">
                AGUA
              </span>
            </div>

            <div className="w-48 h-48 mx-auto drop-shadow-lg">
              <DualTempGauge
                airC={weather.temp}
                waterC={weather.waterTemp}
                airLabel={formatTemp(weather.temp)}
                waterLabel={formatTemp(weather.waterTemp)}
              />
            </div>
            <div className="text-[11px] text-slate-400 text-center -mt-2">
              Sensación térmica {formatTemp(weather.feelsLike)}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
              <span>Estado: {weather.condition}</span>
              <span className="text-emerald-400 font-bold">Excelente</span>
            </div>
          </div>

        </div>

      </div>

      {/* Detailed Weather Modal */}
      <WeatherDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weather={weather}
        port={port}
        units={units}
      />
    </>
  );
};
