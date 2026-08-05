import React from 'react';
import { TideDayData, MarineWeather, Port, UserUnits } from '../types';
import { Waves, Wind, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { SurfDiagram } from './gauges/SurfDiagram';

interface SurfSectionProps {
  dayData: TideDayData;
  weather: MarineWeather;
  port: Port;
  units: UserUnits;
}

export const SurfSection: React.FC<SurfSectionProps> = ({ dayData, weather, port, units }) => {
  
  // Refined realistic surf calculation
  const isOffshore = weather.windDegrees >= 45 && weather.windDegrees <= 135; 
  const isLightWind = weather.windSpeedKnots <= 10;
  
  const isInland = port.region.toLowerCase().includes('río') || 
                   port.region.toLowerCase().includes('embalse') || 
                   port.name.toLowerCase().includes('río ') || 
                   port.name.toLowerCase().includes('embalse ');

  if (isInland) {
    return (
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800/50 p-6 shadow-xl relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <Waves className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Reporte de Surf & Pronóstico</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-slate-400">Spot:</span>
            <span className="text-sm font-medium text-emerald-400 truncate max-w-[200px]">{port.name}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/40 rounded-xl border border-slate-800/60 text-center">
          <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Ubicación no apta para surf</h3>
          <p className="text-slate-400 max-w-md text-sm leading-relaxed">
            Esta ubicación corresponde a aguas interiores (río o embalse) donde no se forman olas aptas para la práctica del surf.
          </p>
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

  // Wind score
  let windScore = 0;
  if (isOffshore) windScore = 25;
  else if (isLightWind) windScore = 15;
  else windScore = 5;

  let rating = Math.min(100, waveScore + periodScore + windScore);

  // Strict limits to prevent high ratings on flat days
  if (weather.waveHeightMeters < 0.4) {
    rating = Math.min(rating, 15); // Completely flat, restrict to poor
  } else if (weather.waveHeightMeters < 0.7) {
    rating = Math.min(rating, 45); // Very small, restrict to regular at best
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
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-teal-500 rounded-2xl p-5 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Reporte de Surf & Pronóstico</h2>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-800/80 font-bold">
          Spot: {port.name}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Rating & High Quality Surfer Artwork */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="w-full">
             <SurfDiagram rating={rating} />
          </div>
          <div className={`text-2xl font-black ${ratingColor} font-mono mt-3`}>{ratingText}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">Puntuación General: {rating}/100</div>
        </div>

        {/* Detailed Ocean Metrics */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Parámetros del Mar
          </h3>
          
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-xs font-bold text-slate-300 font-mono">Oleaje (Swell)</span>
            <div className="text-right">
              <span className="text-lg font-black text-white font-mono">{heightDisplay}</span>
              <span className="text-xs text-slate-400 font-mono ml-2">{weather.wavePeriodSeconds}s • {weather.waveDirection}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-xs font-bold text-slate-300 font-mono">Viento en la Playa</span>
            <div className="text-right">
              <span className="text-sm font-bold text-white font-mono">{weather.windSpeedKnots} kts</span>
              <span className="text-xs text-slate-400 font-mono ml-2">{weather.windDirection}</span>
            </div>
          </div>

          <div className="pt-2 text-xs space-y-2">
            {isOffshore ? (
              <div className="flex items-center gap-2 text-emerald-400 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/50">
                <CheckCircle className="w-4 h-4 shrink-0" /> Viento Offshore ideal (Abre y peina la ola)
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 font-mono bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Viento Onshore (Mar picado o desorganizado)
              </div>
            )}
            
            {weather.waveHeightMeters > 3 && (
              <div className="flex items-center gap-2 text-red-400 font-mono bg-red-950/40 p-2.5 rounded-xl border border-red-800/50">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Alerta: Mar de fuerza elevada (Solo expertos)
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
