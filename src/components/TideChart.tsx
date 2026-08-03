import React, { useMemo, useState, useRef } from 'react';
import { TideDayData, UserUnits, Port } from '../types';
import { Sunrise, Sunset, MousePointer2, Navigation } from 'lucide-react';

interface TideChartProps {
  data: TideDayData;
  units: UserUnits;
  port: Port;
}

export const TideChart: React.FC<TideChartProps> = ({ data, units, port }) => {
  const chartHeight = 220; // Internal SVG coord space
  const chartWidth = 1000;
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [hoverData, setHoverData] = useState<{
    x: number;
    time: string;
    height: number;
  } | null>(null);

  // Ensure we have curve points
  const points = data.curvePoints || [];
  
  // Find min/max for scaling
  const minHeight = Math.min(...points.map(p => p.height), 0); // floor at 0 for visual grounding
  const maxHeight = Math.max(...points.map(p => p.height), port.baseHeight + port.amplitude);
  const heightRange = (maxHeight - minHeight) || 1;

  // X scaling (0 to 24 hours mapped to 0 to chartWidth)
  const getX = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const decimalHours = h + m / 60;
    return (decimalHours / 24) * chartWidth;
  };

  // Y scaling (invert Y because SVG 0 is at the top)
  const getY = (height: number) => {
    const paddingTop = 30;
    const paddingBottom = 20;
    const availableHeight = chartHeight - paddingTop - paddingBottom;
    const normalizedHeight = (height - minHeight) / heightRange;
    return chartHeight - paddingBottom - (normalizedHeight * availableHeight);
  };

  // Generate SVG Path
  const d = useMemo(() => {
    if (points.length === 0) return '';
    let path = `M ${getX(points[0].time)} ${getY(points[0].height)}`;
    for (let i = 1; i < points.length; i++) {
       path += ` L ${getX(points[i].time)} ${getY(points[i].height)}`;
    }
    return path;
  }, [points, minHeight, maxHeight]);

  // Create area fill path (closes the curve to the bottom axis)
  const dArea = useMemo(() => {
    if (!d) return '';
    return `${d} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [d]);

  const formatH = (meters: number) => {
     if (units.height === 'ft') return `${(meters * 3.28084).toFixed(2)}ft`;
     return `${meters.toFixed(2)}m`;
  };

  // Time grid lines (every 3 hours)
  const timeGrid = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  // Current time line
  const now = new Date();
  const options = { timeZone: port.timezone, hour12: false, hour: '2-digit', minute: '2-digit' } as const;
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const nowTimeStr = formatter.format(now);
  const optionsDate = { timeZone: port.timezone, year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const dateParts = new Intl.DateTimeFormat('en-CA', optionsDate).formatToParts(now);
  const todayYMD = `${dateParts.find(p=>p.type==='year')?.value}-${dateParts.find(p=>p.type==='month')?.value}-${dateParts.find(p=>p.type==='day')?.value}`;
  
  const isToday = !data.dateStr || data.dateStr === todayYMD;
  const currentX = isToday ? getX(nowTimeStr) : -1;

  // Mouse / Touch interaction handler
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const targetX = ratio * chartWidth;

    // Find closest curve point
    let closest = points[0];
    let minDiff = Infinity;
    for (const p of points) {
      const px = getX(p.time);
      const diff = Math.abs(px - targetX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }

    setHoverData({
      x: getX(closest.time),
      time: closest.time,
      height: closest.height
    });
  };

  const handlePointerLeave = () => {
    setHoverData(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 scroll-mt-28" id="tide-chart-section">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
          Gráfica de Mareas Interactivas
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded normal-case font-mono">
            {data.dateStr}
          </span>
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1"><Sunrise className="w-3.5 h-3.5 text-amber-400" /> {data.sunrise}</div>
          <div className="flex items-center gap-1"><Sunset className="w-3.5 h-3.5 text-orange-500" /> {data.sunset}</div>
        </div>
      </div>

      {/* Mobile Touch Scroll Banner Hint */}
      <div className="sm:hidden flex items-center justify-between bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl text-[11px] text-cyan-300 font-mono">
        <span className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          Desliza lateralmente para navegar las 24 horas
        </span>
        <span className="text-[10px] text-slate-400 font-bold">00:00 → 24:00</span>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden p-1 sm:p-2">
        <div className="w-full overflow-x-auto overflow-y-hidden touch-pan-x custom-scrollbar">
          <div className="min-w-[680px] sm:min-w-full h-52 sm:h-72 relative cursor-crosshair group">
        
        {/* Interaction hint overlay when not hovering */}
        {!hoverData && (
          <div className="absolute top-2 right-2 pointer-events-none z-20">
            <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] text-cyan-300 font-mono flex items-center gap-1.5 shadow-md">
              <MousePointer2 className="w-3 h-3 text-cyan-400 animate-pulse" />
              Pasa el cursor / toca para ver altura exacta
            </div>
          </div>
        )}

        <svg 
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          preserveAspectRatio="none" 
          className="w-full h-full relative z-10 overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
             <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
             </linearGradient>
             
             <linearGradient id="nightFill" x1="0" y1="0" x2="1" y2="0">
               <stop offset="0%" stopColor="#0f172a" stopOpacity="0.6"/>
               <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6"/>
             </linearGradient>
          </defs>

          {/* Background Night/Day Shading */}
          <rect x="0" y="0" width={getX(data.sunrise)} height={chartHeight} fill="url(#nightFill)" />
          <rect x={getX(data.sunset)} y="0" width={chartWidth - getX(data.sunset)} height={chartHeight} fill="url(#nightFill)" />

          {/* X Grid (Time) */}
          {timeGrid.map(h => (
            <g key={h}>
              <line x1={getX(`${h}:00`)} y1="0" x2={getX(`${h}:00`)} y2={chartHeight} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              <text x={getX(`${h}:00`)} y={chartHeight - 4} fill="#64748b" fontSize="11" fontFamily="monospace" textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}>
                {h}h
              </text>
            </g>
          ))}

          {/* Area under curve */}
          <path d={dArea} fill="url(#waterFill)" />
          
          {/* The main tide curve */}
          <path d={d} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* High/Low Markers */}
          {data.highLows.map((hl, i) => {
            const isHigh = hl.type === 'pleamar';
            const cx = getX(hl.time);
            const cy = getY(hl.height);
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={cx} y2={cy + (isHigh ? -25 : 25)} stroke={isHigh ? '#60a5fa' : '#fbbf24'} strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={cx} cy={cy} r="4" fill="#0f172a" stroke={isHigh ? '#60a5fa' : '#fbbf24'} strokeWidth="2" />
                
                {/* Labels box */}
                <rect 
                  x={cx - 30} 
                  y={cy + (isHigh ? -45 : 15)} 
                  width="60" 
                  height="30" 
                  rx="4" 
                  fill="#1e293b" 
                  stroke={isHigh ? '#1e3a8a' : '#78350f'} 
                  strokeWidth="1" 
                />
                <text x={cx} y={cy + (isHigh ? -32 : 28)} fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {hl.time}
                </text>
                <text x={cx} y={cy + (isHigh ? -20 : 40)} fill={isHigh ? '#93c5fd' : '#fcd34d'} fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {formatH(hl.height)}
                </text>
              </g>
            );
          })}

          {/* Current Time Line */}
          {isToday && currentX >= 0 && currentX <= chartWidth && (
            <g>
              <line x1={currentX} y1="0" x2={currentX} y2={chartHeight} stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
              <rect x={currentX - 25} y="4" width="50" height="20" rx="4" fill="#10b981" />
              <text x={currentX} y="17" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                AHORA
              </text>
              <circle cx={currentX} cy={getY(data.currentWaterHeight)} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* Hover / Pointer Interactive Tooltip Marker */}
          {hoverData && (
            <g>
              <line 
                x1={hoverData.x} 
                y1="0" 
                x2={hoverData.x} 
                y2={chartHeight} 
                stroke="#38bdf8" 
                strokeWidth="1.5" 
                strokeDasharray="2 2" 
              />
              <circle 
                cx={hoverData.x} 
                cy={getY(hoverData.height)} 
                r="6" 
                fill="#38bdf8" 
                stroke="#0f172a" 
                strokeWidth="2" 
              />
              <circle 
                cx={hoverData.x} 
                cy={getY(hoverData.height)} 
                r="10" 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="1" 
                className="animate-ping" 
              />

              {/* Hover Badge */}
              <g transform={`translate(${Math.min(chartWidth - 110, Math.max(10, hoverData.x - 50))}, ${Math.max(10, getY(hoverData.height) - 45)})`}>
                <rect 
                  width="100" 
                  height="36" 
                  rx="6" 
                  fill="#0284c7" 
                  stroke="#38bdf8" 
                  strokeWidth="1" 
                />
                <text x="50" y="15" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {hoverData.time} h
                </text>
                <text x="50" y="29" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {formatH(hoverData.height)}
                </text>
              </g>
            </g>
          )}

        </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
         <div className="flex items-center gap-3">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Pleamares</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Bajamares</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Hora Actual</span>
         </div>
         <div>Cero hidrográfico de {port.name}</div>
      </div>

    </div>
  );
};

