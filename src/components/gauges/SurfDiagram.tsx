import React from 'react';
import happySurferImg from '../../assets/images/surfer_happy_riding_1785786807604.webp';
import sadSurferImg from '../../assets/images/surfer_sad_flat_1785786819703.webp';
import neutralSurferImg from '../../assets/images/surfer_neutral_waiting_1785786830667.webp';

interface SurfDiagramProps {
  rating: number; // 0 to 100
  canSurf?: boolean;
}

export const SurfDiagram: React.FC<SurfDiagramProps> = ({ rating, canSurf }) => {
  const isHappy = canSurf ?? rating >= 55;
  const isNeutral = !isHappy && rating >= 30;

  // Select image & status configuration based on rating
  let imageSrc = sadSurferImg;
  let statusText = 'Sin Olas (Mar Calmo)';
  let subText = 'El surfista está triste esperando oleaje...';
  let badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  let progressGradient = 'from-rose-500 to-red-600';

  if (isHappy) {
    imageSrc = happySurferImg;
    statusText = '¡Olas Épicas! A Surfear';
    subText = '¡El surfista está disfrutando olas perfectas!';
    badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    progressGradient = 'from-emerald-500 to-teal-400';
  } else if (isNeutral) {
    imageSrc = neutralSurferImg;
    statusText = 'Olas Bajas / Esperando Serie';
    subText = 'Surfista en espera de mejor mar de fondo...';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    progressGradient = 'from-amber-500 to-yellow-400';
  }

  return (
    <div className="w-full flex flex-col items-center group">
      {/* High-Quality Image Container */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={statusText}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Subtle Gradient Overlay for visual quality & contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

        {/* Status Badge Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-md font-black text-xs sm:text-sm tracking-wide shadow-lg ${badgeBg}`}>
            {statusText}
          </div>
          <div className="bg-slate-950/80 border border-slate-700 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-white shadow-md">
            {rating}/100
          </div>
        </div>
      </div>

      {/* Subtext description */}
      <p className="text-xs text-slate-400 font-medium text-center mt-2.5 leading-relaxed">
        {subText}
      </p>

      {/* Score Progress Bar */}
      <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-2.5 mt-3 overflow-hidden p-0.5">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${progressGradient} transition-all duration-700 shadow-sm`}
          style={{ width: `${Math.max(5, Math.min(100, rating))}%` }}
        />
      </div>
    </div>
  );
};

