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
  RefreshCw,
  Sun,
  Moon,
  LineChart,
  X
} from 'lucide-react';
import { Port, UserUnits, NotificationSettings } from '../types';
import { PORTS_DATABASE } from '../data/portsData';
import { searchPorts } from '../utils/searchHelper';
import { buildPortPath } from '../utils/router';
import { getZonedParts } from '../utils/timezoneHelpers';
import { QuickNav, TabKey } from './QuickNav';

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
  onOpenTideChart?: () => void;
  onGoHome?: () => void;
  notificationSettings: NotificationSettings;
  onOpenNotificationsModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
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
  onOpenTideChart,
  onGoHome,
  notificationSettings,
  onOpenNotificationsModal,
  onRefresh,
  isRefreshing = false,
  theme,
  onToggleTheme,
  activeTab,
  onTabChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUnitsOpen, setIsUnitsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredPorts = searchQuery.trim()
    ? searchPorts(PORTS_DATABASE, searchQuery).map(r => r.port)
    : PORTS_DATABASE;

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

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);

  // Format date string for input - built directly from local Y/M/D digits,
  // not toISOString() (which converts to UTC and can silently roll over to
  // the previous/next day depending on the visitor's own timezone offset).
  const dateInputVal = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGPSLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsFeedback('Tu navegador no soporta geolocalización GPS.');
      setTimeout(() => setGpsFeedback(null), 3500);
      onOpenMapModal();
      return;
    }

    setIsLocatingGPS(true);
    setGpsFeedback('Buscando tu puerto más cercano y abriendo mapa...');
    onOpenMapModal();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const { latitude, longitude } = pos.coords;
        let closest = PORTS_DATABASE[0];
        let minDistance = Infinity;

        PORTS_DATABASE.forEach(p => {
          const dist = calculateDistanceKm(latitude, longitude, p.lat, p.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closest = p;
          }
        });

        onSelectPort(closest);
        setIsSearchOpen(false);
        setSearchQuery('');
        const distFormatted = minDistance < 1 
          ? `${Math.round(minDistance * 1000)} m` 
          : `${minDistance.toFixed(1)} km`;
        setGpsFeedback(`Puerto detectado: ${closest.name} (${distFormatted})`);
        setTimeout(() => setGpsFeedback(null), 4000);
      },
      (err) => {
        setIsLocatingGPS(false);
        console.warn('Geolocation error:', err);
        setGpsFeedback('GPS no disponible. Mostrando mapa de puertos...');
        setTimeout(() => setGpsFeedback(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <header className="bg-slate-900 text-white border-b-2 border-blue-600 sticky top-0 z-50 shadow-xl">
      {/* Top Banner Bar - Hidden on small mobile to save space, visible on tablet+ */}
      <div className="hidden sm:flex bg-slate-950 px-3 py-0.5 text-[10px] text-slate-300 border-b border-slate-800/80 justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 uppercase tracking-wider font-bold">MODELO ASTRONÓMICO</span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400">METEO EN VIVO (OPEN-METEO)</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-300 text-[11px]">
          {onGoHome && (
            <>
              <button 
                onClick={onGoHome}
                className="hover:text-cyan-300 text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                title="Ir a la página de inicio"
              >
                <span>🏠 Inicio</span>
              </button>
              <span className="text-slate-700">|</span>
            </>
          )}
          <button 
            onClick={onOpenMapModal}
            className="hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer font-medium"
            id="header-map-btn"
          >
            <Map className="w-3 h-3 text-blue-400" />
            <span>Mapa Puertos</span>
          </button>
          <span className="text-slate-700">|</span>
          <button 
            onClick={onOpenTideChart}
            className="hover:text-cyan-300 text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer font-medium"
            id="header-chart-btn"
            title="Ver gráfica de mareas"
          >
            <LineChart className="w-3 h-3 text-cyan-400" />
            <span>Gráfica</span>
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer font-medium"
            id="theme-toggle-btn"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3 h-3 text-amber-400" />
            ) : (
              <Moon className="w-3 h-3 text-blue-400" />
            )}
            <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-3 py-1 sm:py-1.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 sm:gap-2.5">
          
          {/* Logo & Mobile Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={onGoHome}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
              title="Ir a la página de inicio"
              id="header-logo-btn"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Waves className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight uppercase text-white flex items-center gap-1 leading-none">
                  TABLA MAREAS <span className="text-blue-400 font-black bg-blue-950 px-1 py-0 rounded border border-blue-800 text-[10px] sm:text-xs">PRO</span>
                </h1>
              </div>
            </div>

            {/* Mobile Top Quick Actions (Map, Fav, Notifications, Settings) */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                onClick={onOpenMapModal}
                className="p-1 rounded-md bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 cursor-pointer"
                title="Mapa de puertos"
                id="mobile-map-icon-btn"
              >
                <Map className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onToggleFavorite(selectedPort.id)}
                className={`p-1 rounded-md border transition-all cursor-pointer ${
                  isFav
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                id="mobile-fav-btn"
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>

              <button
                onClick={onOpenNotificationsModal}
                className={`p-1 rounded-md border transition-all cursor-pointer relative ${
                  notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                title="Alertas de mareas"
                id="mobile-notif-btn"
              >
                {notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0 ? (
                  <BellRing className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              <button
                onClick={() => setIsUnitsOpen(!isUnitsOpen)}
                className="p-1 rounded-md bg-slate-950 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                title="Ajustes de unidades"
                id="mobile-units-btn"
              >
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              </button>

              <button
                onClick={onToggleTheme}
                className="p-1 rounded-md bg-slate-950 text-slate-300 hover:text-white border border-slate-800 cursor-pointer sm:hidden"
                title="Modo claro / oscuro"
                id="mobile-theme-btn"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* Search Bar & Date Selector Row */}
          <div className="flex flex-row items-center gap-1.5 flex-1">
            {/* Center Search Bar */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar puerto (Cádiz, Vigo, Bilbao...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-14 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                  id="search-ports-input"
                />
                <button
                  onClick={handleGPSLocation}
                  disabled={isLocatingGPS}
                  title="Detectar puerto más cercano con GPS"
                  className={`absolute right-1 px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                    isLocatingGPS 
                      ? 'bg-cyan-700 text-white animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white'
                  }`}
                  id="gps-location-btn"
                >
                  <Navigation className={`w-2.5 h-2.5 fill-white ${isLocatingGPS ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGPS ? 'Buscando...' : 'GPS'}</span>
                </button>
              </div>

              {/* GPS Feedback Toast */}
              {gpsFeedback && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-blue-950/95 border border-blue-500/80 text-blue-200 text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-xl flex items-center gap-1.5 backdrop-blur-md animate-fade-in">
                  <Navigation className="w-3 h-3 text-cyan-400 fill-cyan-400 shrink-0" />
                  <span>{gpsFeedback}</span>
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-800">
                  <div className="p-2 text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider bg-slate-950">
                    {searchQuery ? 'Resultados de búsqueda' : 'Estaciones Principales'}
                  </div>
                  {filteredPorts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No se encontraron puertos para "{searchQuery}"
                    </div>
                  ) : (
                    filteredPorts.map((port) => (
                      <a
                        key={port.id}
                        href={buildPortPath(port)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectPort(port);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer ${
                          selectedPort.id === port.id ? 'bg-blue-950/60 border-l-4 border-blue-500' : ''
                        }`}
                        id={`port-option-${port.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300">
                              {port.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {port.region}, {port.country}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {port.amplitude}m
                        </span>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Date Picker & Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-0.5 shadow-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  type="date"
                  value={dateInputVal}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectDate(new Date(e.target.value + 'T12:00:00'));
                    }
                  }}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer font-mono w-28 sm:w-auto"
                  id="date-picker-input"
                />
                <button
                  onClick={() => {
                    const todayInPort = getZonedParts(Date.now(), selectedPort.timezone);
                    onSelectDate(new Date(todayInPort.year, todayInPort.month - 1, todayInPort.day, 12, 0, 0));
                  }}
                  className="text-[10px] bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800 px-1.5 py-0.5 rounded transition-colors cursor-pointer font-bold shrink-0"
                  id="today-date-btn"
                >
                  Hoy
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center justify-center bg-slate-950 text-slate-300 hover:text-white border-slate-700/80 shrink-0 ${
                  isRefreshing ? 'bg-blue-950/60 text-blue-400 border-blue-500' : ''
                }`}
                title="Refrescar y actualizar datos en vivo"
                id="app-refresh-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Desktop Only Extra Action Buttons */}
              <div className="hidden lg:flex items-center gap-1">
                <button
                  onClick={() => onToggleFavorite(selectedPort.id)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isFav
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-amber-300 border-slate-700'
                  }`}
                  title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  id="favorite-toggle-btn"
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                <button
                  onClick={onOpenNotificationsModal}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer relative flex items-center justify-center ${
                    notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border-slate-700'
                  }`}
                  title="Configurar Alertas de Mareas y Notificaciones"
                  id="notifications-modal-trigger-btn"
                >
                  {notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0 ? (
                    <BellRing className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {notificationSettings.enabled && notificationSettings.subscribedPortIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-900 animate-ping"></span>
                  )}
                </button>

                <button
                  onClick={() => setIsUnitsOpen(!isUnitsOpen)}
                  className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  id="units-toggle-btn"
                >
                  <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono text-[10px]">
                    {units.height === 'm' ? 'M' : 'FT'} | {units.speed === 'knots' ? 'KT' : units.speed.toUpperCase()} | °{units.temp}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

              {isUnitsOpen && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
                  onClick={() => setIsUnitsOpen(false)}
                  id="units-modal-backdrop"
                >
                  <div 
                    className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 my-auto relative text-xs"
                    onClick={(e) => e.stopPropagation()}
                    id="units-modal-content"
                  >
                    <div className="font-bold text-blue-400 border-b border-slate-800 pb-3 flex items-center justify-between">
                      <span className="uppercase tracking-wider font-mono text-xs flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-blue-400" /> Selector de Unidades
                      </span>
                      <button 
                        onClick={() => setIsUnitsOpen(false)} 
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700 shadow-sm"
                        title="Cerrar modal"
                        id="close-units-modal-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px] font-mono">Altura de marea y olas</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 font-mono">
                        <button
                          onClick={() => onChangeUnits({ ...units, height: 'm' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.height === 'm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          Metros (m)
                        </button>
                        <button
                          onClick={() => onChangeUnits({ ...units, height: 'ft' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.height === 'ft' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          Pies (ft)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px] font-mono">Velocidad del viento</label>
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 font-mono">
                        <button
                          onClick={() => onChangeUnits({ ...units, speed: 'knots' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.speed === 'knots' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          Nudos
                        </button>
                        <button
                          onClick={() => onChangeUnits({ ...units, speed: 'kmh' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.speed === 'kmh' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          km/h
                        </button>
                        <button
                          onClick={() => onChangeUnits({ ...units, speed: 'mph' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.speed === 'mph' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          mph
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px] font-mono">Temperatura de agua y aire</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 font-mono">
                        <button
                          onClick={() => onChangeUnits({ ...units, temp: 'C' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.temp === 'C' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          Celsius (°C)
                        </button>
                        <button
                          onClick={() => onChangeUnits({ ...units, temp: 'F' })}
                          className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${units.temp === 'F' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                          Fahrenheit (°F)
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsUnitsOpen(false)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-xs mt-2"
                      id="save-units-btn"
                    >
                      Guardar y Aplicar
                    </button>
                  </div>
                </div>
              )}
        </div>

        {/* Selected Port Header Pill Bar & Favorites Bar */}
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-slate-400 font-bold uppercase text-[10px] whitespace-nowrap flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-blue-400" /> Puerto:
            </span>
            <span className="bg-blue-950 text-blue-300 border border-blue-700 font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm text-xs">
              {selectedPort.name}
              <span className="text-slate-400 text-[10px] font-mono">({selectedPort.region})</span>
            </span>

            {/* Quick popular ports horizontal pills */}
            <div className="h-3 w-px bg-slate-800 mx-0.5 hidden sm:block"></div>
            <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider whitespace-nowrap hidden lg:inline">Populares:</span>
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar">
              {popularPorts.slice(0, 5).map(p => (
                <a
                  key={p.id}
                  href={buildPortPath(p)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectPort(p);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedPort.id === p.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                  id={`popular-pill-${p.id}`}
                >
                  {p.name.split(' (')[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Saved Favorites Pills */}
          {favoritePortsList.length > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-amber-300 font-bold text-[10px] uppercase">Favs:</span>
              <div className="flex items-center gap-1 overflow-x-auto max-w-xs no-scrollbar">
                {favoritePortsList.map(fav => (
                  <a
                    key={fav.id}
                    href={buildPortPath(fav)}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectPort(fav);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                      selectedPort.id === fav.id
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-300'
                        : 'bg-slate-950 text-amber-200 hover:bg-amber-950 border-amber-800/60'
                    }`}
                    id={`fav-pill-${fav.id}`}
                  >
                    {fav.name.split(' (')[0]}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
              <Star className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline text-slate-400">
                Guarda tus favoritos con la estrella <Star className="w-2.5 h-2.5 inline text-amber-400 fill-amber-400" />
              </span>
            </div>
          )}

        </div>

        {/* Quick Nav Section Tabs - Sticky together with Header */}
        {activeTab && onTabChange && (
          <div className="mt-1 pt-1 border-t border-slate-800/80">
            <QuickNav active={activeTab} onChange={onTabChange} />
          </div>
        )}
      </div>
    </header>
  );
};
