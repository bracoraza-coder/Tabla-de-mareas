import React from 'react';

interface TideFishChart3DProps {
  tideData?: Array<{ time: string; height: number; type?: 'pleamar' | 'bajamar' }>;
  sunrise?: string;
  sunset?: string;
  solunarActivity?: Array<{ hour: number; level: 'baja' | 'media' | 'alta' | 'muy_alta' }>;
}

// Icono vectorial de pez realista
const FishIcon = ({ className = "w-4 h-4 fill-cyan-700 opacity-80" }: { className?: string }) => (
  <svg viewBox="0 0 24 14" className={className}>
    <path d="M22.5 7C19.5 2.5 14 0 8 0 5 0 2.5 1 0 3l3.5 4L0 11c2.5 2 5 3 8 3 6 0 11.5-2.5 14.5-7zM7 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
  </svg>
);

export const TideFishChart3D: React.FC<TideFishChart3DProps> = ({
  sunrise = "07:34",
  sunset = "21:37",
  solunarActivity = [
    { hour: 4, level: 'alta' },
    { hour: 11, level: 'baja' },
    { hour: 17, level: 'muy_alta' },
    { hour: 22, level: 'media' }
  ]
}) => {
  const svgWidth = 800;
  const svgHeight = 350;
  const paddingLeft = 60;
  const paddingRight = 180;
  const paddingTop = 40;
  const paddingBottom = 60;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const renderFishGroup = (hour: number, level: string) => {
    const x = paddingLeft + (hour / 24) * chartWidth;
    const y = paddingTop + chartHeight - 15;
    const count = level === 'muy_alta' ? 5 : level === 'alta' ? 3 : level === 'media' ? 2 : 1;

    return (
      <g key={`fish-group-${hour}`} transform={`translate(${x}, ${y})`}>
        {Array.from({ length: count }).map((_, i) => (
          <g key={i} transform={`translate(${(i % 3) * 10 - 10}, ${Math.floor(i / 3) * -8}) scale(0.8)`}>
            <FishIcon className={level === 'muy_alta' || level === 'alta' ? "w-4 h-3 fill-cyan-600 drop-shadow" : "w-3 h-2 fill-slate-400"} />
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className="w-full bg-slate-100 p-4 rounded-xl shadow-inner border border-slate-300 my-4">
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="font-bold text-slate-700 text-sm tracking-wider uppercase">
          Evolución de Mareas y Actividad Solunar (Vista 3D)
        </h3>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[650px] font-sans">
          <defs>
            <linearGradient id="daylight3D" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="night3D" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Paredes 3D */}
          <polygon points={`${paddingLeft},${paddingTop} ${paddingLeft - 15},${paddingTop - 15} ${paddingLeft - 15},${paddingTop + chartHeight - 15} ${paddingLeft},${paddingTop + chartHeight}`} fill="#cbd5e1" />
          <polygon points={`${paddingLeft},${paddingTop + chartHeight} ${paddingLeft - 15},${paddingTop + chartHeight - 15} ${paddingLeft + chartWidth - 15},${paddingTop + chartHeight - 15} ${paddingLeft + chartWidth},${paddingTop + chartHeight}`} fill="#94a3b8" />

          {/* Bloques de día / noche */}
          <rect x={paddingLeft} y={paddingTop} width={chartWidth * (7.5 / 24)} height={chartHeight} fill="url(#night3D)" />
          <rect x={paddingLeft + chartWidth * (7.5 / 24)} y={paddingTop} width={chartWidth * (14 / 24)} height={chartHeight} fill="url(#daylight3D)" />
          <rect x={paddingLeft + chartWidth * (21.5 / 24)} y={paddingTop} width={chartWidth * (2.5 / 24)} height={chartHeight} fill="url(#night3D)" />

          {/* Horas */}
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((hour) => {
            const x = paddingLeft + (hour / 24) * chartWidth;
            return (
              <g key={`grid-${hour}`}>
                <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke="#94a3b8" strokeDasharray="2,2" strokeOpacity="0.4" />
                <text x={x} y={paddingTop + chartHeight + 18} fontSize="11" fill="#475569" textAnchor="middle" fontWeight="bold">
                  {hour}h
                </text>
              </g>
            );
          })}

          {/* Grupos de peces */}
          {solunarActivity.map((act) => renderFishGroup(act.hour, act.level))}

          {/* Curva de Marea */}
          <path
            d={`M ${paddingLeft} ${paddingTop + chartHeight * 0.6} 
               Q ${paddingLeft + chartWidth * 0.25} ${paddingTop + chartHeight * 0.15}, ${paddingLeft + chartWidth * 0.48} ${paddingTop + chartHeight * 0.8}
               T ${paddingLeft + chartWidth * 0.75} ${paddingTop + chartHeight * 0.2}
               T ${paddingLeft + chartWidth} ${paddingTop + chartHeight * 0.7}`}
            fill="none"
            stroke="#0284c7"
            strokeWidth="3.5"
          />

          {/* Marcas de Pleamar / Bajamar */}
          <g transform={`translate(${paddingLeft + chartWidth * 0.24}, ${paddingTop + chartHeight * 0.15})`}>
            <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <rect x="-24" y="-28" width="48" height="18" rx="9" fill="#0284c7" />
            <text x="0" y="-16" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">05:42 h</text>
          </g>
          <g transform={`translate(${paddingLeft + chartWidth * 0.48}, ${paddingTop + chartHeight * 0.8})`}>
            <circle r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
            <rect x="-24" y="10" width="48" height="18" rx="9" fill="#dc2626" />
            <text x="0" y="22" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">11:39 h</text>
          </g>

          {/* Leyenda lateral */}
          <g transform={`translate(${svgWidth - 150}, ${paddingTop + 10})`}>
            <text fontSize="11" fontWeight="bold" fill="#334155" x="0" y="0">MAREAS</text>
            <circle cx="8" cy="15" r="4" fill="#0284c7" />
            <text fontSize="11" fill="#475569" x="20" y="18">pleamar</text>
            <circle cx="8" cy="32" r="4" fill="#dc2626" />
            <text fontSize="11" fill="#475569" x="20" y="35">bajamar</text>

            <text fontSize="11" fontWeight="bold" fill="#334155" x="0" y="65">SOL</text>
            <text fontSize="10" fill="#0284c7" x="20" y="80">salida {sunrise}</text>
            <text fontSize="10" fill="#0284c7" x="20" y="98">puesta {sunset}</text>

            <text fontSize="11" fontWeight="bold" fill="#334155" x="0" y="130">ACTIVIDAD</text>
            <g transform="translate(0, 140)">
              <FishIcon className="w-4 h-3 fill-cyan-600 inline" />
              <text fontSize="10" fill="#475569" x="20" y="10">muy alta / alta</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};