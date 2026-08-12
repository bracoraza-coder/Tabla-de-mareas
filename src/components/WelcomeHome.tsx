import React, { useState, useRef, useEffect } from 'react';
import { Waves, Search, MapPin, Navigation, Map, Compass, Wind, Anchor, Sparkles, ChevronRight, Star, X, Lightbulb } from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';
import { searchPorts, SearchResult } from '../utils/searchHelper';

interface WelcomeHomeProps {
  onSelectPort: (port: Port) => void;
  onOpenMapModal: () => void;
}

export const WelcomeHome: React.FC<WelcomeHomeProps> = ({ onSelectPort, onOpenMapModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('todos');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const regions = Array.from(new Set(PORTS_DATABASE.map(p => p.region)));

  // Perform smart fuzzy search
  const rawSearchResults: SearchResult[] = searchQuery.trim()
    ? searchPorts(PORTS_DATABASE, searchQuery)
    : [];

  // Filter search results by selected region if applicable
  const searchResults = rawSearchResults.filter(r =>
    selectedRegion === 'todos' || r.port.region === selectedRegion
  );

  // List of ports to show in the grid below
  const gridPorts = searchQuery.trim()
    ? searchResults.map(r => r.port)
    : PORTS_DATABASE.filter(p => selectedRegion === 'todos' || p.region === selectedRegion);

  const popularPorts = PORTS_DATABASE.filter(p => p.isPopular);

  // Close floating dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPort = (port: Port) => {
    setIsDropdownOpen(false);
    onSelectPort(port);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      // Auto-select top match immediately
      handleSelectPort(searchResults[0].port);
    } else if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasFuzzyTypoFix = searchResults.length > 0 && searchResults[0].isFuzzyTypoFix;

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-6 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-visible rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-cyan-500/30 p-8 sm:p-12 shadow-2xl text-center">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
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

            {/* Prominent Search Bar with Instant Floating Dropdown */}
            <div className="pt-2 relative text-left" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/90 p-3 rounded-2xl border border-cyan-500/50 shadow-2xl backdrop-blur-xl">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsDropdownOpen(true);
                    }}
                    placeholder="Escribe tu puerto, ría o playa (ej. Santander, Tarifa, Vigo, Gijón...)"
                    className="w-full pl-12 pr-10 py-3.5 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl text-white placeholder-slate-400 text-sm font-medium shadow-inner outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    if (searchQuery.trim()) setIsDropdownOpen(true);
                  }}
                  aria-label="Filtrar por región"
                  className="px-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-white text-sm font-medium outline-none cursor-pointer w-full sm:w-auto shadow-inner"
                >
                  <option value="todos">🌐 Todas las Costas</option>
                  {regions.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
              </form>

              {/* INSTANT FLOATING DROPDOWN MENU DIRECTLY UNDER SEARCH INPUT */}
              {isDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 border-2 border-cyan-500/60 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden max-h-96 flex flex-col">
                  <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-cyan-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      Sugerencias para "{searchQuery}"
                    </span>
                    <span>{searchResults.length} encontrada{searchResults.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-800/60">
                    {searchResults.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 space-y-1">
                        <p className="text-xs font-bold text-white">No encontramos ninguna ubicación coincidente con "{searchQuery}"</p>
                        <p className="text-[11px] text-slate-500">Intenta escribir el nombre aproximado o selecciona una costa del desplegable.</p>
                      </div>
                    ) : (
                      searchResults.slice(0, 8).map(({ port, isFuzzyTypoFix }) => (
                        <div
                          key={port.id}
                          onClick={() => handleSelectPort(port)}
                          className="p-3.5 hover:bg-cyan-950/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                              <Anchor className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                                <span>{port.name}</span>
                                {isFuzzyTypoFix && (
                                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Lightbulb className="w-2.5 h-2.5" /> Búsqueda Intuitiva
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>📍 {port.region}</span>
                                <span>•</span>
                                <span>{port.country}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0">
                            <span>Ver Mareas</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions / GPS / Map */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer border border-cyan-400/30 group"
              >
                <Navigation className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
                <span>Usar Mi Ubicación GPS</span>
              </button>

              <button
                onClick={onOpenMapModal}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-sm rounded-xl shadow-xl border border-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              >
                <Map className="w-4 h-4 text-cyan-400" />
                <span>Explorar Mapa Interactivo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ports Grid Section */}
        <div className="space-y-3" ref={resultsRef}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {searchQuery.trim() ? `Resultados para "${searchQuery}"` : 'Puertos y Playas Destacados'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {gridPorts.length} ubicaciones disponibles
            </span>
          </div>

          {/* Typo Auto-Correction Hint Banner */}
          {searchQuery.trim() && hasFuzzyTypoFix && searchResults.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-amber-200 text-xs flex items-center gap-2 font-mono">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Búsqueda intuitiva activa: Mostrando resultados de <strong>"{searchResults[0].port.name}"</strong> por alta similitud con "{searchQuery}".
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(searchQuery.trim() || selectedRegion !== 'todos' ? gridPorts : popularPorts.slice(0, 12)).map((port) => (
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

          {gridPorts.length === 0 && (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <p className="text-sm font-bold text-white">No se encontraron puertos con "{searchQuery}"</p>
              <p className="text-xs text-slate-500">Prueba a buscar por otra localidad, provincia o costa.</p>
            </div>
          )}
        </div>

      </div>

      <div className="mt-12 text-center text-xs text-slate-400 font-mono py-4 border-t border-slate-900 space-y-1">
        <div>Tabla de Mareas Profesional • Conexión en tiempo real con modelos meteorológicos y astronómicos • España y Costa Atlántica/Mediterránea</div>
      </div>
    </div>
  );
};
