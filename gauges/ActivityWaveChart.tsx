import React from 'react';
import { SolunarPeriod } from '../../types';

interface ActivityWaveChartProps {
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
}

function timeToX(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return ((h + m / 60) / 24) * 640 + 40;
}

const QUALITY_COLOR: Record<string, string> = {
  excelente: '#ef4444',
  alta: '#f97316',
  media: '#22c55e',
};
const QUALITY_LABEL: Record<string, string> = {
  excelente: 'muy alta',
  alta: 'alta',
  media: 'media',
};

export const ActivityWaveChart: React.FC<ActivityWaveChartProps> = ({ majorPeriods, minorPeriods }) => {
  const allPeriods = [...majorPeriods.map(p => ({ ...p, major: true })), ...minorPeriods.map(p => ({ ...p, major: false }))]
    .sort((a, b) => timeToX(a.start) - timeToX(b.start));

  // Build a smooth wave that rises near each period and dips between them
  const baseY = 150;
  const points: { x: number; y: number }[] = [];
  for (let h = 0; h <= 24; h += 0.5) {
    const x = (h / 24) * 640 + 40;
    let y = baseY;
    allPeriods.forEach(p => {
      const px = timeToX(p.start);
      const dist = Math.abs(x - px);
      const amp = p.major ? 70 : 40;
      const width = 90;
      if (dist < width) {
        y -= amp * Math.cos((dist / width) * (Math.PI / 2));
      }
    });
    points.push({ x, y });
  }
  const pathD = 'M' + points.map(p => `${p.x},${p.y}`).join(' L');
  const areaD = pathD + ` L${points[points.length - 1].x},210 L${points[0].x},210 Z`;

  return (
    <svg viewBox="0 0 720 230" className="w-full h-auto">
      <defs>
        <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <path d={areaD} fill="url(#activityFill)" />
      <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

      {/* hour axis */}
      {[0, 4, 8, 12, 16, 20, 24].map(h => (
        <text key={h} x={(h / 24) * 640 + 40} y="222" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">
          {String(h).padStart(2, '0')}h
        </text>
      ))}

      {/* pins for each period */}
      {allPeriods.map((p, i) => {
        const x = timeToX(p.start);
        const y = baseY - (p.major ? 70 : 40) - 4;
        const color = QUALITY_COLOR[p.quality] || '#22c55e';
        return (
          <g key={i}>
            <circle cx={x} cy={baseY - (p.major ? 70 : 40)} r={p.major ? 6 : 4} fill={color} stroke="#0f172a" strokeWidth="1.5" />
            <g transform={`translate(${x}, ${y - 16})`}>
              <rect x={-26} y={-14} width="52" height="30" rx="8" fill={color} opacity="0.95" />
              <text x="0" y="-2" textAnchor="middle" fontSize="10" fontWeight="900" fill="#0f172a" fontFamily="monospace">{p.start}</text>
              <text x="0" y="10" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a" fontFamily="monospace">{QUALITY_LABEL[p.quality]}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
