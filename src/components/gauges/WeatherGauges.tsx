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
   180deg sweep (from -90 to +90), coloured zones, needle.
   ============================================================ */
interface PressureGaugeProps {
  value: number; // hPa
  min?: number;
  max?: number;
  trend: 'ascenso' | 'descenso' | 'estable';
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({ value, min = 990, max = 1040, trend }) => {
  const cx = 100, cy = 92, r = 74;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / (max - min);
  const needleAngle = -90 + pct * 180;

  const zones = [
    { from: 0, to: 0.22, color: '#f97316' },   // low pressure - orange
    { from: 0.22, to: 0.42, color: '#facc15' }, // yellow
    { from: 0.42, to: 0.66, color: '#38bdf8' }, // sky blue
    { from: 0.66, to: 1, color: '#3b82f6' },    // high pressure - blue
  ];

  const tip = polarToCartesian(cx, cy, r - 14, needleAngle);
  const trendColor = trend === 'ascenso' ? '#34d399' : trend === 'descenso' ? '#f87171' : '#94a3b8';
  const trendArrow = trend === 'ascenso' ? '↗' : trend === 'descenso' ? '↘' : '→';

  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <defs>
        <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {zones.map((z, i) => (
        <path
          key={i}
          d={describeArc(cx, cy, r, -90 + z.from * 180, -90 + z.to * 180)}
          fill="none"
          stroke={z.color}
          strokeWidth="22"
          strokeLinecap="butt"
          opacity="1"
          filter="url(#gaugeGlow)"
        />
      ))}
      {/* tick labels */}
      <text x={cx - r - 4} y={cy + 6} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#94a3b8" fontFamily="monospace">{min}</text>
      <text x={cx + r + 4} y={cy + 6} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#94a3b8" fontFamily="monospace">{max}</text>

      {/* needle */}
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#e2e8f0" />

      <text x={cx} y={cy + 30} textAnchor="middle" fontSize="32" fontWeight="900" fill="#ffffff" fontFamily="monospace">
        {Math.round(value)}
      </text>
      <text x={cx} y={cy + 44} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#cbd5e1" fontFamily="monospace">hPa</text>
      <text x={cx} y={cy + 58} textAnchor="middle" fontSize="13" fontWeight="bold" fill={trendColor} fontFamily="monospace">
        {trendArrow} {trend}
      </text>
    </svg>
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
   ============================================================ */
interface UVWheelProps {
  value: number; // 0-11+
}

export const UVWheel: React.FC<UVWheelProps> = ({ value }) => {
  const cx = 100, cy = 100, r = 78;
  const maxScale = 12;
  const clamped = Math.max(0, Math.min(maxScale, value));

  const zones = [
    { from: 0, to: 2, color: '#4ade80', label: 'bajo' },
    { from: 2, to: 5, color: '#facc15', label: 'moderado' },
    { from: 5, to: 7, color: '#fb923c', label: 'alto' },
    { from: 7, to: 10, color: '#ef4444', label: 'muy alto' },
    { from: 10, to: 12, color: '#a78bfa', label: 'extremo' },
  ];

  const sweep = 300; // degrees of the dial (like a speedometer, not full circle)
  const startAngle = -150;
  const toAngle = (v: number) => startAngle + (v / maxScale) * sweep;
  const pointerAngle = toAngle(clamped);
  const pTip = polarToCartesian(cx, cy, r - 16, pointerAngle);

  const currentZone = zones.find(z => value >= z.from && value < z.to) || zones[zones.length - 1];

  return (
    <svg viewBox="0 0 200 190" className="w-full h-auto">
      <defs>
        <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {zones.map((z, i) => (
        <path
          key={i}
          d={describeArc(cx, cy, r, toAngle(z.from), toAngle(z.to))}
          fill="none"
          stroke={z.color}
          strokeWidth="20"
          opacity="1"
          filter="url(#gaugeGlow)"
        />
      ))}
      <line x1={cx} y1={cy} x2={pTip.x} y2={pTip.y} stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#e2e8f0" />

      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="38" fontWeight="900" fill="#ffffff" fontFamily="monospace">
        {value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#cbd5e1" fontFamily="monospace">índice UV</text>
      <text x={cx} y={cy + 34} textAnchor="middle" fontSize="14" fontWeight="bold" fill={currentZone.color} fontFamily="monospace" textTransform="uppercase">
        {currentZone.label.toUpperCase()}
      </text>
    </svg>
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
