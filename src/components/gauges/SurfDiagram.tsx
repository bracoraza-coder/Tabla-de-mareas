import React from 'react';

interface SurfDiagramProps {
  canSurf: boolean; // true = good conditions, ride the wave happily
  score: number; // 0-10, used for a mid-state
}

export const SurfDiagram: React.FC<SurfDiagramProps> = ({ canSurf, score }) => {
  const mid = !canSurf && score >= 2.5; // "meh, maybe later" state

  return (
    <svg viewBox="0 0 300 220" preserveAspectRatio="xMidYMid meet" className="w-full h-full block">
      <defs>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <linearGradient id="surfSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={canSurf ? '#0ea5e9' : '#334155'} />
          <stop offset="100%" stopColor={canSurf ? '#082f49' : '#0f172a'} />
        </linearGradient>
        <linearGradient id="surfSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={canSurf ? '#22d3ee' : '#1e40af'} />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="300" height="220" rx="16" fill="url(#surfSky)" />

      {/* sun */}
      <circle cx="250" cy="45" r="18" fill={canSurf ? '#fde047' : '#64748b'} opacity={canSurf ? 1 : 0.4} />

      {canSurf ? (
        <>
          {/* big rideable wave */}
          <path d="M0,150 Q60,90 130,130 T300,120 V220 H0 Z" fill="url(#surfSea)" />
          <path d="M0,150 Q60,90 130,130 T300,120" fill="none" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round" />
          {/* foam */}
          <circle cx="90" cy="118" r="4" fill="#f0f9ff" opacity="0.9" />
          <circle cx="105" cy="112" r="3" fill="#f0f9ff" opacity="0.8" />
          <circle cx="200" cy="105" r="4" fill="#f0f9ff" opacity="0.9" />

          {/* Happy surfer riding, arms up */}
          <g transform="translate(150,95) rotate(-12)" filter="url(#softShadow)" strokeLinejoin="round">
            {/* board */}
            <ellipse cx="0" cy="34" rx="34" ry="7" fill="#f97316" stroke="#7c2d12" strokeWidth="1.5" />
            {/* legs */}
            <line x1="-8" y1="10" x2="-14" y2="30" stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" />
            <line x1="8" y1="10" x2="14" y2="30" stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" />
            {/* body */}
            <line x1="0" y1="-14" x2="0" y2="12" stroke="#0ea5e9" strokeWidth="9" strokeLinecap="round" />
            {/* arms up celebrating */}
            <line x1="0" y1="-8" x2="-22" y2="-24" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
            <line x1="0" y1="-8" x2="22" y2="-24" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
            {/* head + smile */}
            <circle cx="0" cy="-24" r="10" fill="#fcd34d" />
            <path d="M-4,-22 Q0,-17 4,-22" stroke="#7c2d12" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="-3.5" cy="-26" r="1.2" fill="#7c2d12" />
            <circle cx="3.5" cy="-26" r="1.2" fill="#7c2d12" />
          </g>

          <text x="150" y="200" textAnchor="middle" fontSize="15" fontWeight="900" fill="#bbf7d0" fontFamily="sans-serif">
            ¡A por la ola! 🤙
          </text>
        </>
      ) : mid ? (
        <>
          {/* small flat-ish wave */}
          <path d="M0,175 Q75,160 150,172 T300,168 V220 H0 Z" fill="url(#surfSea)" opacity="0.7" />
          <path d="M0,175 Q75,160 150,172 T300,168" fill="none" stroke="#e2e8f0" strokeWidth="3" opacity="0.7" />

          {/* Surfer sitting on the board, waiting, neutral */}
          <g transform="translate(150,150)" filter="url(#softShadow)">
            <ellipse cx="0" cy="18" rx="36" ry="7" fill="#f97316" stroke="#7c2d12" strokeWidth="1.5" />
            <path d="M-16,10 Q0,26 16,10" stroke="#fcd34d" strokeWidth="7" fill="none" strokeLinecap="round" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#0ea5e9" strokeWidth="9" strokeLinecap="round" />
            <line x1="0" y1="-4" x2="-16" y2="6" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
            <line x1="0" y1="-4" x2="16" y2="6" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
            <circle cx="0" cy="-20" r="10" fill="#fcd34d" />
            <line x1="-4" y1="-19" x2="4" y2="-19" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="-3.5" cy="-22" r="1.2" fill="#7c2d12" />
            <circle cx="3.5" cy="-22" r="1.2" fill="#7c2d12" />
          </g>
          <text x="150" y="200" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fde68a" fontFamily="sans-serif">
            Esperando que mejore el mar de fondo…
          </text>
        </>
      ) : (
        <>
          {/* flat sea */}
          <path d="M0,180 L300,180 V220 H0 Z" fill="url(#surfSea)" opacity="0.5" />
          <line x1="0" y1="180" x2="300" y2="180" stroke="#94a3b8" strokeWidth="2" opacity="0.6" />

          {/* Sad surfer sitting on sand, board stuck upright, head down */}
          <g transform="translate(150,150)" filter="url(#softShadow)">
            {/* board stuck in sand */}
            <ellipse cx="30" cy="-10" rx="8" ry="26" fill="#64748b" stroke="#334155" strokeWidth="1.5" transform="rotate(8, 30, -10)" />
            {/* body slumped */}
            <ellipse cx="-10" cy="10" rx="16" ry="10" fill="#0ea5e9" opacity="0.85" />
            {/* legs out */}
            <line x1="-10" y1="16" x2="10" y2="20" stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" />
            {/* arms hugging knees */}
            <line x1="-14" y1="6" x2="4" y2="16" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
            {/* head down */}
            <circle cx="-16" cy="-4" r="9" fill="#fcd34d" />
          </g>
          <text x="150" y="200" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fca5a5" fontFamily="sans-serif">
            Hoy no hay olas… 😔
          </text>
        </>
      )}
    </svg>
  );
};
