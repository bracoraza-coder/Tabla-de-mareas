import React from 'react';
import { 
  Wind, 
  Thermometer, 
  Waves, 
  Eye, 
  Droplets, 
  Gauge, 
  Sun, 
  CloudRain, 
  Compass, 
  ArrowUp,
  ShieldAlert,
  ThermometerSnowflake
} from 'lucide-react';
import { MarineWeather as MarineWeatherType, UserUnits } from '../types';

interface MarineWeatherProps {
  weather: MarineWeatherType;
  units: UserUnits;
  isUpdating?: boolean;
}

export const MarineWeather: React.FC<MarineWeatherProps> = ({
  weather,
  units,
  isUpdating = false,
}) => {
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

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-cyan-500 rounded-2xl p-5 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-400" />
              Meteorología Marina, Viento & Oleaje
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono transition-colors">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isUpdating ? 'animate-ping' : 'animate-pulse'}`}></span>
              {isUpdating ? 'ACTUALIZANDO…' : 'EN VIVO • Open-Meteo API'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Telemetría satelital y oceanográfica en tiempo real para navegación, surf y pesca costera
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-cyan-300 font-semibold font-mono">
          <span>Escala Beaufort: Fuerza {weather.beaufortScale}</span>
          <span className="text-slate-600">|</span>
          <span className="text-white uppercase font-bold">{weather.beaufortDescription}</span>
        </div>
      </div>

      {/* Main 3 Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Wind & Gusts Card with Direction Compass */}
        <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-cyan-500 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Wind className="w-4 h-4 text-cyan-400" /> Viento y Rachas
            </div>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold font-mono">
              {weather.windDirection} ({weather.windDegrees}°)
            </span>
          </div>

          <div className="flex items-center justify-between my-2">
            <div>
              <div className="text-3xl font-black text-white font-mono">
                {formatSpeed(weather.windSpeedKnots)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Rachas hasta <strong className="text-cyan-300 font-mono">{formatSpeed(weather.windGustKnots)}</strong>
              </div>
            </div>

            {/* Compass Rose Indicator */}
            <div className="relative w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              <span className="absolute top-1 text-[9px] font-bold text-slate-500">N</span>
              <span className="absolute bottom-1 text-[9px] font-bold text-slate-500">S</span>
              <div
                className="transition-transform duration-700"
                style={{ transform: `rotate(${weather.windDegrees}deg)` }}
              >
                <ArrowUp className="w-7 h-7 text-cyan-400 fill-cyan-400" />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Beaufort Fuerza {weather.beaufortScale}</span>
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
              <span className="text-3xl font-black text-white font-mono">
                {formatHeight(waveHeightInUnits(weather.waveHeightMeters, units))}
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

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-emerald-300 font-mono">
                {formatTemp(weather.waterTemp)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Temperatura de la costa
              </div>
            </div>

            <div className="text-right border-l border-slate-800 pl-4">
              <div className="text-lg font-bold text-white font-mono">
                {formatTemp(weather.temp)}
              </div>
              <div className="text-[11px] text-slate-400">
                Aire (Sensación {formatTemp(weather.feelsLike)})
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Estado: {weather.condition}</span>
            <span className="text-emerald-400 font-bold">Excelente</span>
          </div>
        </div>

      </div>

      {/* Secondary Weather Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <Gauge className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-slate-400 font-bold uppercase text-[10px]">Presión Barométrica</div>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              {weather.pressureHpa} hPa <span className="text-xs font-normal text-slate-400">({weather.pressureTrend})</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <Droplets className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="text-slate-400 font-bold uppercase text-[10px]">Humedad Relativa</div>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              {weather.humidityPercent}%
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <Sun className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-slate-400 font-bold uppercase text-[10px]">Radiación UV</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono">
              UV {weather.uvIndex} <span className="text-xs font-normal text-slate-400">(Moderado)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <Eye className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-slate-400 font-bold uppercase text-[10px]">Visibilidad Marina</div>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              {weather.visibilityKm} km
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

function waveHeightInUnits(meters: number, units: UserUnits): number {
  return meters;
}
