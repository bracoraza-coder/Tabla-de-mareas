import React from 'react';
import { Waves, Wind, Timer, ShieldAlert, Sparkles, ArrowUp, Info, Ruler } from 'lucide-react';
import { MarineWeather, TideDayData, UserUnits, Port } from '../types';
import { getSurfConditions } from '../utils/surfEngine';

interface SurfSectionProps {
  weather: MarineWeather;
  dayData: TideDayData;
  port: Port;
  units: UserUnits;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  slate:   { bg: 'bg-slate-800/60',   text: 'text-slate-300',   border: 'border-slate-700',   ring: 'stroke-slate-500' },
  red:     { bg: 'bg-red-950/60',     text: 'text-red-300',     border: 'border-red-800',     ring: 'stroke-red-500' },
  amber:   { bg: 'bg-amber-950/60',   text: 'text-amber-300',   border: 'border-amber-800',   ring: 'stroke-amber-400' },
  cyan:    { bg: 'bg-cyan-950/60',    text: 'text-cyan-300',    border: 'border-cyan-800',    ring: 'stroke-cyan-400' },
  blue:    { bg: 'bg-blue-950/60',    text: 'text-blue-300',    border: 'border-blue-800',    ring: 'stroke-blue-400' },
  emerald: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800', ring: 'stroke-emerald-400' },
};

export const SurfSection: React.FC<SurfSectionProps> = ({ weather, dayData, port, units }) => {
  const surf = getSurfConditions(weather, dayData, port, units);
  const style = RATING_STYLES[surf.ratingColor] || RATING_STYLES.slate;
  const portShortName = port.name.split(' (')[0];

  const formatHeight = (meters: number) => {
    if (units.height === 'ft') return `${(meters * 3.28084).toFixed(1)} ft`;
    return `${meters.toFixed(1)} m`;
  };

  // Circular score gauge geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (surf.score / 10) * circumference;

  return (
    <section
      id="surf-section"
      className="bg-slate-900 border border-slate-800 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-2xl space-y-6 scroll-mt-24"
      aria-labelledby="surf-section-heading"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 id="surf-section-heading" className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-2xl leading-none">🏄</span>
            Previsión de Surf y Oleaje en {portShortName}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              PARTE DE SURF EN VIVO
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Estado del mar de fondo (swell), altura y periodo de ola, calidad del viento y mejor franja horaria para surfear hoy en {portShortName} ({port.region}). Datos gratuitos, actualizados con el modelo oceánico de Open-Meteo.
          </p>
        </div>
      </div>

      {/* Score + key stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Surf Score Gauge */}
        <div className={`lg:col-span-3 rounded-xl border ${style.border} ${style.bg} p-4 flex flex-col items-center justify-center text-center gap-2`}>
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" className="stroke-slate-800" />
              <circle
                cx="50" cy="50" r={radius} fill="none" strokeWidth="8" strokeLinecap="round"
                className={`${style.ring} transition-all duration-700`}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black font-mono ${style.text}`}>{surf.score.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-mono">/ 10</span>
            </div>
          </div>
          <div className={`text-sm font-bold uppercase tracking-wide ${style.text}`}>{surf.rating}</div>
          <div className="text-[11px] text-slate-400">Puntuación de la sesión</div>
        </div>

        {/* Swell stats */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Waves className="w-4 h-4 text-blue-400" /> Mar de Fondo (Swell)
            </div>
            <span className="text-[11px] text-slate-400">{surf.swellPowerLabel}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-3xl font-black text-white font-mono">{formatHeight(weather.swellHeightMeters)}</div>
              <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-center gap-1"><Ruler className="w-3 h-3" />Altura</div>
            </div>
            <div>
              <div className="text-3xl font-black text-blue-300 font-mono">{weather.swellPeriodSeconds}s</div>
              <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-center gap-1"><Timer className="w-3 h-3" />Periodo</div>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-1"
                title={`${weather.swellDirection} (${weather.swellDegrees}°)`}
              >
                <div style={{ transform: `rotate(${weather.swellDegrees}deg)` }} className="transition-transform duration-700">
                  <ArrowUp className="w-4 h-4 text-blue-300 fill-blue-300" />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">{weather.swellDirection}</div>
            </div>
          </div>
        </div>

        {/* Wind quality */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 border-l-4 border-l-cyan-500 rounded-xl p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Wind className="w-4 h-4 text-cyan-400" /> Viento vs. Oleaje
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border font-mono ${
              surf.windQuality === 'Offshore' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
              surf.windQuality === 'Onshore' ? 'bg-red-950 text-red-300 border-red-800' :
              surf.windQuality === 'Cruzado' ? 'bg-amber-950 text-amber-300 border-amber-800' :
              'bg-slate-900 text-slate-300 border-slate-700'
            }`}>
              {surf.windQuality.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{surf.windQualityDesc}</p>
          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            <span>Estimación orientativa: la orientación exacta de tu playa puede variar el resultado.</span>
          </div>
        </div>
      </div>

      {/* Board + Best window + Tide advice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5 font-mono">🏄 Tabla Recomendada</div>
          <p className="text-xs text-slate-300 leading-relaxed">{surf.boardRecommendation}</p>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1.5 font-mono">⏱ Mejor Franja Horaria</div>
          <p className="text-xs text-slate-300 leading-relaxed">{surf.bestWindow}</p>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5 font-mono">🌊 Corrientes y Marea</div>
          <p className="text-xs text-slate-300 leading-relaxed">{surf.tideAdvice}</p>
        </div>
      </div>

      {/* Safety banner */}
      {surf.safetyNote && (
        <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-800/70 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase mb-0.5">Aviso de Seguridad para Surfistas</div>
            <p className="text-xs text-amber-100/90 leading-relaxed">{surf.safetyNote}</p>
          </div>
        </div>
      )}

      {/* SEO-rich descriptive content + mini FAQ */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Guía Rápida de Surf en {portShortName}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {surf.summary} Consulta cada mañana la previsión de olas para <strong className="text-slate-200">{portShortName} ({port.region})</strong> antes de remar: la altura y el periodo del mar de fondo, junto con la relación entre el viento y la dirección del swell, son los tres factores que más determinan si merece la pena coger la tabla hoy. Recuerda que el periodo (en segundos) indica la energía real de la ola: periodos por encima de 10-12s suelen traer sesiones con más fuerza y recorrido que un mismo tamaño de ola con periodo corto.
        </p>

        <details className="group pt-1">
          <summary className="cursor-pointer select-none text-emerald-400 hover:text-emerald-300 font-mono text-[11px] font-bold list-none inline-flex items-center gap-1">
            <span className="group-open:hidden">Ver preguntas frecuentes sobre surf en {portShortName} ➔</span>
            <span className="hidden group-open:inline">Ocultar preguntas frecuentes ➔</span>
          </summary>
          <div className="pt-3 space-y-3 text-xs">
            <div>
              <div className="font-bold text-slate-200">¿Qué diferencia hay entre oleaje total y mar de fondo (swell)?</div>
              <p className="text-slate-400 mt-0.5">El oleaje total incluye tanto el swell (energía viajando desde lejos, la parte "surfeable") como el chop generado por el viento local. Para evaluar una sesión, el swell es el dato que más importa.</p>
            </div>
            <div>
              <div className="font-bold text-slate-200">¿Es mejor el viento offshore o onshore para surfear?</div>
              <p className="text-slate-400 mt-0.5">El viento offshore (de tierra hacia el mar) peina la ola y la mantiene limpia y hueca durante más tiempo. El onshore (de mar hacia tierra) tiende a desordenar la cara de la ola y adelantar el cierre.</p>
            </div>
            <div>
              <div className="font-bold text-slate-200">¿Qué marea es mejor para surfear en {portShortName}?</div>
              <p className="text-slate-400 mt-0.5">Depende de la profundidad y perfil de arena de cada pico concreto: algunas playas funcionan mejor en bajamar (bancos de arena expuestos) y otras en pleamar (más profundidad, evita fondos rocosos). Usa el gráfico de mareas de arriba para planificar tu sesión con antelación.</p>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
};
