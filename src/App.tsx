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
import { ProfessionalFishingSuite } from './components/ProfessionalFishingSuite';
import { MarineWeather } from './components/MarineWeather';
import { MonthlyTable } from './components/MonthlyTable';
import { QuickNav, TabKey } from './components/QuickNav';
import { AiAssistant } from './components/AiAssistant';
import { WelcomeHome } from './components/WelcomeHome';

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
    return !!parsePortFromHash();
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
    setActiveTab('grafico');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <TideFishChart3D data={tideData} units={units} port={selectedPort} />
            <CurrentTideGauge dayData={tideData} port={selectedPort} units={units} isViewingToday={isViewingToday} />
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
            <ProfessionalFishingSuite dayData={tideData} weather={weatherData} port={selectedPort} />
            <AiAssistant port={selectedPort} dayData={tideData} units={units} />
          </div>
        );
      case 'meteo':
        return (
          <div className="space-y-6">
            <MarineWeather weather={weatherData} units={units} port={selectedPort} isUpdating={loading} />
            <Gauges3D weather={weatherData} units={units} />
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
        onGoHome={() => {
          setHasUserDefinedPort(false);
          try {
            localStorage.removeItem('mareas_selected_port_id');
          } catch {}
        }}
        notificationSettings={notificationSettings}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <main className="max-w-6xl mx-auto p-4 space-y-6 animate-fade-in mt-4">
        {!hasUserDefinedPort ? (
          <WelcomeHome
            onSelectPort={handleSelectPort}
            onOpenMapModal={() => setIsMapOpen(true)}
          />
        ) : (
          renderTabContent()
        )}
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
