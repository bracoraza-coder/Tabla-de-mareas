import React from 'react';

/* ============================================================
   Shared helpers
   ============================================================ */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/* ============================================================
   1) Semi-circular gauge (used for barometric pressure)
   Discrete radial segments for uniform, distortion-free display.
   ============================================================ */
interface PressureGaugeProps {
  value: number; // hPa
  min?: number;
  max?: number;
  trend: 'ascenso' | 'descenso' | 'estable';
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({ value, min = 990, max = 1040, trend }) => {
  const cx = 100, cy = 82, r = 54;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / (max - min);
  const needleAngle = -90 + pct * 180;

  // 16 discrete uniform segments across 180 degrees
  const totalSegments = 16;
  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const fraction = i / (totalSegments - 1);
    const angle = -90 + fraction * 180;
    const segVal = min + fraction * (max - min);

    let color = '#38bdf8'; // sky blue
    let label = 'Normal';
    if (segVal < 1002) {
      color = '#f97316'; // low / orange
      label = 'Baja';
    } else if (segVal < 1009) {
      color = '#facc15'; // yellow
      label = 'Variable';
    } else if (segVal <= 1022) {
      color = '#38bdf8'; // normal
      label = 'Estable';
    } else {
      color = '#3b82f6'; // high / blue
      label = 'Alta';
    }

    const posInner = polarToCartesian(cx, cy, r - 12, angle);
    const posOuter = polarToCartesian(cx, cy, r, angle);
    const isActive = segVal <= clamped;

    return { i, angle, segVal, color, label, posInner, posOuter, isActive };
  });

  const tip = polarToCartesian(cx, cy, r + 2, needleAngle);

  // Status classification
  let statusText = 'PRESION NORMAL';
  let statusColor = '#38bdf8';
  if (value < 1002) { statusText = 'BAJA PRESIÓN'; statusColor = '#f97316'; }
  else if (value < 1009) { statusText = 'LIGERAMENTE BAJA'; statusColor = '#facc15'; }
  else if (value <= 1022) { statusText = 'PRESION NORMAL'; statusColor = '#38bdf8'; }
  else { statusText = 'ALTA PRESIÓN'; statusColor = '#3b82f6'; }

  const trendArrow = trend === 'ascenso' ? '↗' : trend === 'descenso' ? '↘' : '→';
  const trendText = trend === 'ascenso' ? 'Subiendo' : trend === 'descenso' ? 'Bajando' : 'Estable';
  const trendColor = trend === 'ascenso' ? '#34d399' : trend === 'descenso' ? '#f87171' : '#94a3b8';

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 200 145" className="w-full h-auto overflow-visible select-none">
        <defs>
          <filter id="glowSeg" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Arc track line */}
        <path
          d={describeArc(cx, cy, r + 3, -90, 90)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Uniform Discrete Radial Bar Segments */}
        {segments.map((seg) => (
          <line
            key={seg.i}
            x1={seg.posInner.x}
            y1={seg.posInner.y}
            x2={seg.posOuter.x}
            y2={seg.posOuter.y}
            stroke={seg.isActive ? seg.color : '#1e293b'}
            strokeWidth="5"
            strokeLinecap="round"
            filter={seg.isActive ? 'url(#glowSeg)' : undefined}
            opacity={seg.isActive ? 1 : 0.4}
          />
        ))}

        {/* Min & Max Range Labels */}
        <text x={cx - r - 2} y={cy + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b" fontFamily="monospace">
          {min}
        </text>
        <text x={cx + r + 2} y={cy + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b" fontFamily="monospace">
          {max}
        </text>

        {/* Standard 1013 Marker */}
        {(() => {
          const p1013 = (1013 - min) / (max - min);
          const a1013 = -90 + p1013 * 180;
          const pos1013 = polarToCartesian(cx, cy, r + 11, a1013);
          return (
            <text x={pos1013.x} y={pos1013.y + 3} textAnchor="middle" fontSize="8" fontWeight="800" fill="#facc15" fontFamily="monospace">
              1013
            </text>
          );
        })()}

        {/* Needle Line & Glowing Center Pivot */}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />

        {/* Digital Readout */}
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="28" fontWeight="900" fill="#ffffff" fontFamily="monospace">
          {Math.round(value)}
        </text>
        <text x={cx} y={cy + 40} textAnchor="middle" fontSize="11" fontWeight="700" fill="#94a3b8" fontFamily="monospace">
          hPa
        </text>
      </svg>

      {/* Status & Trend Badge below the SVG */}
      <div className="flex items-center gap-2 mt-[-6px] px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold">
        <span style={{ color: statusColor }}>{statusText}</span>
        <span className="text-slate-500">•</span>
        <span className="flex items-center gap-1 font-mono" style={{ color: trendColor }}>
          <span>{trendArrow}</span>
          <span>{trendText}</span>
        </span>
      </div>
    </div>
  );
};

/* ============================================================
   2) Compass rose (used for wind direction)
   ============================================================ */
interface CompassRoseProps {
  degrees: number;
  speedLabel: string;
  color?: string;
}

export const CompassRose: React.FC<CompassRoseProps> = ({ degrees, speedLabel, color = '#22d3ee' }) => {
  const cx = 100, cy = 100, r = 82;
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const tip = polarToCartesian(cx, cy, r - 18, degrees);
  const tail = polarToCartesian(cx, cy, (r - 18) * 0.35, degrees + 180);

  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r - 26} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 3" />
      {ticks.map((t, i) => {
        const isCardinal = t % 90 === 0;
        const p1 = polarToCartesian(cx, cy, r, t);
        const p2 = polarToCartesian(cx, cy, r - (isCardinal ? 10 : 5), t);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isCardinal ? '#64748b' : '#334155'} strokeWidth={isCardinal ? 1.5 : 1} />;
      })}
      <text x={cx} y={cy - r + 20} textAnchor="middle" fontSize="14" fontWeight="900" fill="#cbd5e1" fontFamily="monospace">N</text>
      <text x={cx} y={cy + r - 10} textAnchor="middle" fontSize="14" fontWeight="900" fill="#cbd5e1" fontFamily="monospace">S</text>
      <text x={cx - r + 12} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="900" fill="#cbd5e1" fontFamily="monospace">O</text>
      <text x={cx + r - 12} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="900" fill="#cbd5e1" fontFamily="monospace">E</text>

      {/* direction needle */}
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth="6" strokeLinecap="round" className="transition-all duration-700" />
      <polygon
        points={`${tip.x},${tip.y - 1} ${tip.x - 6},${tip.y + 10} ${tip.x + 6},${tip.y + 10}`}
        fill={color}
        transform={`rotate(${degrees}, ${tip.x}, ${tip.y})`}
      />
      <circle cx={cx} cy={cy} r="6" fill="#0f172a" stroke={color} strokeWidth="2" />

      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="10" fontWeight="900" fill="#e2e8f0" fontFamily="monospace" dy="26">
      </text>
      <text x={cx} y={cy + r + 22} textAnchor="middle" fontSize="20" fontWeight="900" fill="#ffffff" fontFamily="monospace">
        {speedLabel}
      </text>
    </svg>
  );
};

/* ============================================================
   3) UV segmented wheel
   Discrete uniform radial bar segments for distortion-free rendering.
   ============================================================ */
interface UVWheelProps {
  value: number; // 0-11+
}

export const UVWheel: React.FC<UVWheelProps> = ({ value }) => {
  const cx = 100, cy = 82, r = 54;
  const maxScale = 12;
  const clamped = Math.max(0, Math.min(maxScale, value));
  const pointerAngle = -90 + (clamped / maxScale) * 180;

  const totalSegments = 13; // 0 to 12
  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const fraction = i / (totalSegments - 1);
    const angle = -90 + fraction * 180;
    const segVal = i;

    let color = '#10b981';
    let label = 'Bajo';
    if (segVal <= 2) {
      color = '#10b981'; // green
      label = 'Bajo';
    } else if (segVal <= 5) {
      color = '#facc15'; // yellow
      label = 'Moderado';
    } else if (segVal <= 7) {
      color = '#f97316'; // orange
      label = 'Alto';
    } else if (segVal <= 10) {
      color = '#ef4444'; // red
      label = 'Muy Alto';
    } else {
      color = '#a855f7'; // purple
      label = 'Extremo';
    }

    const posInner = polarToCartesian(cx, cy, r - 12, angle);
    const posOuter = polarToCartesian(cx, cy, r, angle);
    const isActive = segVal <= Math.round(clamped);

    return { i, angle, segVal, color, label, posInner, posOuter, isActive };
  });

  const tip = polarToCartesian(cx, cy, r + 2, pointerAngle);

  // Current zone lookup
  const currentVal = Math.round(clamped);
  let zoneColor = '#10b981';
  let zoneLabel = 'BAJO';
  let zoneBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  if (currentVal <= 2) {
    zoneColor = '#10b981';
    zoneLabel = 'BAJO';
    zoneBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';
  } else if (currentVal <= 5) {
    zoneColor = '#facc15';
    zoneLabel = 'MODERADO';
    zoneBg = 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400';
  } else if (currentVal <= 7) {
    zoneColor = '#f97316';
    zoneLabel = 'ALTO';
    zoneBg = 'bg-orange-500/15 border-orange-500/40 text-orange-400';
  } else if (currentVal <= 10) {
    zoneColor = '#ef4444';
    zoneLabel = 'MUY ALTO';
    zoneBg = 'bg-red-500/15 border-red-500/40 text-red-400';
  } else {
    zoneColor = '#a855f7';
    zoneLabel = 'EXTREMO';
    zoneBg = 'bg-purple-500/15 border-purple-500/40 text-purple-400';
  }

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 200 145" className="w-full h-auto overflow-visible select-none">
        <defs>
          <filter id="uvGlowSeg" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Arc track line */}
        <path
          d={describeArc(cx, cy, r + 3, -90, 90)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Uniform Discrete Radial Bar Segments */}
        {segments.map((seg) => (
          <line
            key={seg.i}
            x1={seg.posInner.x}
            y1={seg.posInner.y}
            x2={seg.posOuter.x}
            y2={seg.posOuter.y}
            stroke={seg.isActive ? seg.color : '#1e293b'}
            strokeWidth="5"
            strokeLinecap="round"
            filter={seg.isActive ? 'url(#uvGlowSeg)' : undefined}
            opacity={seg.isActive ? 1 : 0.4}
          />
        ))}

        {/* Min & Max Labels */}
        <text x={cx - r - 2} y={cy + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b" fontFamily="monospace">
          0
        </text>
        <text x={cx + r + 2} y={cy + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b" fontFamily="monospace">
          12+
        </text>

        {/* Needle Line & Center Pivot */}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />

        {/* Digital Value Readout */}
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="28" fontWeight="900" fill={zoneColor} fontFamily="monospace">
          {value}
        </text>
        <text x={cx} y={cy + 40} textAnchor="middle" fontSize="11" fontWeight="700" fill="#94a3b8" fontFamily="monospace">
          Índice UV
        </text>
      </svg>

      {/* Zone Badge below SVG */}
      <div className={`mt-[-6px] px-3 py-1 rounded-full border text-xs font-bold tracking-wider uppercase ${zoneBg}`}>
        {zoneLabel}
      </div>
    </div>
  );
};

/* ============================================================
   5) Realistic moon phase disc (shaded by real illumination %)
   ============================================================ */
interface MoonPhaseDiscProps {
  illuminationPercent: number; // 0-100
  waxing: boolean; // true = growing (luna creciente), false = waning
}

export const MoonPhaseDisc: React.FC<MoonPhaseDiscProps> = ({ illuminationPercent, waxing }) => {
  const r = 46, cx = 50, cy = 50;
  const illum = Math.max(0, Math.min(100, illuminationPercent)) / 100;
  // Terminator curve horizontal offset: 0 = full circle edge (new moon), r = straight line (quarter), 2r = other edge (full moon)
  const k = (illum - 0.5) * 2; // -1..1
  const rx = Math.abs(k) * r;
  const bulgeRight = waxing ? k >= 0 : k < 0;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>
      {/* dark base disc */}
      <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#334155" strokeWidth="1" />
      {/* illuminated portion */}
      <path
        d={
          illum <= 0.001
            ? ''
            : illum >= 0.999
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
            : bulgeRight
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 ${k >= 0 ? 0 : 1} ${cx} ${cy - r} Z`
            : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 ${k >= 0 ? 1 : 0} ${cx} ${cy - r} Z`
        }
        fill="url(#moonGlow)"
      />
      {/* subtle craters for texture */}
      <circle cx={cx - 12} cy={cy - 8} r="4" fill="#94a3b8" opacity="0.25" />
      <circle cx={cx + 8} cy={cy + 14} r="3" fill="#94a3b8" opacity="0.2" />
      <circle cx={cx + 14} cy={cy - 14} r="2.5" fill="#94a3b8" opacity="0.2" />
    </svg>
  );
};
interface DualTempGaugeProps {
  airC: number;
  waterC: number;
  airLabel: string;
  waterLabel: string;
}

export const DualTempGauge: React.FC<DualTempGaugeProps> = ({ airC, waterC, airLabel, waterLabel }) => {
  const scaleMin = 5, scaleMax = 38;
  const clamp = (v: number) => Math.max(scaleMin, Math.min(scaleMax, v));
  const airPct = (clamp(airC) - scaleMin) / (scaleMax - scaleMin);
  const waterPct = (clamp(waterC) - scaleMin) / (scaleMax - scaleMin);

  const barTop = 56, barBottom = 176, barH = barBottom - barTop;

  return (
    <svg viewBox="0 0 200 210" className="w-full h-auto">
      {/* AIRE bar */}
      <text x="55" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fbbf24" fontFamily="monospace">AIRE</text>
      <rect x="35" y={barTop} width="40" height={barH} rx="20" fill="#1e293b" />
      <rect x="35" y={barTop + barH * (1 - airPct)} width="40" height={barH * airPct} rx="20" fill="#fbbf24" />
      <text x="55" y={barBottom + 30} textAnchor="middle" fontSize="24" fontWeight="900" fill="#fde68a" fontFamily="monospace">{airLabel}</text>

      {/* AGUA bar */}
      <text x="145" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill="#22d3ee" fontFamily="monospace">AGUA</text>
      <rect x="125" y={barTop} width="40" height={barH} rx="20" fill="#1e293b" />
      <rect x="125" y={barTop + barH * (1 - waterPct)} width="40" height={barH * waterPct} rx="20" fill="#22d3ee" />
      <text x="145" y={barBottom + 30} textAnchor="middle" fontSize="24" fontWeight="900" fill="#a5f3fc" fontFamily="monospace">{waterLabel}</text>
    </svg>
  );
};
