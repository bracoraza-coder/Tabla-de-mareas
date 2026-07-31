import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ShieldCheck,
  Droplets,
  Anchor
} from 'lucide-react';
import { TideDayData, Port, UserUnits } from '../types';
import { formatZonedHHMM, getZoneAbbreviation } from '../utils/timezoneHelpers';

interface CurrentTideGaugeProps {
  dayData: TideDayData;
  port: Port;
  units: UserUnits;
  isViewingToday: boolean;
}

export const CurrentTideGauge: React.FC<CurrentTideGaugeProps> = ({
  dayData,
  port,
  units,
  isViewingToday,
}) => {
  const {
    currentWaterHeight,
    currentTideState,
    nextTide,
    nextTideTimeLeftStr,
    coefficient,
    highLows,
  } = dayData;

  // Convert height based on unit preference
  const formatHeight = (meters: number) => {
    if (units.height === 'ft') {
      const feet = meters * 3.28084;
      return `${feet.toFixed(2)} ft`;
    }
    return `${meters.toFixed(2)} m`;
  };

  // Coeficiente description
  let coeffCategory = 'Marea Media';
  let coeffBadgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  let coeffDesc = 'Amplitud de marea moderada. Corrientes normales.';

  if (coefficient >= 90) {
    coeffCategory = 'Marea Viva Extrema (Grandes mareas)';
    coeffBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    coeffDesc = 'Máxima diferencia entre pleamar y bajamar. Corrientes fuertes, ideal para mariscar en bajamar.';
  } else if (coefficient >= 70) {
    coeffCategory = 'Marea Viva';
    coeffBadgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    coeffDesc = 'Gran oscilación del agua. Excelente actividad de pesca en cambios de marea.';
  } else if (coefficient <= 45) {
    coeffCategory = 'Marea Muerta (Poca amplitud)';
    coeffBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    coeffDesc = 'Poca corriente y poca variación de nivel. Ideal para navegación tranquila y buceo.';
  }

  // Calculate percentage fill of water height (0% at bajamar min to 100% at pleamar max)
  const minH = Math.min(...highLows.map(h => h.height), 0.2);
  const maxH = Math.max(...highLows.map(h => h.height), port.baseHeight + port.amplitude);
  const fillPercent = Math.min(100, Math.max(5, ((currentWaterHeight - minH) / (maxH - minH)) * 100));

  const isRising = currentTideState === 'subiendo';

  const scrollToChart = () => {
    document.getElementById('tide-chart-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Real-time Water Height Live Gauge */}
        <div className="flex-1 bg-slate-950 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {isViewingToday ? (
                <>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Nivel de Agua Ahora (Modelo)
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Previsión para el {dayData.dateStr} (no es hoy)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-300 font-bold flex items-center gap-1 bg-blue-950/90 px-3 py-1 rounded-md border border-blue-800">
                <Anchor className="w-3.5 h-3.5 text-blue-400" />
                {port.name.split(' (')[0]}
              </span>
              <span
                className="text-xs text-cyan-300 font-bold font-mono flex items-center gap-1 bg-cyan-950/70 px-3 py-1 rounded-md border border-cyan-800"
                title={`Hora local de ${port.name.split(' (')[0]} (${port.timezone})`}
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {formatZonedHHMM(Date.now(), port.timezone)} {getZoneAbbreviation(Date.now(), port.timezone)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-2">
            
            {/* Height Display */}
            <div className="md:col-span-7 flex flex-col">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                {isViewingToday
                  ? `Altura Actual (${formatZonedHHMM(Date.now(), port.timezone)} hora local)`
                  : 'Altura Estimada a Mediodía (este día)'}
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
                  {formatHeight(currentWaterHeight)}
                </span>
                <span className="text-xs text-slate-400 font-mono">cero hidrográfico</span>
              </div>

              {/* Clickable State Pill to Scroll to Tide Chart */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={scrollToChart}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                    isRising 
                      ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-600/80 shadow-emerald-950/50'
                      : 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-600/80 shadow-amber-950/50'
                  }`}
                  title="Haz clic para ver la gráfica de mareas interactiva"
                  id="tide-status-button"
                >
                  {isRising ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span>▲ MAREA SUBIENDO (En Creciente)</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span>▼ MAREA BAJANDO (En Vaciante)</span>
                    </>
                  )}
                  <span className="text-[10px] bg-slate-900/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono font-normal ml-1">
                    Ver gráfica ➔
                  </span>
                </button>
              </div>
            </div>

            {/* Vertical Animated Tide Tank / Level Bar */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 font-bold mb-1.5 flex justify-between w-full font-mono">
                <span>Bajamar ({formatHeight(minH)})</span>
                <span>Pleamar ({formatHeight(maxH)})</span>
              </div>
              
              <div className="w-full h-7 bg-slate-950 rounded-lg overflow-hidden p-0.5 relative border border-slate-800 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 rounded transition-all duration-1000 relative flex items-center justify-end pr-2"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Droplets className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
              </div>

              <div className="text-[11px] font-bold text-blue-300 mt-2 font-mono">
                {Math.round(fillPercent)}% Amplitud Máxima
              </div>
            </div>

          </div>

          {/* Next Tide Countdown Banner - only meaningful for today */}
          {isViewingToday ? (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">
                  Próxima <strong className="text-white uppercase font-bold">{nextTide.type}</strong>:
                </span>
                <span className="font-bold text-blue-300 text-sm font-mono">{nextTide.time} h</span>
                <span className="text-slate-400 font-mono">({formatHeight(nextTide.height)})</span>
              </div>

              <div className="bg-blue-950 text-blue-200 border border-blue-800 px-3 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 font-mono">
                <span>TIEMPO RESTANTE:</span>
                <span className="text-white">{nextTideTimeLeftStr}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Consulta las 4 pleamares/bajamares de este día en la lista de la derecha. La cuenta atrás y la altura en vivo solo se muestran cuando ves el día de hoy.</span>
            </div>
          )}

        </div>

        {/* High / Low Tides List & Tidal Coefficient Card */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          {/* Tidal Coefficient Badge Card */}
          <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <Activity className="w-4 h-4 text-amber-400" />
                Coeficiente de Mareas
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${coeffBadgeBg}`}>
                {coefficient}
              </span>
            </div>

            <div className="flex items-center gap-4 my-1">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-inner">
                <span className="text-2xl font-black text-amber-300 font-mono">{coefficient}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">/ 120</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 uppercase tracking-wide">{coeffCategory}</div>
                <div className="text-[11px] text-slate-400 leading-tight mt-1">{coeffDesc}</div>
              </div>
            </div>
          </div>

          {/* Today's Pleamares & Bajamares Summary */}
          <div className="bg-slate-950 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-4 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Ciclo de Mareas {isViewingToday ? 'Hoy' : 'de Este Día'}</span>
              <span className="text-slate-400 text-[11px] font-mono">{dayData.dateStr}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {highLows.map((hl, idx) => {
                const isHigh = hl.type === 'pleamar';
                return (
                  <button 
                    key={idx}
                    onClick={scrollToChart}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all hover:border-cyan-500/80 ${
                      isHigh
                        ? 'bg-blue-950/40 border-blue-800 text-blue-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                    title={`Ver curva gráfica para ${hl.type} a las ${hl.time}h`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold uppercase text-[10px] flex items-center gap-1 ${isHigh ? 'text-blue-400' : 'text-amber-400'}`}>
                        {isHigh ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {hl.type}
                      </span>
                      <span className="font-mono font-bold text-white text-xs">{hl.time}</span>
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-0.5 flex items-center justify-between">
                      <span>{formatHeight(hl.height)}</span>
                      <span className="text-[9px] text-cyan-400 font-sans font-normal opacity-80">Ver ➔</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
