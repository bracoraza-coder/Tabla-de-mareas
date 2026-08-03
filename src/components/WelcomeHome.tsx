import React, { useState } from 'react';
import { Waves, Search, MapPin, Navigation, Map, Compass, Wind, Anchor, Sparkles, ChevronRight, Star } from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';

interface WelcomeHomeProps {
  onSelectPort: (port: Port) => void;
  onOpenMapModal: () => void;
}

export const WelcomeHome: React.FC<WelcomeHomeProps> = ({ onSelectPort, onOpenMapModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('todos');

  const regions = Array.from(new Set(PORTS_DATABASE.map(p => p.region)));

  const filteredPorts = PORTS_DATABASE.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'todos' || p.region === selectedRegion;
    return matchesQuery && matchesRegion;
  });

  const popularPorts = PORTS_DATABASE.filter(p => p.isPopular);

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-cyan-500/30 p-8 sm:p-12 shadow-2xl text-center">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold tracking-wide uppercase backdrop-blur-md shadow-lg">
              <Waves className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Predicción Náutica Oficial • Mareas, Viento & Oleaje</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Bienvenido a la Guía de Mareas & Meteorología Marina
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-normal">
              Selecciona tu puerto, playa o zona costera de interés para consultar en tiempo real las pleamares, bajamares, coeficientes de marea, estado del mar, viento, surf y solunar.
            </p>

            <div className="pt-1">
              <a
                href="https://tabla-de-mareas.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-300 font-mono bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 hover:bg-slate-800 transition-colors shadow-lg"
              >
                <span>🌐 https://tabla-de-mareas.vercel.app/</span>
              </a>
            </div>

            {/* Quick Actions / GPS / Map */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const { latitude, longitude } = pos.coords;
                        let closest = PORTS_DATABASE[0];
                        let minDistance = Infinity;
                        PORTS_DATABASE.forEach(p => {
                          const dist = Math.hypot(p.lat - latitude, p.lng - longitude);
                          if (dist < minDistance) {
                            minDistance = dist;
                            closest = p;
                          }
                        });
                        onSelectPort(closest);
                      },
                      () => {
                        onOpenMapModal();
                      }
                    );
                  } else {
                    onOpenMapModal();
                  }
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-cyan-500/30 flex items-center gap-2.5 transition-all cursor-pointer border border-cyan-400/30 group"
              >
                <Navigation className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
                <span>Usar Mi Ubicación GPS</span>
              </button>

              <button
                onClick={onOpenMapModal}
                className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-bold text-sm rounded-2xl shadow-xl border border-cyan-500/40 flex items-center gap-2.5 transition-all cursor-pointer backdrop-blur-md"
              >
                <Map className="w-4 h-4 text-cyan-400" />
                <span>Explorar Mapa Interactivo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca tu puerto, ría, playa o localidad (ej. Santander, Tarifa, Gijón, Vigo...)"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-2xl text-white placeholder-slate-400 text-sm font-medium shadow-inner outline-none transition-all"
              />
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              aria-label="Filtrar por región"
              className="px-4 py-3.5 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-2xl text-white text-sm font-medium outline-none cursor-pointer w-full sm:w-auto shadow-inner"
            >
              <option value="todos">🌐 Todas las Regiones / Costas</option>
              {regions.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Popular Ports Quick Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Puertos y Playas Destacados
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {filteredPorts.length} ubicaciones disponibles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(searchQuery || selectedRegion !== 'todos' ? filteredPorts : popularPorts.slice(0, 12)).map((port) => (
                <div
                  key={port.id}
                  onClick={() => onSelectPort(port)}
                  className="group bg-slate-900 hover:bg-gradient-to-br hover:from-slate-900 hover:to-cyan-950/60 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-4 shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {port.region}
                      </span>
                      <span className="text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                        📍 {port.country}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-1">
                      {port.name}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-cyan-300">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Anchor className="w-3.5 h-3.5 text-cyan-400" /> Ver Mareas & Olas
                    </span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {filteredPorts.length === 0 && (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                <p className="text-sm font-bold text-white">No se encontraron puertos con "{searchQuery}"</p>
                <p className="text-xs text-slate-500">Prueba a buscar por otra localidad, provincia o costa.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      <div className="mt-12 text-center text-xs text-slate-400 font-mono py-4 border-t border-slate-900 space-y-1">
        <div>Tabla de Mareas Profesional • Conexión en tiempo real con modelos meteorológicos y astronómicos • España y Costa Atlántica/Mediterránea</div>
        <div>
          <a href="https://tabla-de-mareas.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            https://tabla-de-mareas.vercel.app/
          </a>
        </div>
      </div>
    </div>
  );
};
