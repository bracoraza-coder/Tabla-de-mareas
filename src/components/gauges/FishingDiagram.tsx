import React from 'react';

interface FishingDiagramProps {
  activityScore: number; // 1-5
  label: string;
}

const FishIcon: React.FC<{ x: number; y: number; scale: number; color: string; flip?: boolean }> = ({ x, y, scale, color, flip }) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale}, ${scale})`}>
    <ellipse cx="0" cy="0" rx="14" ry="7" fill={color} />
    <path d="M-13,0 L-22,-8 L-22,8 Z" fill={color} />
    <circle cx="7" cy="-1.5" r="1.6" fill="#0f172a" />
    <path d="M-2,-6 Q3,-10 8,-7" stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
  </g>
);

export const FishingDiagram: React.FC<FishingDiagramProps> = ({ activityScore, label }) => {
  const totalSlots = 5;
  const filled = Math.max(0, Math.min(5, Math.round(activityScore)));
  const colors = ['#475569', '#0ea5e9', '#22d3ee', '#fbbf24', '#f97316'];
  const rating = filled <= 1 ? 0 : filled <= 2 ? 1 : filled <= 3 ? 2 : filled <= 4 ? 3 : 4;

  return (
    <svg viewBox="0 0 300 220" className="w-full h-full">
      <defs>
        <linearGradient id="fishWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="300" height="220" rx="16" fill="url(#fishWater)" />

      {/* bubbles */}
      {[...Array(6)].map((_, i) => (
        <circle key={i} cx={20 + i * 48} cy={200 - (i % 3) * 14} r={2 + (i % 3)} fill="#7dd3fc" opacity="0.4" />
      ))}

      {/* fishing line + hook from top */}
      <line x1="150" y1="0" x2="150" y2="70" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
      <path d="M150,70 q10,10 0,18" stroke="#e2e8f0" strokeWidth="2" fill="none" />

      {/* School of fish - count reflects activity */}
      {Array.from({ length: totalSlots }).map((_, i) => {
        const active = i < filled;
        const angle = (i / totalSlots) * Math.PI * 2;
        const cx = 150 + Math.cos(angle) * 55;
        const cy = 130 + Math.sin(angle) * 38;
        return (
          <FishIcon
            key={i}
            x={cx}
            y={cy}
            scale={active ? 1.1 : 0.65}
            color={active ? colors[rating + 1] || '#f97316' : '#334155'}
            flip={i % 2 === 0}
          />
        );
      })}

      {/* Fish-o-meter bar */}
      <g transform="translate(50, 185)">
        {Array.from({ length: 5 }).map((_, i) => (
          <rect
            key={i}
            x={i * 42}
            y={0}
            width="34"
            height="10"
            rx="3"
            fill={i < filled ? colors[Math.min(i, 4)] : '#1e293b'}
          />
        ))}
      </g>

      <text x="150" y="30" textAnchor="middle" fontSize="16" fontWeight="900" fill="#e0f2fe" fontFamily="sans-serif">
        Actividad de pesca: {label}
      </text>
    </svg>
  );
};
