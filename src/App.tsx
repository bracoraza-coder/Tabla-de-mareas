import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { LegalModal, LegalTab } from './components/LegalModal';
import { PortMapModal } from './components/PortMapModal';
import { NotificationModal } from './components/NotificationModal';
import { CurrentTideGauge } from './components/CurrentTideGauge';
import { TideChart } from './components/TideChart';
import { TideFishChart3D } from './components/gauges/TideFishChart3D';
import { Gauges3D } from './components/gauges/Gauges3D';
import { SurfSection } from './components/SurfSection';
import { SolunarSection } from './components/SolunarSection';
import { MarineWeather } from './components/MarineWeather';
import { MonthlyTable } from './components/MonthlyTable';
import { QuickNav, TabKey } from './components/QuickNav';
import { AiAssistant } from './components/AiAssistant';

import { Port, UserUnits, NotificationSettings } from './types';
import { PORTS_DATABASE, getPortById } from './data/portsData';
import { useRealTideData } from './hooks/useRealTideData';
import { parsePortFromHash, buildPortPath } from './utils/router';

export default function App() {
  const [selectedPort, setSelectedPort] = useState<Port>(() => {
    const portFromUrl = parsePortFromHash();
    if (portFromUrl) return portFromUrl;
    try {
      const savedPortId = localStorage.getItem('mareas_selected_port_id');
      if (savedPortId) {
        const found = getPortById(savedPortId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return PORTS_DATABASE[0];
  });

  const [hasUserDefinedPort, setHasUserDefinedPort] = useState<boolean>(() => {
    if (parsePortFromHash()) return true;
    try {
      return !!localStorage.getItem('mareas_selected_port_id');
    } catch {
      return false;
    }
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Modals
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [legalModalState, setLegalModalState] = useState<{isOpen: boolean; tab: LegalTab}>({ isOpen: false, tab: 'aviso-legal' });

  // Preferences
  const [favorites, setFavorites] = useState<string[]>([]);
  const [units, setUnits] = useState<UserUnits>({ height: 'm', speed: 'knots', temp: 'C' });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    subscribedPortIds: [],
    alertTimingMinutes: 30,
    notifyPleamar: true,
    notifyBajamar: true,
    notifyMareasVivas: false,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('mareas_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {
      // ignore
    }
    return 'dark'; // Dark mode by default
  });
  const [activeTab, setActiveTab] = useState<TabKey>('grafico');

  // Load state from local storage and URL hash on mount
  useEffect(() => {
    // 1. URL Hash routing
    const portFromUrl = parsePortFromHash();
    if (portFromUrl) {
      setSelectedPort(portFromUrl);
      setHasUserDefinedPort(true);
    }

    // 2. LocalStorage Preferences
    try {
      const favs = localStorage.getItem('mareas_favs');
      if (favs) setFavorites(JSON.parse(favs));

      const savedUnits = localStorage.getItem('mareas_units');
      if (savedUnits) setUnits(JSON.parse(savedUnits));

      const notif = localStorage.getItem('mareas_notif');
      if (notif) setNotificationSettings(JSON.parse(notif));

      const savedTheme = localStorage.getItem('mareas_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.warn('Could not load preferences from local storage', e);
    }
  }, []);

  // Update hash when port changes
  useEffect(() => {
    window.history.replaceState(null, '', buildPortPath(selectedPort));
  }, [selectedPort]);

  // Sync state to local storage when it changes
  useEffect(() => {
    localStorage.setItem('mareas_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('mareas_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('mareas_notif', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem('mareas_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSelectPort = (port: Port) => {
    setSelectedPort(port);
    setHasUserDefinedPort(true);
    try {
      localStorage.setItem('mareas_selected_port_id', port.id);
    } catch (e) {
      console.warn(e);
    }
    handleOpenTideChart();
  };

  const { tideData, weatherData, loading, error } = useRealTideData(selectedPort, selectedDate);

  const toggleFavorite = (portId: string) => {
    setFavorites(prev => 
      prev.includes(portId) ? prev.filter(id => id !== portId) : [...prev, portId]
    );
  };

  const handleRefresh = () => {
    setSelectedDate(new Date(selectedDate.getTime()));
  };

  // Check if viewing today
  const isViewingToday = (() => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  })();

  const handleOpenTideChart = () => {
    setActiveTab('grafico');
    setTimeout(() => {
      const el = document.getElementById('tide-chart-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const renderTabContent = () => {
    if (loading && !tideData) {
       return <div className="p-20 text-center text-slate-400 animate-pulse font-mono text-sm">Cargando modelo mareográfico 3D y datos marinos...</div>;
    }
    if (error) {
       return <div className="p-20 text-center text-red-400 font-mono">Error de conexión: {error}</div>;
    }

    switch (activeTab) {
      case 'grafico':
        return (
          <div className="space-y-6">
            <CurrentTideGauge dayData={tideData} port={selectedPort} units={units} isViewingToday={isViewingToday} />
            <TideFishChart3D data={tideData} units={units} port={selectedPort} />
            <Gauges3D weather={weatherData} units={units} />
            <TideChart data={tideData} units={units} port={selectedPort} />
            <AiAssistant port={selectedPort} dayData={tideData} units={units} />
          </div>
        );
      case 'surf':
        return (
          <div className="space-y-6">
            <SurfSection dayData={tideData} weather={weatherData} port={selectedPort} units={units} />
            <Gauges3D weather={weatherData} units={units} />
          </div>
        );
      case 'pesca':
        return (
          <div className="space-y-6">
            <TideFishChart3D data={tideData} units={units} port={selectedPort} />
            <SolunarSection dayData={tideData} port={selectedPort} />
            <AiAssistant port={selectedPort} dayData={tideData} units={units} />
          </div>
        );
      case 'meteo':
        return (
          <div className="space-y-6">
            <Gauges3D weather={weatherData} units={units} />
            <MarineWeather weather={weatherData} units={units} isUpdating={loading} />
          </div>
        );
      case 'calendario':
        return (
          <MonthlyTable 
            port={selectedPort} 
            units={units} 
            selectedDate={selectedDate} 
            onSelectDate={(d) => {
              setSelectedDate(d);
              handleOpenTideChart();
            }} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-900 text-slate-100'}`}>
      <Header
        selectedPort={selectedPort}
        onSelectPort={handleSelectPort}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        units={units}
        onChangeUnits={setUnits}
        onOpenMapModal={() => setIsMapOpen(true)}
        onOpenTideChart={handleOpenTideChart}
        notificationSettings={notificationSettings}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'grafico') {
            handleOpenTideChart();
          } else {
            setActiveTab(tab);
          }
        }}
      />

      <main className="max-w-5xl mx-auto p-4 space-y-6 animate-fade-in mt-4">
        {/* Banner if Port is not yet defined by user */}
        {!hasUserDefinedPort && (
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border-2 border-cyan-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-cyan-600/30 border border-cyan-400/60 rounded-xl text-cyan-300 shrink-0">
                  <MapPin className="w-6 h-6 animate-bounce text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Puerto / Playa Por Definir
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      Selecciona tu puerto o zona de playa
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Define tu puerto o playa de interés para obtener predicciones precisas de mareas, oleaje, viento y calendario solunar.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const userLat = pos.coords.latitude;
                          const userLng = pos.coords.longitude;
                          let nearest = PORTS_DATABASE[0];
                          let minDist = Infinity;
                          PORTS_DATABASE.forEach(p => {
                            const d = Math.hypot(p.lat - userLat, p.lng - userLng);
                            if (d < minDist) {
                              minDist = d;
                              nearest = p;
                            }
                          });
                          handleSelectPort(nearest);
                        },
                        () => {
                          setIsMapOpen(true);
                        }
                      );
                    } else {
                      setIsMapOpen(true);
                    }
                  }}
                  className="flex-1 md:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>GPS Automático</span>
                </button>

                <button
                  onClick={() => setIsMapOpen(true)}
                  className="flex-1 md:flex-initial px-3.5 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Map className="w-4 h-4 text-cyan-400" />
                  <span>Elegir en Mapa</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {renderTabContent()}
      </main>

      <Footer
        onSelectPort={(p) => { handleSelectPort(p); window.scrollTo(0,0); }}
        onOpenLegal={(tab) => setLegalModalState({ isOpen: true, tab })}
      />

      {/* Modals & Overlays */}
      <PortMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        selectedPort={selectedPort}
        onSelectPort={handleSelectPort}
      />
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        favorites={favorites}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
        units={units}
      />
      <LegalModal
        isOpen={legalModalState.isOpen}
        initialTab={legalModalState.tab}
        onClose={() => setLegalModalState({ isOpen: false, tab: 'aviso-legal' })}
      />
      <CookieBanner
        onOpenLegal={(tab) => setLegalModalState({ isOpen: true, tab })}
      />
    </div>
  );
}
