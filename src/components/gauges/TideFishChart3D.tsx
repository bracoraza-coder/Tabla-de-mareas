import React, { useMemo, useState, useRef } from 'react';
import { TideDayData, UserUnits, Port, MarineWeather } from '../../types';
import { Sunrise, Sunset, Fish, Waves, Clock, Sparkles, HelpCircle, Flame, Zap, Compass, Navigation } from 'lucide-react';

interface TideFishChart3DProps {
  data: TideDayData;
  units: UserUnits;
  port: Port;
  weather?: MarineWeather;
}

export const TideFishChart3D: React.FC<TideFishChart3DProps> = ({ data, units, port, weather }) => {
  const chartHeight = 320;
  const chartWidth = 1000;
  const svgRef = useRef<SVGSVGElement>(null);

  const [hoverData, setHoverData] = useState<{
    x: number;
    time: string;
    height: number;
  } | null>(null);

  const points = data.curvePoints || [];
  const highLows = data.highLows || [];
  const solunar = data.solunar || {
    activityScore: 50,
    moonPhaseName: 'Cuarto Creciente',
    illuminationPercent: 50,
    majorPeriods: [],
    minorPeriods: []
  };

  // Convert height based on user units
  const formatH = (hMeters: number) => {
    if (units.height === 'ft') {
      return `${(hMeters * 3.28084).toFixed(2)} ft`;
    }
    return `${hMeters.toFixed(2)} m`;
  };

  // Min and Max height bounds with margin
  const heights = points.map(p => p.height);
  const minHeight = Math.min(...(heights.length ? heights : [0]), 0) - 0.2;
  const maxHeight = Math.max(...(heights.length ? heights : [3]), 3) + 0.4;

  const getX = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalHours = (h || 0) + (m || 0) / 60;
    return (totalHours / 24) * chartWidth;
  };

  const getY = (height: number) => {
    const paddingTop = 50;
    const paddingBottom = 45;
    const available = chartHeight - paddingTop - paddingBottom;
    const ratio = (height - minHeight) / (maxHeight - minHeight || 1);
    return chartHeight - paddingBottom - ratio * available;
  };

  // Build SVG path string for tide curve
  const dCurve = useMemo(() => {
    if (points.length === 0) return '';
    let path = `M ${getX(points[0].time)} ${getY(points[0].height)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${getX(points[i].time)} ${getY(points[i].height)}`;
    }
    return path;
  }, [points, minHeight, maxHeight]);

  // Build filled ocean polygon path
  const dOceanFill = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = getX(points[0].time);
    const lastX = getX(points[points.length - 1].time);
    const bottomY = chartHeight - 22;
    return `${dCurve} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [dCurve, points]);

  // Time utilities
  const parseTimeToDecimal = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const sunriseDec = parseTimeToDecimal(data.sunrise || '07:15');
  const sunsetDec = parseTimeToDecimal(data.sunset || '21:30');

  const sunriseX = (sunriseDec / 24) * chartWidth;
  const sunsetX = (sunsetDec / 24) * chartWidth;

  // Real-time Current Time calculation in target timezone
  const now = new Date();
  let nowTimeStr = '12:00';
  try {
    const options = { timeZone: port.timezone, hour12: false, hour: '2-digit', minute: '2-digit' } as const;
    nowTimeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
  } catch {
    nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  const currentDec = parseTimeToDecimal(nowTimeStr);
  const currentX = (currentDec / 24) * chartWidth;

  // Interpolate current water height from curve points
  const currentHeightInterpolated = useMemo(() => {
    if (points.length === 0) return data.currentWaterHeight || 2.0;
    let closest = points[0];
    let minDiff = Infinity;
    for (const p of points) {
      const pDec = parseTimeToDecimal(p.time);
      const diff = Math.abs(pDec - currentDec);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    return closest.height;
  }, [points, currentDec, data.currentWaterHeight]);

  // Enhance activityScore based on weather factors if available
  let activityScore = solunar.activityScore ?? 50;
  if (weather) {
    let advancedScore = activityScore * 0.5;
    if (weather.pressureHpa >= 1010 && weather.pressureHpa <= 1018) advancedScore += 30;
    else if (weather.pressureHpa > 1018 && weather.pressureHpa < 1022) advancedScore += 15;
    else if (weather.pressureHpa < 1010) advancedScore += 25;
    else advancedScore += 5;

    if (weather.waterTemp >= 16 && weather.waterTemp <= 22) advancedScore += 20;
    else if (weather.waterTemp > 22 && weather.waterTemp <= 26) advancedScore += 10;
    else if (weather.waterTemp >= 12 && weather.waterTemp < 16) advancedScore += 10;
    else advancedScore += 0;

    activityScore = Math.min(100, Math.round(advancedScore));
  }

  const score = activityScore;
  const isEpic = score >= 80;
  const isPoor = score < 35;

  // Check if current time is inside a Major or Minor period
  const isTimeInPeriod = (dec: number, startStr: string, endStr: string) => {
    const s = parseTimeToDecimal(startStr);
    let e = parseTimeToDecimal(endStr);
    if (e < s) e += 24;
    const decAdj = dec < s && e > 24 ? dec + 24 : dec;
    return decAdj >= s && decAdj <= e;
  };

  const isCurrentInMajor = (solunar.majorPeriods || []).some(p => isTimeInPeriod(currentDec, p.start, p.end));
  const isCurrentInMinor = (solunar.minorPeriods || []).some(p => isTimeInPeriod(currentDec, p.start, p.end));

  let nowStatusText = 'Baja / Reposo';
  let nowStatusColor = 'bg-slate-800/90 text-slate-300 border-slate-700';
  let nowStatusBadge = '💤 Pesca Base';

  if (isCurrentInMajor) {
    nowStatusText = 'PICO MAYOR (Máxima Picada)';
    nowStatusColor = 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-lg shadow-amber-950/50';
    nowStatusBadge = '🔥 PICADA MÁXIMA';
  } else if (isCurrentInMinor) {
    nowStatusText = 'PICO MENOR (Picada Buena)';
    nowStatusColor = 'bg-cyan-950/90 text-cyan-300 border-cyan-500 shadow-md';
    nowStatusBadge = '⚡ PICADA BUENA';
  }

  // Generate Smart Fish Distribution positioned cleanly without overlapping badges
  const fishList = useMemo(() => {
    const list: {
      id: string;
      x: number;
      y: number;
      type: 'major' | 'minor' | 'normal';
      scale: number;
      flip: boolean;
    }[] = [];

    // Scale modifier based on the day's advanced score
    const scaleModifier = isEpic ? 1.3 : (isPoor ? 0.6 : 1.0);

    // 1. Major Periods Fish
    (solunar.majorPeriods || []).forEach((p, idx) => {
      const startDec = parseTimeToDecimal(p.start);
      let endDec = parseTimeToDecimal(p.end);
      if (endDec < startDec) endDec += 24;
      const midDec = (startDec + endDec) / 2 % 24;

      // More fish if epic day, fewer if poor
      let offsets = [-0.4, 0.4];
      if (isEpic) offsets = [-0.6, -0.2, 0.2, 0.6];
      if (isPoor) offsets = [0]; // Just one small fish in major periods on poor days
      
      offsets.forEach((offset, fIdx) => {
        const dec = (midDec + offset + 24) % 24;
        const x = (dec / 24) * chartWidth;
        const depthY = chartHeight - 50 - (fIdx % 2) * 22;
        list.push({
          id: `major-${idx}-${fIdx}`,
          x,
          y: depthY,
          type: 'major',
          scale: (1.05 + (fIdx % 2) * 0.1) * scaleModifier,
          flip: fIdx % 2 === 1,
        });
      });
    });

    // 2. Minor Periods Fish
    (solunar.minorPeriods || []).forEach((p, idx) => {
      const startDec = parseTimeToDecimal(p.start);
      let endDec = parseTimeToDecimal(p.end);
      if (endDec < startDec) endDec += 24;
      const midDec = (startDec + endDec) / 2 % 24;

      let offsets = [-0.2, 0.2];
      if (isEpic) offsets = [-0.3, 0, 0.3];
      if (isPoor) offsets = [0]; // Just one small fish
      
      offsets.forEach((offset, fIdx) => {
        const dec = (midDec + offset + 24) % 24;
        const x = (dec / 24) * chartWidth;
        const depthY = chartHeight - 42 - (fIdx % 2) * 18;
        list.push({
          id: `minor-${idx}-${fIdx}`,
          x,
          y: depthY,
          type: 'minor',
          scale: 0.8 * scaleModifier,
          flip: fIdx % 2 === 0,
        });
      });
    });

    // 3. Normal background fish
    let hours = [1, 4, 8, 11, 14, 17, 20, 23];
    if (isEpic) {
      hours = [1, 3, 5, 8, 10, 11, 14, 16, 17, 20, 22, 23]; // Lots of fish
    } else if (isPoor) {
      hours = [4, 14, 20]; // Very few fish
    }

    hours.forEach((h, idx) => {
      const inMajor = (solunar.majorPeriods || []).some(p => isTimeInPeriod(h, p.start, p.end));
      const inMinor = (solunar.minorPeriods || []).some(p => isTimeInPeriod(h, p.start, p.end));
      if (!inMajor && !inMinor) {
        const x = (h / 24) * chartWidth;
        const depthY = chartHeight - 34 - (idx % 2) * 12;
        list.push({
          id: `normal-${idx}`,
          x,
          y: depthY,
          type: 'normal',
          scale: 0.55 * scaleModifier,
          flip: idx % 2 === 1,
        });
      }
    });

    return list;
  }, [solunar.majorPeriods, solunar.minorPeriods, isEpic, isPoor]);

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const targetX = ratio * chartWidth;

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
      height: closest.height,
    });
  };

  const handlePointerLeave = () => {
    setHoverData(null);
  };

  const currentY = getY(currentHeightInterpolated);

  // Use the advanced score instead of raw solunar activity score
  let overallLabel = 'Media';
  let overallColor = 'text-amber-400 bg-amber-950/60 border-amber-800';

  if (score < 35) {
    overallLabel = 'Baja';
    overallColor = 'text-slate-400 bg-slate-900/80 border-slate-700';
  } else if (score < 65) {
    overallLabel = 'Media';
    overallColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  } else if (score < 85) {
    overallLabel = 'Alta 🎣';
    overallColor = 'text-cyan-300 bg-cyan-950/80 border-cyan-700';
  } else {
    overallLabel = 'Muy Alta 🔥';
    overallColor = 'text-amber-300 bg-gradient-to-r from-amber-900/80 to-red-900/80 border-amber-500 shadow-lg';
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 border border-slate-800/80 rounded-2xl p-3 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden" id="tide-chart-section">
      
      {/* 1. Header with Live Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40 border border-cyan-400/30 shrink-0">
            <Waves className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm sm:text-lg tracking-wide flex items-center gap-2 drop-shadow">
              Gráfica Mareográfica & Pesca en Tiempo Real
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Puerto de <span className="text-cyan-300 font-semibold">{port.name}</span> • {data.dateStr}
            </p>
          </div>
        </div>

        {/* Live Current Time & Solunar Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${nowStatusColor}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>AHORA ({nowTimeStr} h): <strong>{nowStatusText}</strong></span>
          </div>

          <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 shadow-md ${overallColor}`}>
            <Fish className="w-4 h-4" />
            <span>Día Global: {overallLabel}</span>
          </div>
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

      {/* 2. Interactive SVG Chart Container with Mobile Smooth Horizontal Scroll */}
      <div className="relative w-full rounded-2xl bg-slate-950 border border-cyan-900/50 shadow-inner overflow-hidden p-1 sm:p-2">
        <div className="w-full overflow-x-auto overflow-y-hidden touch-pan-x custom-scrollbar">
          <div className="min-w-[680px] sm:min-w-full h-80 sm:h-96 relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full relative z-10 overflow-visible cursor-crosshair select-none"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              <defs>
                <linearGradient id="daySkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                </linearGradient>

                <linearGradient id="nightSkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                </linearGradient>

                <linearGradient id="oceanDepth3D" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                  <stop offset="40%" stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="85%" stopColor="#0369a1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="goldFishGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                <linearGradient id="cyanFishGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                <filter id="glow3D" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>

                <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.7" />
                </filter>

                <filter id="glowNow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* 1. Day / Night Sky Background */}
              <rect x="0" y="0" width={sunriseX} height={chartHeight} fill="url(#nightSkyGrad)" />
              <rect x={sunriseX} y="0" width={sunsetX - sunriseX} height={chartHeight} fill="url(#daySkyGrad)" />
              <rect x={sunsetX} y="0" width={chartWidth - sunsetX} height={chartHeight} fill="url(#nightSkyGrad)" />

              {/* Sunrise / Sunset Divider Lines */}
              <g stroke="#38bdf8" strokeDasharray="3 3" strokeOpacity="0.35" strokeWidth="1">
                <line x1={sunriseX} y1="0" x2={sunriseX} y2={chartHeight - 20} />
                <line x1={sunsetX} y1="0" x2={sunsetX} y2={chartHeight - 20} />
              </g>

              {/* Sunrise / Sunset Tags */}
              <g transform={`translate(${sunriseX - 18}, 10)`}>
                <rect x="0" y="0" width="36" height="16" rx="4" fill="#0369a1" opacity="0.85" />
                <text x="18" y="11" fill="#fde047" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  ☀ {data.sunrise || '07:15'}
                </text>
              </g>

              <g transform={`translate(${sunsetX - 18}, 10)`}>
                <rect x="0" y="0" width="36" height="16" rx="4" fill="#0f172a" opacity="0.85" />
                <text x="18" y="11" fill="#fb923c" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  🌙 {data.sunset || '21:30'}
                </text>
              </g>

              {/* 2. Solunar Period Shaded Columns with Top Headers */}
              {(solunar.majorPeriods || []).map((p, idx) => {
                const sx = getX(p.start);
                const ex = getX(p.end);
                const w = Math.max(30, ex - sx);
                const midX = sx + w / 2;
                return (
                  <g key={`major-zone-${idx}`}>
                    <rect x={sx} y="30" width={w} height={chartHeight - 52} fill="#f59e0b" opacity="0.1" rx="6" />
                    <line x1={sx} y1="30" x2={sx} y2={chartHeight - 22} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                    <line x1={ex} y1="30" x2={ex} y2={chartHeight - 22} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                    
                    {/* Top Solunar Period Header Banner */}
                    <g transform={`translate(${Math.max(45, Math.min(chartWidth - 45, midX))}, 32)`}>
                      <rect x="-42" y="-9" width="84" height="18" rx="5" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                      <text x="0" y="3" fill="#fde047" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        🔥 MAYOR ({p.start}-{p.end})
                      </text>
                    </g>
                  </g>
                );
              })}

              {(solunar.minorPeriods || []).map((p, idx) => {
                const sx = getX(p.start);
                const ex = getX(p.end);
                const w = Math.max(25, ex - sx);
                const midX = sx + w / 2;
                return (
                  <g key={`minor-zone-${idx}`}>
                    <rect x={sx} y="30" width={w} height={chartHeight - 52} fill="#06b6d4" opacity="0.08" rx="6" />
                    
                    {/* Top Solunar Minor Header Banner */}
                    <g transform={`translate(${Math.max(45, Math.min(chartWidth - 45, midX))}, 32)`}>
                      <rect x="-42" y="-9" width="84" height="18" rx="5" fill="#042f2e" stroke="#06b6d4" strokeWidth="1" />
                      <text x="0" y="3" fill="#67e8f9" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        ⚡ MENOR ({p.start}-{p.end})
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 3. Water Height Horizontal Grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
                const hVal = minHeight + step * (maxHeight - minHeight);
                const yPos = getY(hVal);
                return (
                  <g key={idx}>
                    <line
                      x1="0"
                      y1={yPos}
                      x2={chartWidth}
                      y2={yPos}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray={idx === 0 || idx === 4 ? '0' : '4 4'}
                      opacity="0.5"
                    />
                    <text
                      x="8"
                      y={yPos - 4}
                      fill="#64748b"
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {formatH(hVal)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Hours Grid */}
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => {
                const xPos = (h / 24) * chartWidth;
                return (
                  <g key={h}>
                    <line
                      x1={xPos}
                      y1="30"
                      x2={xPos}
                      y2={chartHeight - 22}
                      stroke="#1e293b"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    <text
                      x={xPos}
                      y={chartHeight - 6}
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle font-bold"
                    >
                      {h < 10 ? `0${h}:00` : `${h}:00`}
                    </text>
                  </g>
                );
              })}

              {/* Seabed Floor */}
              <rect x="0" y={chartHeight - 22} width={chartWidth} height="22" fill="#0f172a" opacity="0.95" />
              <line x1="0" y1={chartHeight - 22} x2={chartWidth} y2={chartHeight - 22} stroke="#334155" strokeWidth="1.5" />

              {/* 4. Ocean Fill & Tide Curve */}
              {dOceanFill && (
                <path
                  d={dOceanFill}
                  fill="url(#oceanDepth3D)"
                />
              )}

              {dCurve && (
                <>
                  <path
                    d={dCurve}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="6"
                    opacity="0.35"
                    transform="translate(0, 3)"
                  />
                  <path
                    d={dCurve}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow3D)"
                  />
                </>
              )}

              {/* 5. Fish Swimming in the Ocean */}
              {fishList.map((f) => {
                const isMajor = f.type === 'major';
                const isMinor = f.type === 'minor';

                let fillGrad = '#38bdf8';
                let strokeColor = '#0284c7';
                let filterStyle = undefined;
                let opacityVal = '0.75';

                if (isMajor) {
                  fillGrad = 'url(#goldFishGrad)';
                  strokeColor = '#f59e0b';
                  filterStyle = 'url(#glowGold)';
                  opacityVal = '1';
                } else if (isMinor) {
                  fillGrad = 'url(#cyanFishGrad)';
                  strokeColor = '#3b82f6';
                  filterStyle = 'url(#glowCyan)';
                  opacityVal = '0.85';
                }

                return (
                  <g key={f.id}>
                    <g
                      transform={`translate(${f.x}, ${f.y}) scale(${f.scale * (f.flip ? -1 : 1)}, ${f.scale})`}
                      filter={filterStyle}
                      opacity={opacityVal}
                    >
                      {isMajor ? (
                        /* Big Trophy Fish */
                        <g>
                          <path
                            d="M -14,0 C -7,-8 7,-8 14,0 C 7,8 -7,8 -14,0 Z M -14,0 L -20,-7 L -17,0 L -20,7 Z M -2,-7 Q 3,-11 7,-6 Z"
                            fill={fillGrad}
                            stroke={strokeColor}
                            strokeWidth="1.2"
                          />
                          <circle cx="8" cy="-2.5" r="1.3" fill="#ffffff" />
                          <circle cx="8.3" cy="-2.5" r="0.7" fill="#000000" />
                        </g>
                      ) : isMinor ? (
                        /* Medium Fish */
                        <g>
                          <path
                            d="M -11,0 C -5,-6 5,-6 11,0 C 5,6 -5,6 -11,0 Z M -11,0 L -16,-5 L -14,0 L -16,5 Z"
                            fill={fillGrad}
                            stroke={strokeColor}
                            strokeWidth="1"
                          />
                          <circle cx="6" cy="-1.8" r="1.1" fill="#ffffff" />
                          <circle cx="6.2" cy="-1.8" r="0.6" fill="#000000" />
                        </g>
                      ) : (
                        /* Small Fish */
                        <g>
                          <path
                            d="M -9,0 C -4,-4.5 4,-4.5 9,0 C 4,4.5 -4,4.5 -9,0 Z M -9,0 L -13,-3.5 L -11,0 L -13,3.5 Z"
                            fill={fillGrad}
                            stroke={strokeColor}
                            strokeWidth="0.8"
                          />
                          <circle cx="4" cy="-1" r="0.7" fill="#0f172a" />
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* 6. Pleamar & Bajamar Markers */}
              {highLows.map((evt, idx) => {
                const xPos = getX(evt.time);
                const yPos = getY(evt.height);
                const isHigh = evt.type === 'pleamar';

                return (
                  <g key={idx} className="cursor-pointer group">
                    <line
                      x1={xPos}
                      y1={yPos}
                      x2={xPos}
                      y2={chartHeight - 22}
                      stroke={isHigh ? '#06b6d4' : '#f59e0b'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                    <circle
                      cx={xPos}
                      cy={yPos}
                      r="7"
                      fill={isHigh ? '#06b6d4' : '#f59e0b'}
                      opacity="0.25"
                      className="animate-ping"
                    />
                    <circle
                      cx={xPos}
                      cy={yPos}
                      r="5.5"
                      fill={isHigh ? '#0284c7' : '#d97706'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    
                    {/* Badge Box */}
                    <g transform={`translate(${Math.max(40, Math.min(chartWidth - 40, xPos))}, ${isHigh ? Math.max(22, yPos - 22) : Math.min(chartHeight - 36, yPos + 22)})`}>
                      <rect
                        x="-38"
                        y="-10"
                        width="76"
                        height="20"
                        rx="5"
                        fill={isHigh ? '#0369a1' : '#78350f'}
                        stroke={isHigh ? '#38bdf8' : '#fbbf24'}
                        strokeWidth="1.2"
                        className="shadow-xl"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {isHigh ? '▲ PLEA ' : '▼ BAJA '}
                        {evt.time}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 7. Current Time Highlight Line ("AHORA") */}
              {currentX >= 0 && currentX <= chartWidth && (
                <g className="z-30">
                  <line
                    x1={currentX}
                    y1="30"
                    x2={currentX}
                    y2={chartHeight - 22}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    filter="url(#glowNow)"
                  />

                  {/* Pulsing Dot at current height */}
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r="10"
                    fill="#10b981"
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r="6"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="url(#glowNow)"
                  />

                  {/* Floating Flag: "AHORA" + Time */}
                  <g transform={`translate(${Math.max(45, Math.min(chartWidth - 45, currentX))}, ${Math.min(chartHeight - 65, Math.max(55, currentY - 25))})`}>
                    <rect
                      x="-42"
                      y="-12"
                      width="84"
                      height="24"
                      rx="6"
                      fill="#064e3b"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      filter="url(#glowNow)"
                      className="shadow-2xl"
                    />
                    <text
                      x="0"
                      y="-1"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="900"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      📍 AHORA {nowTimeStr}
                    </text>
                    <text
                      x="0"
                      y="8"
                      fill="#a7f3d0"
                      fontSize="7.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {formatH(currentHeightInterpolated)}
                    </text>
                  </g>
                </g>
              )}

              {/* 8. Hover Interactive Tooltip */}
              {hoverData && (
                <g>
                  <line
                    x1={hoverData.x}
                    y1="25"
                    x2={hoverData.x}
                    y2={chartHeight - 20}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={hoverData.x}
                    cy={getY(hoverData.height)}
                    r="6"
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />

                  <g transform={`translate(${Math.min(chartWidth - 100, Math.max(10, hoverData.x - 45))}, ${Math.max(15, getY(hoverData.height) - 40)})`}>
                    <rect
                      width="90"
                      height="34"
                      rx="7"
                      fill="#0284c7"
                      stroke="#7dd3fc"
                      strokeWidth="1.5"
                      className="shadow-2xl"
                    />
                    <text x="45" y="14" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {hoverData.time} h
                    </text>
                    <text x="45" y="27" fill="#e0f2fe" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {formatH(hoverData.height)}
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Fish Visual Legend */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 inline-block shadow-sm shadow-amber-500/50" />
            <span className="font-bold text-amber-300 text-[11px] sm:text-xs">Dorados: P. Mayor (~2h Máxima)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 border border-cyan-300 inline-block shadow-sm shadow-cyan-400/50" />
            <span className="font-bold text-cyan-300 text-[11px] sm:text-xs">Turquesa: P. Menor (~1h Picada)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
            <span className="text-slate-400 text-[11px] sm:text-xs">Pequeños: Actividad Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white inline-block shadow-sm shadow-emerald-500/50 animate-pulse" />
            <span className="font-bold text-emerald-400 text-[11px] sm:text-xs">📍 Verde: Hora Actual ({nowTimeStr}h)</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Daily Tide Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
              <Waves className="w-4 h-4" /> Mareas del Día
            </span>
            <span className="text-[11px] font-mono text-slate-400">Coef. {data.coefficient}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {highLows.map((h, i) => (
              <div key={i} className={`p-2 rounded-lg border ${h.type === 'pleamar' ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200' : 'bg-amber-950/40 border-amber-800/60 text-amber-200'}`}>
                <div className="font-bold uppercase text-[10px] text-slate-400">
                  {h.type === 'pleamar' ? '▲ Pleamar' : '▼ Bajamar'}
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">{h.time} h</div>
                <div className="text-[11px]">{formatH(h.height)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Current Time & Solunar Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Situación en Directo
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">{nowTimeStr} h</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Altura Agua Ahora:</span>
              <span className="text-cyan-300 font-bold">{formatH(currentHeightInterpolated)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fase Lunar:</span>
              <span className="text-white font-semibold">{solunar.moonPhaseName} ({solunar.illuminationPercent}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dictamen Picada:</span>
              <span className="text-emerald-300 font-bold">{nowStatusBadge}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Hydrographic Legend & Info */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" /> Referencia Hidrográfica
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>Día (Sol en horizonte): Franja clara</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
              <span>Noche (Bajo horizonte): Franja oscura</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              Referencia a Cero Hidrográfico local del Puerto de {port.name}.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TideFishChart3D;
