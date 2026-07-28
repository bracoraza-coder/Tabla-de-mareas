import React, { useState, useRef, useEffect } from 'react';
import { 
  Waves, 
  Search, 
  MapPin, 
  Star, 
  Calendar as CalendarIcon, 
  Compass, 
  Settings2, 
  ChevronDown, 
  Navigation,
  Globe,
  Sparkles,
  Map,
  Bell,
  BellRing,
  RefreshCw
} from 'lucide-react';
import { Port, UserUnits, NotificationSettings } from '../types';
import { PORTS_DATABASE } from '../data/portsData';

interface HeaderProps {
  selectedPort: Port;
  onSelectPort: (port: Port) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  favorites: string[];
  onToggleFavorite: (portId: string) => void;
  units: UserUnits;
  onChangeUnits: (units: UserUnits) => void;
  onOpenMapModal: () => void;
  notificationSettings: NotificationSettings;
  onOpenNotificationsModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPort,
  onSelectPort,
  selectedDate,
  onSelectDate,
  favorites,
  onToggleFavorite,
  units,
  onChangeUnits,
  onOpenMapModal,
  notificationSettings,
  onOpenNotificationsModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnitsOpen, setIsUnitsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredPorts = PORTS_DATABASE.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const popularPorts = PORTS_DATABASE.filter(p => p.isPopular);
  const favoritePortsList = PORTS_DATABASE.filter(p => favorites.includes(p.id));

  const isFav = favorites.includes(selectedPort.id);

  // Format date string for input
  const dateInputVal = selectedDate.toISOString().split('T')[0];

  const handleGPSLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Find closest port in DB
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
          alert('No se pudo obtener la ubicación GPS. Selecciona un puerto manualmente.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b-4 border-blue-600 sticky top-0 z-40 shadow-2xl">
      {/* Top Banner Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 uppercase tracking-wider font-bold">DATO OFICIAL</span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400">ACTUALIZADO EN TIEMPO REAL</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-xs">
          <button 
            onClick={onOpenMapModal}
            className="hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer font-medium"
            id="header-map-btn"
          >
            <Map className="w-3.5 h-3.5 text-blue-400" />
            <span>Mapa de Puertos</span>
          </button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-400">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Español</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Logo & Main Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg shadow-md flex items-center justify-center text-white shrink-0">
                <Waves className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight uppercase text-white flex items-center gap-2">
                  TABLA DE MAREAS <span className="text-blue-400 font-extrabold bg-blue-950 px-2 py-0.5 rounded border border-blue-800 text-sm">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                  DATOS HIDROGRÁFICOS & PREDICCIÓN SOLUNAR
                </p>
              </div>
            </div>

            {/* Mobile Units toggle button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsUnitsOpen(!isUnitsOpen)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                id="mobile-units-btn"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Search Bar & Location Finder */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar puerto o provincia (ej. Cádiz, San Sebastián, Vigo...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-24 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                id="search-ports-input"
              />
              <button
                onClick={handleGPSLocation}
                title="Usar mi ubicación GPS"
                className="absolute right-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                id="gps-location-btn"
              >
                <Navigation className="w-3 h-3 fill-white" />
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-800">
                <div className="p-2 text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider bg-slate-950">
                  {searchQuery ? 'Resultados de búsqueda' : 'Estaciones Principales'}
                </div>
                {filteredPorts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No se encontraron puertos para "{searchQuery}"
                  </div>
                ) : (
                  filteredPorts.map((port) => (
                    <button
                      key={port.id}
                      onClick={() => {
                        onSelectPort(port);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer ${
                        selectedPort.id === port.id ? 'bg-blue-950/60 border-l-4 border-blue-500' : ''
                      }`}
                      id={`port-option-${port.id}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300">
                            {port.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {port.region}, {port.country}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {port.amplitude}m
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Date Picker & Units Controls */}
          <div className="flex items-center gap-2.5 justify-between lg:justify-end">
            {/* Date selector */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <input
                type="date"
                value={dateInputVal}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectDate(new Date(e.target.value + 'T12:00:00'));
                  }
                }}
                className="bg-transparent text-xs sm:text-sm text-white font-medium focus:outline-none cursor-pointer font-mono"
                id="date-picker-input"
              />
              <button
                onClick={() => onSelectDate(new Date())}
                className="text-xs bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer font-bold"
                id="today-date-btn"
              >
                Hoy
              </button>
            </div>

            {/* Favorite toggle for active port */}
            <button
              onClick={() => onToggleFavorite(selectedPort.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isFav
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-amber-300 border-slate-700'
              }`}
              title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              id="favorite-toggle-btn"
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Notification Alerts button */}
            <button
              onClick={onOpenNotificationsModal}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative flex items-center justify-center ${
                notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Configurar Alertas de Mareas y Notificaciones"
              id="notifications-modal-trigger-btn"
            >
              {notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0 ? (
                <BellRing className="w-4 h-4 text-blue-400 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4 text-slate-400" />
              )}
              {notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-slate-900 animate-ping"></span>
              )}
            </button>

            {/* Refresh / Update live data button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center bg-slate-950 text-slate-300 hover:text-white border-slate-700 hover:border-blue-500 ${
                isRefreshing ? 'bg-blue-950/60 text-blue-400 border-blue-500' : ''
              }`}
              title="Refrescar y actualizar datos en vivo"
              id="app-refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>


            {/* Desktop & Mobile Units selector button */}
            <div className="relative">
              <button
                onClick={() => setIsUnitsOpen(!isUnitsOpen)}
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                id="units-toggle-btn"
              >
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-[11px]">
                  {units.height === 'm' ? 'METROS' : 'PIES'} | {units.speed === 'knots' ? 'NUDOS' : units.speed === 'kmh' ? 'KM/H' : 'MPH'} | °{units.temp}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isUnitsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-xs space-y-3.5">
                  <div className="font-bold text-blue-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span className="uppercase tracking-wider font-mono text-[11px] flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-blue-400" /> Selector de Unidades
                    </span>
                    <button 
                      onClick={() => setIsUnitsOpen(false)} 
                      className="text-slate-400 hover:text-white text-sm font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-slate-400 font-bold block mb-1 uppercase text-[10px] font-mono">Altura de marea y olas</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
                      <button
                        onClick={() => onChangeUnits({ ...units, height: 'm' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.height === 'm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Metros (m)
                      </button>
                      <button
                        onClick={() => onChangeUnits({ ...units, height: 'ft' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.height === 'ft' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Pies (ft)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1 uppercase text-[10px] font-mono">Velocidad del viento</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
                      <button
                        onClick={() => onChangeUnits({ ...units, speed: 'knots' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.speed === 'knots' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Nudos
                      </button>
                      <button
                        onClick={() => onChangeUnits({ ...units, speed: 'kmh' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.speed === 'kmh' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        km/h
                      </button>
                      <button
                        onClick={() => onChangeUnits({ ...units, speed: 'mph' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.speed === 'mph' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        mph
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1 uppercase text-[10px] font-mono">Temperatura de agua y aire</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
                      <button
                        onClick={() => onChangeUnits({ ...units, temp: 'C' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.temp === 'C' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Celsius (°C)
                      </button>
                      <button
                        onClick={() => onChangeUnits({ ...units, temp: 'F' })}
                        className={`py-1.5 rounded font-bold transition-colors cursor-pointer ${units.temp === 'F' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Fahrenheit (°F)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Selected Port Header Pill Bar & Favorites Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            <span className="text-slate-400 font-bold uppercase text-[11px] whitespace-nowrap flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Puerto:
            </span>
            <span className="bg-blue-950 text-blue-300 border border-blue-700 font-bold px-3 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
              {selectedPort.name}
              <span className="text-slate-400 text-[10px] font-mono">({selectedPort.region})</span>
            </span>

            {/* Quick popular ports horizontal pills */}
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap hidden lg:inline">Populares:</span>
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {popularPorts.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectPort(p)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedPort.id === p.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                  id={`popular-pill-${p.id}`}
                >
                  {p.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Favorites Pills */}
          {favoritePortsList.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-300 font-bold text-[11px] uppercase">Favoritos:</span>
              <div className="flex items-center gap-1 overflow-x-auto max-w-xs no-scrollbar">
                {favoritePortsList.map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => onSelectPort(fav)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                      selectedPort.id === fav.id
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-300'
                        : 'bg-slate-950 text-amber-200 hover:bg-amber-950 border-amber-800/60'
                    }`}
                    id={`fav-pill-${fav.id}`}
                  >
                    {fav.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
              <Star className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-slate-400">
                Guarda tus favoritos reales usando la estrella <Star className="w-3 h-3 inline text-amber-400 fill-amber-400" /> junto a la fecha
              </span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
