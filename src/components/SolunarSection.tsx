import React from 'react';
import { 
  Fish, 
  Sun, 
  Moon, 
  Star, 
  Clock, 
  Sparkles, 
  Sunrise, 
  Sunset, 
  Compass, 
  Award,
  Zap
} from 'lucide-react';
import { SolunarData } from '../types';

interface SolunarSectionProps {
  solunar: SolunarData;
  dateStr: string;
}

export const SolunarSection: React.FC<SolunarSectionProps> = ({
  solunar,
  dateStr,
}) => {
  const {
    activityScore,
    activityLabel,
    majorPeriods,
    minorPeriods,
    sunrise,
    solarNoon,
    sunset,
    dayLength,
    moonrise,
    moonset,
    moonTransit,
    moonPhaseName,
    moonPhaseIcon,
    moonIllumination,
    moonAgeDays,
  } = solunar;

  // Rating Stars Render
  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < activityScore
            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
            : 'text-slate-700'
        }`}
      />
    ));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-2xl space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 shrink-0">
            <Fish className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Tabla Solunar & Actividad de Pesca
              <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 rounded">
                {dateStr}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Horarios óptimos de alimentación marina según atracción gravitacional solar y lunar
            </p>
          </div>
        </div>

        {/* Solunar Activity Rating Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-4 shrink-0">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">{renderStars()}</div>
            <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 font-mono">ÍNDICE SOLUNAR</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-base font-black text-amber-300 uppercase tracking-wide">
              {activityLabel}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Score: {activityScore}/5
            </div>
          </div>
        </div>
      </div>

      {/* Major & Minor Fishing Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Major Periods */}
        <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                Períodos Mayores (~2 horas)
              </span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
              Máxima Actividad
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Ventanas principales de mayor intensidad en picadas de peces.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {majorPeriods.map((p, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{p.name}</div>
                  <div className="text-xs text-emerald-400 font-bold font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{p.start} - {p.end} h</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  EXCELENTE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Minor Periods */}
        <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider font-mono">
                Períodos Menores (~1 hora)
              </span>
            </div>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold uppercase">
              Actividad Media
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Oportunidades secundarias de pesca al salir o ponerse la luna.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {minorPeriods.map((p, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{p.name}</div>
                  <div className="text-xs text-blue-400 font-bold font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{p.start} - {p.end} h</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  BUENA
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Astronomical Sun & Moon Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sun Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Ciclo Solar</span>
            </div>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-mono">
              UV 8 (ALTO)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Sunrise className="w-3 h-3 text-amber-400" /> Salida
              </div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{sunrise} h</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Mediodía</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{solarNoon} h</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Sunset className="w-3 h-3 text-amber-500" /> Puesta
              </div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{sunset} h</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Duración Día</div>
              <div className="text-sm font-bold text-amber-300 mt-1 font-mono">{dayLength}</div>
            </div>
          </div>
        </div>

        {/* Moon Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-blue-300 text-xs font-bold uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" />
              <span>Ciclo Lunar ({moonPhaseName})</span>
            </div>
            <span className="text-xl">{moonPhaseIcon}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Salida Luna</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{moonrise} h</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tránsito</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{moonTransit} h</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Puesta Luna</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">{moonset} h</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Iluminación</div>
              <div className="text-sm font-bold text-blue-300 mt-1 font-mono">{moonIllumination}%</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
