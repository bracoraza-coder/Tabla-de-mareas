import React from 'react';
import { TideEvent } from '../../types';
import { Navigation } from 'lucide-react';

interface Period {
  start: string;
  end: string;
}

interface ActivityWaveChartProps {
  major: Period[];
  minor: Period[];
  sunrise?: string;
  sunset?: string;
  highLows?: TideEvent[];
}

function timeToDec(hhmm: string): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

export const ActivityWaveChart: React.FC<ActivityWaveChartProps> = ({
  major,
  minor,
  sunrise = '07:15',
  sunset = '21:30',
  highLows = []
}) => {
  // Chart geometry constants
  const svgWidth = 900;
  const svgHeight = 340;
  const marginL = 55;
  const marginR = 30;
  const marginT = 65;
  const marginB = 45;
  const chartW = svgWidth - marginL - marginR;
  const chartH = svgHeight - marginT - marginB;
  const baseY = marginT + chartH;

  const timeToX = (decHours: number) => marginL + (decHours / 24) * chartW;

  const sunriseDec = timeToDec(sunrise);
  const sunsetDec = timeToDec(sunset);
  const sunriseX = timeToX(sunriseDec);
  const sunsetX = timeToX(sunsetDec);

  // Process periods
  const majorFormatted = major.map(p => {
    const s = timeToDec(p.start);
    const e = timeToDec(p.end);
    let center = (s + e) / 2;
    if (e < s) center = (s + e + 24) / 2 % 24;
    return { ...p, startDec: s, endDec: e, centerDec: center, isMajor: true };
  });

  const minorFormatted = minor.map(p => {
    const s = timeToDec(p.start);
    const e = timeToDec(p.end);
    let center = (s + e) / 2;
    if (e < s) center = (s + e + 24) / 2 % 24;
    return { ...p, startDec: s, endDec: e, centerDec: center, isMajor: false };
  });

  const allPeriods = [...majorFormatted, ...minorFormatted].sort((a, b) => a.centerDec - b.centerDec);

  // Calculate curve points across 24 hours
  const points: { x: number; y: number; valPercent: number }[] = [];
  const steps = 144; // every 10 mins

  for (let i = 0; i <= steps; i++) {
    const dec = (i / steps) * 24;
    const x = timeToX(dec);

    // Base subtle tide wave
    let activity = 12 + Math.sin((dec / 12) * Math.PI) * 6;

    // Add activity peaks for each period using Gaussian bell curve
    allPeriods.forEach(p => {
      let dist = Math.abs(dec - p.centerDec);
      if (dist > 12) dist = 24 - dist; // wrap around 24h

      const spread = p.isMajor ? 1.4 : 0.95; // peak width in hours
      const maxBoost = p.isMajor ? 78 : 50;  // peak height %
      
      const boost = maxBoost * Math.exp(-Math.pow(dist / spread, 2));
      activity += boost;
    });

    // Clamp activity 0-100%
    const clampedVal = Math.min(98, Math.max(8, activity));
    const y = baseY - (clampedVal / 100) * chartH;
    points.push({ x, y, valPercent: clampedVal });
  }

  // Construct SVG paths
  const pathD = 'M ' + points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${baseY} L ${points[0].x.toFixed(1)},${baseY} Z`;

  // Get current hour in Spain timezone
  const now = new Date();
  const currentDec = now.getHours() + now.getMinutes() / 60;
  const currentX = timeToX(currentDec);

  return (
    <div className="w-full relative overflow-x-auto select-none rounded-xl bg-slate-950 border border-slate-800 shadow-2xl p-2 sm:p-4 touch-pan-x custom-scrollbar">
      {/* Mobile Touch Scroll Banner Hint */}
      <div className="sm:hidden flex items-center justify-between bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl text-[11px] text-cyan-300 font-mono mb-2">
        <span className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          Desliza lateralmente para explorar la onda solunar de 24h
        </span>
        <span className="text-[10px] text-slate-400 font-bold">00:00 → 24:00</span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[650px] block font-sans"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Main Wave Gradient */}
          <linearGradient id="solunarWaveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
          </linearGradient>

          {/* Stroke Gradient */}
          <linearGradient id="solunarStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Daylight Background Fill */}
          <linearGradient id="daylightBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.6" />
          </filter>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Daylight Zone Shading (Sunrise to Sunset) */}
        {sunriseX < sunsetX && (
          <g>
            <rect
              x={sunriseX}
              y={marginT - 15}
              width={sunsetX - sunriseX}
              height={chartH + 15}
              fill="url(#daylightBg)"
              rx="6"
            />
            {/* Sunrise line */}
            <line
              x1={sunriseX}
              y1={marginT - 15}
              x2={sunriseX}
              y2={baseY}
              stroke="#eab308"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            {/* Sunset line */}
            <line
              x1={sunsetX}
              y1={marginT - 15}
              x2={sunsetX}
              y2={baseY}
              stroke="#f97316"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            {/* Sun indicator text */}
            <text x={sunriseX + 6} y={marginT - 2} fill="#eab308" fontSize="10" fontWeight="bold" className="font-mono">
              🌅 {sunrise}
            </text>
            <text x={sunsetX - 6} y={marginT - 2} textAnchor="end" fill="#f97316" fontSize="10" fontWeight="bold" className="font-mono">
              🌆 {sunset}
            </text>
          </g>
        )}

        {/* 2. Grid Lines & Axis */}
        {/* Horizontal activity reference levels */}
        {[25, 50, 75].map((lvl) => {
          const ly = baseY - (lvl / 100) * chartH;
          return (
            <g key={lvl}>
              <line
                x1={marginL}
                y1={ly}
                x2={svgWidth - marginR}
                y2={ly}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.5"
              />
              <text
                x={marginL - 8}
                y={ly + 3}
                textAnchor="end"
                fill="#64748b"
                fontSize="9"
                fontWeight="bold"
                className="font-mono"
              >
                {lvl}%
              </text>
            </g>
          );
        })}

        {/* Y Axis Label */}
        <text
          x={12}
          y={marginT + chartH / 2}
          fill="#94a3b8"
          fontSize="10"
          fontWeight="bold"
          className="font-mono"
          transform={`rotate(-90, 12, ${marginT + chartH / 2})`}
          textAnchor="middle"
        >
          ACTIVIDAD SOLUNAR
        </text>

        {/* 3. Range Highlights for Major & Minor Periods */}
        {allPeriods.map((p, idx) => {
          const sx = timeToX(p.startDec);
          const ex = timeToX(p.endDec < p.startDec ? p.endDec + 24 : p.endDec);
          const pWidth = Math.max(12, ex - sx);
          const fillColor = p.isMajor ? '#f59e0b' : '#06b6d4';

          return (
            <g key={`range-${idx}`}>
              <rect
                x={sx}
                y={marginT}
                width={pWidth}
                height={chartH}
                fill={fillColor}
                opacity={p.isMajor ? 0.12 : 0.08}
                rx="4"
              />
              <line
                x1={sx}
                y1={marginT}
                x2={sx}
                y2={baseY}
                stroke={fillColor}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.4"
              />
              <line
                x1={ex}
                y1={marginT}
                x2={ex}
                y2={baseY}
                stroke={fillColor}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.4"
              />
            </g>
          );
        })}

        {/* 4. The Filled Area & Main Wave Curve */}
        <path d={areaD} fill="url(#solunarWaveFill)" />
        <path
          d={pathD}
          fill="none"
          stroke="url(#solunarStroke)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 5. Tide Events (Pleamar / Bajamar markers on baseline) */}
        {highLows.map((tide, idx) => {
          const dec = timeToDec(tide.time);
          const tx = timeToX(dec);
          const isHigh = tide.type === 'pleamar';
          const pointY = isHigh ? baseY - 12 : baseY + 12;

          return (
            <g key={`tide-${idx}`} transform={`translate(${tx}, ${baseY})`}>
              <line x1="0" y1="-8" x2="0" y2="8" stroke={isHigh ? '#38bdf8' : '#94a3b8'} strokeWidth="1" />
              <circle
                cx="0"
                cy={isHigh ? -10 : 10}
                r="3.5"
                fill={isHigh ? '#0284c7' : '#334155'}
                stroke={isHigh ? '#38bdf8' : '#64748b'}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y={isHigh ? -18 : 22}
                textAnchor="middle"
                fill={isHigh ? '#7dd3fc' : '#94a3b8'}
                fontSize="9"
                fontWeight="bold"
                className="font-mono"
              >
                {tide.time} {isHigh ? 'PLE' : 'BAJ'}
              </text>
            </g>
          );
        })}

        {/* 6. Period Peak Markers & Floating Badges */}
        {allPeriods.map((p, idx) => {
          const cx = timeToX(p.centerDec);
          
          // Calculate y value on curve at centerDec
          const pIndex = Math.min(steps, Math.max(0, Math.round((p.centerDec / 24) * steps)));
          const curveY = points[pIndex] ? points[pIndex].y : baseY - (p.isMajor ? 120 : 70);

          // Alternate badge Y offset to avoid overlap if two badges are close
          const prev = allPeriods[idx - 1];
          const isCloseToPrev = prev && Math.abs(p.centerDec - prev.centerDec) < 3.5;
          const badgeYOffset = isCloseToPrev ? (idx % 2 === 0 ? 45 : 15) : 25;

          const badgeY = Math.max(22, curveY - badgeYOffset);
          const isAmber = p.isMajor;
          const mainColor = isAmber ? '#f59e0b' : '#06b6d4';
          const bgBox = isAmber ? '#1e1b4b' : '#042f2e';
          const badgeBorder = isAmber ? '#f59e0b' : '#06b6d4';
          const labelText = isAmber ? 'MAYOR' : 'MENOR';
          const iconSymbol = isAmber ? '🔥' : '⚡';

          return (
            <g key={`badge-${idx}`}>
              {/* Vertical guideline from curve to badge */}
              <line
                x1={cx}
                y1={curveY}
                x2={cx}
                y2={badgeY + 12}
                stroke={mainColor}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.8"
              />

              {/* Glowing dot on wave peak */}
              <circle cx={cx} cy={curveY} r="6" fill={mainColor} filter={isAmber ? 'url(#glowGold)' : 'url(#glowCyan)'} />
              <circle cx={cx} cy={curveY} r="3" fill="#ffffff" />

              {/* Floating Badge Box */}
              <g transform={`translate(${cx}, ${badgeY})`}>
                <rect
                  x="-55"
                  y="-16"
                  width="110"
                  height="32"
                  rx="8"
                  fill={bgBox}
                  stroke={badgeBorder}
                  strokeWidth="2"
                  filter={isAmber ? 'url(#glowGold)' : 'url(#glowCyan)'}
                />
                
                {/* Time Range */}
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                  className="font-mono tracking-tight"
                >
                  {p.start} - {p.end}
                </text>

                {/* Type Label */}
                <text
                  x="0"
                  y="10"
                  textAnchor="middle"
                  fill={isAmber ? '#fde047' : '#67e8f9'}
                  fontSize="9"
                  fontWeight="bold"
                  className="font-mono tracking-widest uppercase"
                >
                  {iconSymbol} {labelText}
                </text>
              </g>
            </g>
          );
        })}

        {/* 7. Current Time Marker (AHORA) if within today */}
        {currentX >= marginL && currentX <= svgWidth - marginR && (
          <g>
            <line
              x1={currentX}
              y1={marginT - 10}
              x2={currentX}
              y2={baseY}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle cx={currentX} cy={marginT - 10} r="4" fill="#ef4444" />
            <rect x={currentX - 22} y={marginT - 25} width="44" height="14" rx="4" fill="#ef4444" />
            <text
              x={currentX}
              y={marginT - 15}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              className="font-mono"
            >
              AHORA
            </text>
          </g>
        )}

        {/* 8. Bottom X-Axis Hours (00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h, 24h) */}
        <line x1={marginL} y1={baseY} x2={svgWidth - marginR} y2={baseY} stroke="#475569" strokeWidth="1.5" />

        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => {
          const hx = timeToX(h);
          return (
            <g key={h} transform={`translate(${hx}, ${baseY})`}>
              <line x1="0" y1="0" x2="0" y2="6" stroke="#64748b" strokeWidth="1.5" />
              <text
                x="0"
                y="20"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="bold"
                className="font-mono"
              >
                {String(h).padStart(2, '0')}:00
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend / Key Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300 px-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 border border-amber-300 inline-block shadow-sm shadow-amber-500/50" />
            <span className="font-bold text-amber-300">🔥 Período Mayor (~2h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-cyan-500 border border-cyan-300 inline-block shadow-sm shadow-cyan-500/50" />
            <span className="font-bold text-cyan-300">⚡ Período Menor (~1h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block" />
            <span className="text-slate-400">Zona Solar (Día)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          💡 La máxima actividad ocurre cuando un período coincide con pleamar/bajamar.
        </div>
      </div>
    </div>
  );
};
