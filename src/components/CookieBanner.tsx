import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Settings, Check, X } from 'lucide-react';

interface CookieBannerProps {
  onOpenLegal: (tab: 'cookies' | 'privacidad' | 'aviso-legal' | 'terminos-nauticos') => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [prefsEnabled, setPrefsEnabled] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('mareas_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      essential: true,
      analytics: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('mareas_cookie_consent', JSON.stringify(consentData));
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    const consentData = {
      essential: true,
      analytics: false,
      preferences: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('mareas_cookie_consent', JSON.stringify(consentData));
    setShowBanner(false);
  };

  const handleSaveConfig = () => {
    const consentData = {
      essential: true,
      analytics: analyticsEnabled,
      preferences: prefsEnabled,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('mareas_cookie_consent', JSON.stringify(consentData));
    setShowBanner(false);
    setShowConfig(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-slate-950/95 backdrop-blur-md border-t-2 border-cyan-500/40 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Banner Text & Icon */}
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
            <Cookie className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Aviso de Privacidad y Uso de Cookies
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                RGPD & LSSI-CE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Utilizamos cookies esenciales y almacenamiento local para recordar sus puertos favoritos, unidades náuticas (metros/pies, nudos/km/h) y geolocalización marítima. No vendemos datos ni empleamos cookies de terceros con fines publicitarios.
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>{showConfig ? 'Ocultar ajustes' : 'Configurar'}</span>
          </button>

          <button
            onClick={handleAcceptEssential}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
          >
            Solo esenciales
          </button>

          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aceptar todas</span>
          </button>
        </div>

      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cookies Esenciales</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Requeridas para la navegación, mapa de puertos y sesión básica.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-1 rounded border border-emerald-800 font-bold shrink-0">
              SIEMPRE ACTIVAS
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Preferencias de Usuario</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Guarda unidades (m/ft, nudos), favoritos y configuración de avisos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefsEnabled}
              onChange={(e) => setPrefsEnabled(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Métricas y Telemetría</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rendimiento de consultas Open-Meteo y estabilidad de la app.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-1">
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              Guardar mis preferencias
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
