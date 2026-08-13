import React from 'react';
import { MarineWeather, UserUnits } from '../../types';
import { Gauge, Thermometer, Waves, Sun } from 'lucide-react';

interface Gauges3DProps {
  weather: MarineWeather;
  units: UserUnits;
}

export const Gauges3D: React.FC<Gauges3DProps> = ({ weather, units }) => {
  // --- Format helpers ---
  const formatTemp = (valC: number) => {
    if (units.temp === 'F') {
      return `${Math.round((valC * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(valC)}°C`;
  };

  const formatWave = (m: number) => {
    if (units.height === 'ft') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(1)} m`;
  };

  // --- 1. BAROMETER CALCULATIONS ---
  // Scale: 960 hPa (-135°) to 1050 hPa (+135°) -> Span = 270° (3° per hPa)
  const pressure = weather.pressureHpa || 1013;
  const minP = 960;
  const maxP = 1050;
  const clampP = Math.max(minP, Math.min(maxP, pressure));
  const pressureAngle = -135 + (clampP - minP) * 3; // -135° to +135°

  // Numbers to display cleanly on dial face
  const barometerLabels = [
    { val: 960, text: '960' },
    { val: 980, text: '980' },
    { val: 1000, text: '1000' },
    { val: 1020, text: '1020' },
    { val: 1040, text: '1040' },
    { val: 1050, text: '1050' },
  ];

  // --- 2. WAVE HEIGHT CALCULATIONS ---
  const waveH = weather.waveHeightMeters || 1.0;
  const maxWave = 5.0;
  const waveRatio = Math.max(0, Math.min(1, waveH / maxWave));
  const waveAngle = -135 + waveRatio * 270; // -135° to +135°

  // --- 3. UV INDEX CALCULATIONS ---
  const uv = weather.uvIndex ?? 5;
  const maxUV = 12;
  const uvRatio = Math.max(0, Math.min(1, uv / maxUV));
  const uvAngle = -90 + uvRatio * 180; // -90° to +90°

  let uvCategory = 'Bajo';
  let uvBadgeStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-emerald-900/40';
  let uvColor = '#10b981';
  let uvRec = 'Sin riesgo. Disfrute del exterior.';

  if (uv >= 3 && uv <= 5) {
    uvCategory = 'Moderado';
    uvBadgeStyle = 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-amber-900/40';
    uvColor = '#f59e0b';
    uvRec = 'Usar sombrero y crema SPF 30+';
  } else if (uv >= 6 && uv <= 7) {
    uvCategory = 'Alto';
    uvBadgeStyle = 'bg-orange-950/90 border-orange-500 text-orange-300 shadow-orange-900/40';
    uvColor = '#f97316';
    uvRec = 'Sombra recomendada entre 12h y 16h 🧴';
  } else if (uv >= 8 && uv <= 10) {
    uvCategory = 'Muy Alto';
    uvBadgeStyle = 'bg-red-950/90 border-red-500 text-red-300 shadow-red-900/40';
    uvColor = '#ef4444';
    uvRec = 'Evitar sol directo. Usar protección alta ⚠️';
  } else if (uv >= 11) {
    uvCategory = 'Extremo';
    uvBadgeStyle = 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-purple-900/40';
    uvColor = '#a855f7';
    uvRec = 'Riesgo extremo. Evitar salir en horas centrales 🚨';
  }

  // --- 4. THERMOMETER RATIOS ---
  const minT = -10;
  const maxT = 45;
  const airRatio = Math.max(0, Math.min(1, ((weather.temp || 20) - minT) / (maxT - minT)));
  const waterRatio = Math.max(0, Math.min(1, ((weather.waterTemp || 17) - minT) / (maxT - minT)));

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-900/30 border border-amber-400/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
              Instrumental Analógico 3D & Barómetro
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Presión Atmosférica • Oleaje • Temperatura • Índice UV
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          Estado Mar: <span className="text-cyan-300 font-bold">{weather.seaStateName || 'Marejadilla'}</span>
        </div>
      </div>

      {/* Grid of Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

        {/* ================= GAUGE 1: 3D MARITIME BAROMETER ================= */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xl hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between w-full text-xs font-mono border-b border-slate-800 pb-2 z-10">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" /> PRESIÓN (hPa)
            </span>
            <span className="text-amber-400 font-extrabold uppercase text-[11px] bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md">
              {weather.pressureTrend || 'estable'}
            </span>
          </div>

          {/* SVG Barometer Dial Canvas (240x240 for ultra resolution & crisp text) */}
          <div className="relative w-48 h-48 my-2 flex items-center justify-center z-10">
            <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl overflow-visible">
              <defs>
                {/* 3D Metallic Outer Bezel */}
                <radialGradient id="bezelOuter3D" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="40%" stopColor="#334155" />
                  <stop offset="85%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>

                {/* Brass / Gold Inner Ring */}
                <linearGradient id="brassRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                {/* Dial Face Texture */}
                <radialGradient id="dialFaceBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="75%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>

                {/* Needle Gradient */}
                <linearGradient id="needleRed3D" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>

                {/* Glass Glare Overlay */}
                <linearGradient id="glassGlare" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="35%" stopColor="#ffffff" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* 1. Outer 3D Bezel */}
              <circle cx="120" cy="120" r="114" fill="url(#bezelOuter3D)" stroke="#475569" strokeWidth="2" />
              <circle cx="120" cy="120" r="104" fill="url(#brassRing)" opacity="0.85" />
              <circle cx="120" cy="120" r="100" fill="url(#dialFaceBg)" stroke="#1e293b" strokeWidth="2" />

              {/* 2. Color Zones along Dial Rim */}
              {/* Stormy / Low Pressure (<1000 hPa) - Red/Amber */}
              <path
                d="M 59.39,180.61 A 86,86 0 0,1 59.39,59.39"
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                opacity="0.5"
              />
              {/* Normal / Variable (1000 - 1020 hPa) - Cyan/Green */}
              <path
                d="M 59.39,59.39 A 86,86 0 0,1 180.61,59.39"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="4"
                opacity="0.6"
              />
              {/* High / Anticyclone (>1020 hPa) - Amber/Gold */}
              <path
                d="M 180.61,59.39 A 86,86 0 0,1 180.61,180.61"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="4"
                opacity="0.5"
              />

              {/* 3. Tick Marks (Every 2 hPa minor, every 10 hPa major) */}
              {Array.from({ length: 46 }).map((_, i) => {
                const tickVal = 960 + i * 2;
                const deg = -135 + i * 6; // 3° per hPa -> 6° per 2 hPa
                const rad = ((deg - 90) * Math.PI) / 180;

                const isMajor = tickVal % 10 === 0;
                const isStandard = tickVal === 1013;

                const rOuter = 95;
                const rInner = isStandard ? 78 : isMajor ? 82 : 88;

                const x1 = 120 + rOuter * Math.cos(rad);
                const y1 = 120 + rOuter * Math.sin(rad);
                const x2 = 120 + rInner * Math.cos(rad);
                const y2 = 120 + rInner * Math.sin(rad);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isStandard ? '#fbbf24' : isMajor ? '#cbd5e1' : '#475569'}
                    strokeWidth={isStandard ? '2.5' : isMajor ? '2' : '1'}
                  />
                );
              })}

              {/* 4. Numbers Positioned Perfectly without Overlap */}
              {barometerLabels.map((lbl, idx) => {
                const deg = -135 + (lbl.val - 960) * 3;
                const rad = ((deg - 90) * Math.PI) / 180;
                const rText = 68;
                const tx = 120 + rText * Math.cos(rad);
                const ty = 120 + rText * Math.sin(rad);

                return (
                  <text
                    key={idx}
                    x={tx}
                    y={ty + 4}
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {lbl.text}
                  </text>
                );
              })}

              {/* Standard Atmosphere Marker (1013 hPa) */}
              <g transform={`rotate(${ -135 + (1013 - 960) * 3 }, 120, 120)`}>
                <polygon points="120,29 116,36 124,36" fill="#fbbf24" />
              </g>

              {/* Dial Title & Subtext */}
              <text x="120" y="152" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold" letterSpacing="1">
                BARÓMETRO
              </text>

              {/* Digital Box readout inside dial */}
              <rect x="75" y="158" width="90" height="22" rx="6" fill="#020617" stroke="#334155" strokeWidth="1" />
              <text x="120" y="173" fill="#38bdf8" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="900">
                {pressure} hPa
              </text>

              {/* 5. 3D Pointer Needle */}
              <g transform={`rotate(${pressureAngle}, 120, 120)`}>
                {/* Needle drop shadow */}
                <path d="M 116,120 L 120,32 L 124,120 Z" fill="#000000" opacity="0.45" transform="translate(3, 3)" />
                {/* Needle main blade */}
                <path d="M 116,120 L 120,28 L 124,120 Z" fill="url(#needleRed3D)" />
                <line x1="120" y1="28" x2="120" y2="120" stroke="#fef08a" strokeWidth="0.8" opacity="0.9" />
                {/* Tail counterweight */}
                <path d="M 117,120 L 120,140 L 123,120 Z" fill="#991b1b" />
              </g>

              {/* Brass Center Pivot Cap */}
              <circle cx="120" cy="120" r="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="120" cy="120" r="4" fill="#ef4444" />

              {/* Glass Glare */}
              <circle cx="120" cy="120" r="100" fill="url(#glassGlare)" pointerEvents="none" />
            </svg>
          </div>

          <div className="w-full text-center z-10 bg-slate-950/90 border border-slate-800 py-1.5 px-2 rounded-xl">
            <div className="text-[11px] text-slate-300 font-mono font-semibold">
              {pressure >= 1020
                ? '☀️ Anticiclón (Tiempo Muy Estable)'
                : pressure >= 1010
                ? '🌤️ Presión Normal (Tiempo Apacible)'
                : '🌧️ Borrasca (Tiempo Inestable / Lluvia)'}
            </div>
          </div>
        </div>

        {/* ================= GAUGE 2: DUAL GLASS THERMOMETER ================= */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between w-full text-xs font-mono border-b border-slate-800 pb-2 z-10">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-red-400" /> TEMPERATURA
            </span>
            <span className="text-cyan-400 font-extrabold text-[11px]">Aire / Agua</span>
          </div>

          <div className="flex items-center justify-around w-full my-3 z-10 px-2">
            {/* Air Thermometer */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-mono font-bold text-red-400">Aire</span>
              <div className="relative w-7 h-36 bg-slate-950 border-2 border-slate-700 rounded-full p-0.5 shadow-inner flex flex-col justify-end items-center overflow-hidden">
                <div
                  className="w-full rounded-b-full bg-gradient-to-t from-red-700 via-red-500 to-amber-400 shadow-lg transition-all duration-700"
                  style={{ height: `${Math.max(10, airRatio * 100)}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/5 pointer-events-none rounded-full" />
              </div>
              <span className="text-sm font-black font-mono text-white mt-1">
                {formatTemp(weather.temp || 20)}
              </span>
            </div>

            <div className="h-36 w-[1px] bg-slate-800" />

            {/* Water Thermometer */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-mono font-bold text-cyan-400">Agua</span>
              <div className="relative w-7 h-36 bg-slate-950 border-2 border-slate-700 rounded-full p-0.5 shadow-inner flex flex-col justify-end items-center overflow-hidden">
                <div
                  className="w-full rounded-b-full bg-gradient-to-t from-blue-700 via-cyan-500 to-teal-300 shadow-lg transition-all duration-700"
                  style={{ height: `${Math.max(10, waterRatio * 100)}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/5 pointer-events-none rounded-full" />
              </div>
              <span className="text-sm font-black font-mono text-white mt-1">
                {formatTemp(weather.waterTemp || 17)}
              </span>
            </div>
          </div>

          <div className="w-full text-center z-10 bg-slate-950/90 border border-slate-800 py-1.5 rounded-xl">
            <div className="text-[11px] font-mono text-slate-300">
              Sensación Térmica: <span className="font-bold text-white">{formatTemp(weather.feelsLike || weather.temp || 20)}</span>
            </div>
          </div>
        </div>

        {/* ================= GAUGE 3: WAVE HEIGHT SEMICIRCULAR GAUGE ================= */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xl hover:border-slate-700 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between w-full text-xs font-mono border-b border-slate-800 pb-2 z-10">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" /> ALTURA DE OLA
            </span>
            <span className="text-cyan-300 font-bold text-[11px]">{weather.wavePeriodSeconds || 8}s período</span>
          </div>

          <div className="relative w-48 h-32 my-1 flex items-center justify-center z-10">
            <svg viewBox="0 0 200 130" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 25,105 A 75,75 0 0,1 175,105"
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Active Wave Arc */}
              <path
                d="M 25,105 A 75,75 0 0,1 175,105"
                fill="none"
                stroke="url(#waveGradArc)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="235"
                strokeDashoffset={235 * (1 - waveRatio)}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="waveGradArc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Ticks & Numbers */}
              {[0, 1, 2, 3, 4, 5].map((val) => {
                const ratio = val / 5;
                const angDeg = -135 + ratio * 270;
                const angRad = ((angDeg - 90) * Math.PI) / 180;
                const rx = 100 + 58 * Math.cos(angRad);
                const ry = 105 + 58 * Math.sin(angRad);

                return (
                  <text
                    key={val}
                    x={rx}
                    y={ry + 4}
                    fill="#cbd5e1"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {val}m
                  </text>
                );
              })}

              {/* Pointer Needle */}
              <g transform={`rotate(${waveAngle}, 100, 105)`}>
                <line x1="100" y1="105" x2="100" y2="38" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="100" cy="105" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              </g>

              {/* Value Text */}
              <text x="100" y="88" fill="#ffffff" fontSize="20" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                {formatWave(waveH)}
              </text>
              <text x="100" y="118" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {weather.seaStateName || 'Marejadilla'}
              </text>
            </svg>
          </div>

          <div className="w-full text-center z-10 bg-slate-950/90 border border-slate-800 py-1.5 rounded-xl">
            <div className="text-[11px] font-mono text-slate-300">
              Escala Beaufort: <span className="font-bold text-amber-400">Grado {weather.beaufortScale || 3}</span> ({weather.beaufortDescription || 'Brisa'})
            </div>
          </div>
        </div>

        {/* ================= GAUGE 4: ÍNDICE UV (Semicircular Ultra-Crisp Gauge) ================= */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xl hover:border-slate-700 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between w-full text-xs font-mono border-b border-slate-800 pb-2 z-10">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" /> ÍNDICE UV
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-black tracking-wider uppercase shadow-md ${uvBadgeStyle}`}>
              {uvCategory}
            </span>
          </div>

          {/* Semicircular SVG Meter */}
          <div className="relative w-48 h-32 my-1 flex items-center justify-center z-10">
            <svg viewBox="0 0 200 130" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 20,105 A 80,80 0 0,1 180,105"
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Colored UV Arc */}
              <path
                d="M 20,105 A 80,80 0 0,1 180,105"
                fill="none"
                stroke="url(#uvArcGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={251 * (1 - uvRatio)}
                className="transition-all duration-700"
              />

              <defs>
                <linearGradient id="uvArcGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />   {/* Bajo (0-2) */}
                  <stop offset="30%" stopColor="#f59e0b" />  {/* Moderado (3-5) */}
                  <stop offset="60%" stopColor="#f97316" />  {/* Alto (6-7) */}
                  <stop offset="85%" stopColor="#ef4444" />  {/* Muy Alto (8-10) */}
                  <stop offset="100%" stopColor="#a855f7" /> {/* Extremo (11+) */}
                </linearGradient>
              </defs>

              {/* Tick numbers: 0, 3, 6, 9, 12 */}
              {[0, 3, 6, 9, 12].map((num) => {
                const ratio = num / 12;
                const angDeg = -180 + ratio * 180;
                const angRad = (angDeg * Math.PI) / 180;
                const rx = 100 + 60 * Math.cos(angRad);
                const ry = 105 + 60 * Math.sin(angRad);

                return (
                  <text
                    key={num}
                    x={rx}
                    y={ry + 4}
                    fill="#cbd5e1"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {num}
                  </text>
                );
              })}

              {/* Pointer Needle */}
              <g transform={`rotate(${uvAngle}, 100, 105)`}>
                <line x1="100" y1="105" x2="100" y2="36" stroke={uvColor} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="100" cy="105" r="7" fill="#0f172a" stroke={uvColor} strokeWidth="2.5" />
              </g>

              {/* Center UV Value Number */}
              <text x="100" y="85" fill={uvColor} fontSize="28" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                {uv}
              </text>
              <text x="100" y="118" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                ÍNDICE UV MÁXIMO
              </text>
            </svg>
          </div>

          <div className="w-full text-center z-10 bg-slate-950/90 border border-slate-800 py-1.5 px-2 rounded-xl">
            <div className="text-[11px] font-mono text-slate-300 font-medium truncate">
              {uvRec}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Gauges3D;
