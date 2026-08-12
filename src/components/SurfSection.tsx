import React from 'react';
import { TideDayData, MarineWeather, Port, UserUnits } from '../types';
import { Waves, Wind, AlertTriangle, CheckCircle, Info, Compass, Anchor } from 'lucide-react';
import { SurfDiagram } from './gauges/SurfDiagram';
import { getEffectiveBeachAngle } from '../data/portsData';
import { getWindTypeAndRating } from '../utils/mathHelpers';
import { checkSurfSuitability } from '../utils/surfHelpers';

interface SurfSectionProps {
  dayData: TideDayData;
  weather: MarineWeather;
  port: Port;
  units: UserUnits;
}

export const SurfSection: React.FC<SurfSectionProps> = ({ dayData, weather, port, units }) => {
  const beachAngle = getEffectiveBeachAngle(port);
  const windInfo = getWindTypeAndRating(weather.windDegrees, beachAngle);

  const isOffshore = windInfo.isOffshore;
  const isLightWind = weather.windSpeedKnots <= 10;
  
  const surfSuitability = checkSurfSuitability(port);

  if (!surfSuitability.isSurfable) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800/50 p-3 sm:p-6 shadow-xl relative overflow-hidden mt-4 sm:mt-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <Waves className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Reporte de Surf & Pronóstico</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-slate-400">Ubicación:</span>
            <span className="text-sm font-medium text-amber-400 truncate max-w-[240px]">{port.name}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-900/40 rounded-xl border border-slate-800/60 text-center">
          <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mb-4 border border-slate-700/60">
            {surfSuitability.reason === 'port' ? (
              <Anchor className="w-8 h-8 text-amber-400" />
            ) : (
              <Info className="w-8 h-8 text-cyan-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">{surfSuitability.title}</h3>
          <p className="text-slate-400 max-w-lg text-sm leading-relaxed mb-6 font-sans">
            {surfSuitability.message}
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Coordenadas exactas: {port.lat.toFixed(4)}°N, {port.lng.toFixed(4)}°W</span>
          </div>
        </div>
      </div>
    );
  }

  // Wave height score
  let waveScore = 0;
  if (weather.waveHeightMeters >= 1.0 && weather.waveHeightMeters <= 2.8) {
    waveScore = 40; // ideal
  } else if (weather.waveHeightMeters >= 0.6 && weather.waveHeightMeters < 1.0) {
    waveScore = 25; // small
  } else if (weather.waveHeightMeters > 2.8) {
    waveScore = 30; // heavy
  } else {
    waveScore = 5; // flat
  }

  // Wave period score
  let periodScore = 0;
  if (weather.wavePeriodSeconds >= 10) periodScore = 35;
  else if (weather.wavePeriodSeconds >= 7) periodScore = 20;
  else periodScore = 5;

  // Wind score based on vectorial classification
  let windScore = 0;
  if (windInfo.isOffshore) windScore = 25; // Terral
  else if (isLightWind) windScore = 15;
  else windScore = 5;

  let rating = Math.min(100, waveScore + periodScore + windScore);

  if (weather.waveHeightMeters < 0.4) {
    rating = Math.min(rating, 15);
  } else if (weather.waveHeightMeters < 0.7) {
    rating = Math.min(rating, 45);
  }

  let ratingText = 'Condiciones Pobres';
  let ratingColor = 'text-red-400';
  if (rating >= 75) { ratingText = 'Épico 🏄‍♂️'; ratingColor = 'text-emerald-400'; }
  else if (rating >= 55) { ratingText = 'Bueno 🌊'; ratingColor = 'text-blue-400'; }
  else if (rating >= 35) { ratingText = 'Regular 🏄'; ratingColor = 'text-amber-400'; }

  const heightDisplay = units.height === 'ft' 
    ? `${(weather.waveHeightMeters * 3.28).toFixed(1)} ft` 
    : `${weather.waveHeightMeters.toFixed(1)} m`;

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-teal-500 rounded-2xl p-3 sm:p-5 shadow-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Reporte de Surf & Viento Costero Vectorial</h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-800/80 font-bold">
          Spot: {port.name} (Playa {beachAngle}°)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-start">
        
        {/* Rating & High Quality Surfer Artwork */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="w-full">
             <SurfDiagram rating={rating} />
          </div>
          <div className={`text-2xl font-black ${ratingColor} font-mono mt-3`}>{ratingText}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">Puntuación General: {rating}/100</div>
        </div>

        {/* Detailed Ocean Metrics & Vectorial Wind */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Parámetros del Mar y Régimen de Viento</span>
            <Compass className="w-4 h-4 text-teal-400" />
          </h3>
          
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-xs font-bold text-slate-300 font-mono">Oleaje (Swell)</span>
            <div className="text-right">
              <span className="text-lg font-black text-white font-mono">{heightDisplay}</span>
              <span className="text-xs text-slate-400 font-mono ml-2">{weather.wavePeriodSeconds}s • {weather.waveDirection}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-xs font-bold text-slate-300 font-mono">Viento en Costa</span>
            <div className="text-right">
              <span className="text-sm font-bold text-white font-mono">{weather.windSpeedKnots} kts</span>
              <span className="text-xs text-slate-400 font-mono ml-2">{weather.windDirection} ({weather.windDegrees}°)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-300">Clasificación Vectorial:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] ${
                windInfo.isOffshore
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : windInfo.isOnshore
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {windInfo.windType} ({windInfo.ratingText})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {windInfo.description} Dif. angular: {windInfo.angleDiff}° vs orientación playa ({beachAngle}°).
            </p>
          </div>

          <div className="pt-1 text-xs space-y-2">
            {windInfo.isOffshore ? (
              <div className="flex items-center gap-2 text-emerald-400 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/50">
                <CheckCircle className="w-4 h-4 shrink-0" /> Viento Terral (Offshore) ideal: peina y ahueca la pared de la ola.
              </div>
            ) : windInfo.isOnshore ? (
              <div className="flex items-center gap-2 text-rose-400 font-mono bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/50">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Viento Onshore (Mar de tierra): arruga la ola y chafa la cresta.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 font-mono bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50">
                <Info className="w-4 h-4 shrink-0" /> Viento Costero (Sideshore): navegable pero con deriva lateral.
              </div>
            )}
            
            {weather.waveHeightMeters > 3 && (
              <div className="flex items-center gap-2 text-red-400 font-mono bg-red-950/40 p-2.5 rounded-xl border border-red-800/50">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Alerta: Oleaje mayor a 3m (Precaución extrema en el mar).
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

