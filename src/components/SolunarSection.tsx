import React from 'react';
import { TideDayData, Port, MarineWeather } from '../types';
import { Fish, Moon, Sun, Star, Flame, Zap, Clock, Info, Anchor } from 'lucide-react';
import { MoonPhaseDisc } from './gauges/WeatherGauges';
import { ActivityWaveChart } from './gauges/ActivityWaveChart';
import { FishingDiagram } from './gauges/FishingDiagram';

interface SolunarSectionProps {
  dayData: TideDayData;
  port: Port;
  weather?: MarineWeather;
}

export const SolunarSection: React.FC<SolunarSectionProps> = ({ dayData, port, weather }) => {
  const { solunar, sunrise, sunset, highLows } = dayData;
  let { moonPhaseName, illuminationPercent, isWaxing, majorPeriods, minorPeriods, activityScore } = solunar;

  // Enhance activityScore based on weather factors if available
  if (weather) {
    // base score (50%)
    let advancedScore = activityScore * 0.5;
    
    // Barometric Pressure (up to 30%)
    // Ideal: 1010-1018 hPa
    if (weather.pressureHpa >= 1010 && weather.pressureHpa <= 1018) {
      advancedScore += 30; // Perfect pressure
    } else if (weather.pressureHpa > 1018 && weather.pressureHpa < 1022) {
      advancedScore += 15; // Fair
    } else if (weather.pressureHpa < 1010) {
      advancedScore += 25; // Low pressure, fish usually feed actively
    } else {
      advancedScore += 5; // Very high pressure, fish go deep
    }

    // Water Temp (up to 20%)
    // Ideal for most coastal: 16-22°C
    if (weather.waterTemp >= 16 && weather.waterTemp <= 22) {
      advancedScore += 20;
    } else if (weather.waterTemp > 22 && weather.waterTemp <= 26) {
      advancedScore += 10;
    } else if (weather.waterTemp >= 12 && weather.waterTemp < 16) {
      advancedScore += 10;
    } else {
      advancedScore += 0;
    }

    activityScore = Math.min(100, Math.round(advancedScore));
  }

  let scoreColor = 'text-slate-400';
  let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
  let statusText = 'Actividad Normal';
  let stars = 1;

  if (activityScore >= 80) {
    scoreColor = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    statusText = 'Día Épico de Pesca';
    stars = 5;
  } else if (activityScore >= 60) {
    scoreColor = 'text-cyan-400';
    badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    statusText = 'Muy Favorable';
    stars = 4;
  } else if (activityScore >= 40) {
    scoreColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    statusText = 'Favorable';
    stars = 3;
  } else if (activityScore >= 20) {
    scoreColor = 'text-orange-400';
    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    statusText = 'Actividad Baja';
    stars = 2;
  } else {
    scoreColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    statusText = 'Condición Pobre';
    stars = 1;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Fish className="w-6 h-6 text-amber-400 shrink-0" />
            Efemérides Solunares & Pronóstico de Pesca
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculado con la Teoría Solunar de John Alden Knight para <strong className="text-slate-200">{port.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wide shadow-md ${badgeBg}`}>
            {statusText}
          </span>
          <div className="flex gap-0.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top 2 Summary Cards: Score & Moon Phase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Card 1: Fishing Activity Score */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Índice Solunar de Picada
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${scoreColor} font-mono tracking-tight`}>
                {activityScore}%
              </span>
              <span className="text-xs text-slate-400 font-mono">/100</span>
            </div>
            <p className="text-xs text-slate-300 font-medium max-w-[200px]">
              {activityScore >= 60
                ? 'Picos de actividad intensos. Las especies estarán alimentándose activamente.'
                : 'Actividad moderada. Se recomienda pescar durante los repuntes de marea.'}
            </p>
          </div>

          <div className="w-24 h-24 shrink-0 bg-slate-900/60 rounded-xl p-1 border border-slate-800">
            <FishingDiagram activityScore={activityScore} label={statusText} />
          </div>
        </div>

        {/* Card 2: Moon Phase & Sun Info */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Fase Lunar & Orto Solar
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-wide">{moonPhaseName}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Iluminación: <strong className="text-amber-300">{Math.round(illuminationPercent)}%</strong> ({isWaxing ? 'Creciente' : 'Menguante'})
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono pt-1">
              <span className="flex items-center gap-1 text-amber-400">
                <Sun className="w-3.5 h-3.5" /> Salida: {sunrise}
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <Sun className="w-3.5 h-3.5" /> Puesta: {sunset}
              </span>
            </div>
          </div>

          <div className="w-20 h-20 shrink-0 drop-shadow-lg flex items-center justify-center">
            <MoonPhaseDisc illuminationPercent={illuminationPercent} waxing={isWaxing} />
          </div>
        </div>

      </div>

      {/* MAIN FEATURE: Professional High-Visibility 24-Hour Solunar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Gráfica de Actividad de 24 Horas
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Picos de picada previstos en 24h
          </div>
        </div>

        <ActivityWaveChart
          major={majorPeriods}
          minor={minorPeriods}
          sunrise={sunrise}
          sunset={sunset}
          highLows={highLows}
        />
      </div>

      {/* Bottom Grid: Breakdown Cards for Major & Minor Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Major Periods */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-amber-400" /> Períodos Mayores (Picada Máxima ≈2h)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              Tránsito Lunar
            </span>
          </div>

          <div className="space-y-2">
            {majorPeriods.map((p, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-amber-900/40 hover:border-amber-500/50 p-3 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-mono text-base font-bold text-white">{p.start} - {p.end}</span>
                </div>
                <span className="text-xs font-mono text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/80">
                  Período #{idx + 1} (2 horas)
                </span>
              </div>
            ))}
            {majorPeriods.length === 0 && (
              <p className="text-xs text-slate-500 font-mono italic">No hay períodos mayores registrados para esta fecha.</p>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Los períodos mayores ocurren cuando la luna está directamente encima (cenit) o en las antípodas (nadir). Es el momento de máxima actividad biológica.
          </p>
        </div>

        {/* Minor Periods */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-cyan-400" /> Períodos Menores (Picada Moderada ≈1h)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Salida/Puesta Lunar
            </span>
          </div>

          <div className="space-y-2">
            {minorPeriods.map((p, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-cyan-900/40 hover:border-cyan-500/50 p-3 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-mono text-base font-bold text-white">{p.start} - {p.end}</span>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/80">
                  Período #{idx + 1} (1 hora)
                </span>
              </div>
            ))}
            {minorPeriods.length === 0 && (
              <p className="text-xs text-slate-500 font-mono italic">No hay períodos menores registrados para esta fecha.</p>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Los períodos menores coinciden con la salida y puesta de la luna en el horizonte. Generan aceleraciones breves pero intensas en la pesca.
          </p>
        </div>

      </div>

      {/* Advice Bar */}
      <div className="bg-slate-950/80 border border-amber-900/40 rounded-xl p-3.5 flex items-start sm:items-center gap-3 text-xs text-amber-200/90 font-mono">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <strong className="text-amber-300">Consejo Pro de Pesca:</strong> Si un período mayor o menor coincide con el cambio de marea (repunte de pleamar o bajamar), la probabilidad de picada es hasta un <strong className="text-white font-bold">300% mayor</strong>.
        </div>
      </div>

    </div>
  );
};
