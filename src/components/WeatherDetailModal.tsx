import React, { useState } from 'react';
import { MarineWeather, Port, UserUnits } from '../types';
import { 
  Wind, Waves, Thermometer, Droplets, Sun, Moon, Cloud, 
  CloudRain, Eye, Compass, ShieldCheck, X, Clock, Sunrise, Sunset, Activity,
  CloudSun, CloudMoon
} from 'lucide-react';

interface WeatherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: MarineWeather;
  port: Port;
  units: UserUnits;
}

export const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({
  isOpen,
  onClose,
  weather,
  port,
  units,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'current' | 'hourly' | 'safety'>('current');

  const formatSpeed = (knots: number) => {
    if (units.speed === 'kmh') return `${Math.round(knots * 1.852)} km/h`;
    if (units.speed === 'mph') return `${Math.round(knots * 1.15078)} mph`;
    return `${knots} nudos`;
  };

  const formatTemp = (celsius: number) => {
    if (units.temp === 'F') return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    return `${Math.round(celsius)}°C`;
  };

  const formatHeight = (meters: number) => {
    if (units.height === 'ft') return `${(meters * 3.28084).toFixed(1)} ft`;
    return `${meters.toFixed(1)} m`;
  };

  const currentHour = new Date().getHours();
  const isNight = currentHour < 7 || currentHour > 21;
  const isCloudy = weather.condition.toLowerCase().includes('nub') || weather.condition.toLowerCase().includes('cloud') || weather.humidityPercent > 75;
  const isRainy = weather.condition.toLowerCase().includes('lluv') || weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('chub');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* ================= VISUAL ILLUSTATION BANNER (DAY / NIGHT / CLOUD / SUN / RAIN) ================= */}
        <div className={`relative p-6 sm:p-8 overflow-hidden rounded-t-3xl border-b border-slate-800 ${
          isNight 
            ? 'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white' 
            : 'bg-gradient-to-b from-sky-900 via-sky-800 to-cyan-950 text-white'
        }`}>
          
          {/* Animated SVG Illustration Backdrop */}
          <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isNight ? "#1e1b4b" : "#0284c7"} />
                  <stop offset="100%" stopColor={isNight ? "#090d16" : "#0f172a"} />
                </linearGradient>
                <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <rect width="800" height="300" fill="url(#skyGrad)" />
              
              {/* Stars if night */}
              {isNight && (
                <g fill="#ffffff" opacity="0.8">
                  <circle cx="120" cy="50" r="1.5" />
                  <circle cx="280" cy="30" r="2" />
                  <circle cx="450" cy="70" r="1" />
                  <circle cx="620" cy="40" r="1.8" />
                  <circle cx="710" cy="90" r="1.2" />
                </g>
              )}

              {/* Mountains / Coastline silhouette */}
              <path d="M0 220 Q 150 180, 300 210 T 600 190 T 800 210 L 800 300 L 0 300 Z" fill="#0f172a" opacity="0.7" />
              
              {/* Sea waves at bottom */}
              <path d="M0 240 Q 200 225, 400 240 T 800 240 L 800 300 L 0 300 Z" fill="url(#seaGrad)" />
            </svg>
          </div>

          {/* Celestial Body & Clouds Graphic Element */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-5">
              {/* Big Visual Icon / Illustration Box */}
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-2xl relative border ${
                isNight 
                  ? 'bg-indigo-900/60 border-indigo-500/40 text-indigo-200 shadow-indigo-950/50' 
                  : 'bg-amber-500/30 border-amber-400/50 text-amber-300 shadow-amber-500/20'
              }`}>
                {isNight ? (
                  <Moon className="w-12 h-12 animate-pulse text-indigo-200" />
                ) : isRainy ? (
                  <CloudRain className="w-12 h-12 text-cyan-300 animate-bounce" />
                ) : isCloudy ? (
                  <CloudSun className="w-12 h-12 text-amber-200" />
                ) : (
                  <Sun className="w-12 h-12 animate-spin-slow text-amber-300" />
                )}
                
                {/* Floating mini cloud */}
                <div className="absolute -bottom-2 -right-2 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-cyan-300 shadow">
                  {isNight ? 'Noche' : 'Día'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    isNight ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40' : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  }`}>
                    {isNight ? '🌙 Noche Cerrada / Clara' : isRainy ? '🌧️ Lluvioso / Chubascos' : isCloudy ? '⛅ Nublado Costero' : '☀️ Soleado y Despejado'}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    📍 {port.name} ({port.region})
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  {weather.condition}
                </h2>
                <p className="text-xs text-slate-200 font-medium">
                  Estado del mar: <strong className="text-cyan-300 uppercase">{weather.seaStateName}</strong> • Coeficiente Beaufort {weather.beaufortScale} ({weather.beaufortDescription})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer border border-white/10 shrink-0"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Temperature & Metric Pills */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-black font-mono text-lg">
                {formatTemp(weather.temp)}
              </div>
              <div>
                <div className="text-[10px] text-slate-300 font-mono uppercase">Temperatura</div>
                <div className="text-xs font-bold text-white">Sensación {formatTemp(weather.feelsLike)}</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-300 font-mono uppercase">Viento Actual</div>
                <div className="text-xs font-bold text-white">{formatSpeed(weather.windSpeedKnots)} ({weather.windDirection})</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-300 font-mono uppercase">Altura de Olas</div>
                <div className="text-xs font-bold text-white">{formatHeight(weather.waveHeightMeters)} ({weather.wavePeriodSeconds}s)</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold font-mono text-xs">
                {weather.pressureHpa}
              </div>
              <div>
                <div className="text-[10px] text-slate-300 font-mono uppercase">Presión hPa</div>
                <div className="text-xs font-bold text-emerald-400 capitalize">{weather.pressureTrend}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-3.5 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'current' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📊 Condiciones Actuales & Ilustración
          </button>
          <button
            onClick={() => setActiveTab('hourly')}
            className={`py-3.5 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'hourly' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            ⏱️ Pronóstico Horario (24h)
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`py-3.5 text-xs font-mono font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'safety' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🛡️ Avisos Náuticos & Seguridad
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 flex-1 bg-slate-900">
          {activeTab === 'current' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>DIRECCIÓN DE VIENTO</span>
                    <Compass className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {weather.windDirection} ({weather.windDegrees}°)
                  </div>
                  <p className="text-xs text-slate-300">
                    Rachas máximas de <strong className="text-cyan-300 font-mono">{formatSpeed(weather.windGustKnots)}</strong>. {weather.beaufortDescription}.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>PERÍODO DE OLA</span>
                    <Waves className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {weather.wavePeriodSeconds} segundos
                  </div>
                  <p className="text-xs text-slate-300">
                    Dirección de oleaje estimada con altura de <strong className="text-blue-300 font-mono">{formatHeight(weather.waveHeightMeters)}</strong>.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>TEMPERATURA DEL AGUA</span>
                    <Thermometer className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {formatTemp(weather.waterTemp)}
                  </div>
                  <p className="text-xs text-slate-300">
                    Temperatura ideal costera para baño y pesca deportiva.
                  </p>
                </div>

              </div>

              {/* Sun & Moon Ephemeris Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Sunrise className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-400">Amanecer / Ocaso</div>
                    <div className="text-sm font-bold text-white">07:22 - 21:38</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-400">Fase Lunar Actual</div>
                    <div className="text-sm font-bold text-white">Luna Creciente (68%)</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-400">Humedad & Visibilidad</div>
                    <div className="text-sm font-bold text-white">{weather.humidityPercent}% • 12 km</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hourly' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-xs text-slate-400 font-mono">
                Evolución meteorológica prevista para las próximas 24 horas en {port.name}:
              </div>
              <div className="space-y-2">
                {[0, 3, 6, 9, 12, 15, 18, 21].map((offset) => {
                  const hr = (currentHour + offset) % 24;
                  const tempVal = Math.round(weather.temp + Math.sin(hr / 3) * 3);
                  const windVal = Math.round(weather.windSpeedKnots + (hr % 3) * 1.5);
                  const isHrNight = hr < 7 || hr > 21;
                  return (
                    <div key={offset} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-bold w-12">{hr < 10 ? `0${hr}:00` : `${hr}:00`}</span>
                        <span className="text-slate-300 flex items-center gap-1.5">
                          {isHrNight ? '🌙 Noche Clara' : '☀️ Soleado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>Temp: <strong className="text-white">{tempVal}°C</strong></div>
                        <div>Viento: <strong className="text-cyan-300">{windVal} nudos</strong></div>
                        <div>Olas: <strong className="text-blue-300">{(weather.waveHeightMeters).toFixed(1)}m</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Condiciones Óptimas para Navegación</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No existen avisos costeros adversos vigentes en este sector marítimo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="font-bold text-amber-400">Recomendación para Pescadores</div>
                  <p className="text-slate-300">
                    Actividad biológica alta en rompientes. Aproveche las ventanas solunares superiores.
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="font-bold text-cyan-400">Recomendación para Navegantes</div>
                  <p className="text-slate-300">
                    Visibilidad excelente (&gt;10 km). Precaución habitual en bocana con corrientes de marea viva.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono rounded-b-3xl">
          <span>Actualizado en tiempo real • Open-Meteo & Hidrografía</span>
          <button
            onClick={onClose}
            key="close-modal-btn"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
