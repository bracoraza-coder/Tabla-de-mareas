import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check } from 'lucide-react';

interface CookieBannerProps {
  onOpenLegal: (tab: 'cookies' | 'privacidad' | 'aviso-legal' | 'terminos-nauticos') => void;
}

/**
 * Honest, minimal cookie/local-storage notice.
 *
 * This app has NO analytics, NO tracking pixels, NO third-party ad cookies,
 * and NO account/server backend of any kind. The only thing stored is a
 * few preferences in the browser's own localStorage (favorite ports, units,
 * notification settings, and this consent flag) - it never leaves the device.
 * There is deliberately no "analytics" toggle here, because there is
 * nothing to opt in or out of.
 */
export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const [showBanner, useState] = React.useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('mareas_cookie_consent');
    if (!consent) {
      useState(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      'mareas_cookie_consent',
      JSON.stringify({ acknowledged: true, timestamp: new Date().toISOString() })
    );
    useState(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-slate-950/95 backdrop-blur-md border-t-2 border-cyan-500/40 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

        {/* Banner Text & Icon */}
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Esta web no te rastrea
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                RGPD & LSSI-CE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              No usamos analítica, cookies publicitarias ni servidores propios. Solo guardamos en tu propio navegador (localStorage) tus puertos favoritos, unidades náuticas y ajustes de avisos, para que no tengas que configurarlos cada vez. Nada de esto sale de tu dispositivo.
            </p>
            <div className="pt-1 flex items-center gap-3 text-[11px]">
              <button
                onClick={() => onOpenLegal('cookies')}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Política de Cookies
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => onOpenLegal('privacidad')}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Política de Privacidad
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => onOpenLegal('terminos-nauticos')}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Descargo Náutico
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pr-2">
            <Cookie className="w-3.5 h-3.5" />
            <span>Solo almacenamiento esencial en tu navegador</span>
          </div>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Entendido</span>
          </button>
        </div>

      </div>
    </div>
  );
};
