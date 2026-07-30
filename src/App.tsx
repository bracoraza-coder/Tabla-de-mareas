import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { CurrentTideGauge } from './components/CurrentTideGauge';
import { TideChart } from './components/TideChart';
import { SolunarSection } from './components/SolunarSection';
import { MarineWeather } from './components/MarineWeather';
import { MonthlyTable } from './components/MonthlyTable';
import { PortMapModal } from './components/PortMapModal';
import { NotificationModal } from './components/NotificationModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { CookieBanner } from './components/CookieBanner';
import { Footer } from './components/Footer';
import { Port, TideDayData, UserUnits, NotificationSettings } from './types';
import { PORTS_DATABASE } from './data/portsData';
import { getTideDayData } from './utils/tideEngine';
import { fetchLiveMarineWeather } from './utils/liveMarineFetcher';
import { fetchLiveIhmTides } from './utils/ihmFetcher';
import { checkAndTriggerTideAlerts } from './utils/notificationManager';

function Dashboard() {
  const { portId } = useParams();
  const navigate = useNavigate();
  
  // Find port from URL or fallback to Cádiz
  const urlPort = PORTS_DATABASE.find(p => p.id === portId) || PORTS_DATABASE[0];

  // Active Port
  const [selectedPort, setSelectedPortState] = useState<Port>(urlPort);

  // Sync state if URL changes
  useEffect(() => {
    if (urlPort.id !== selectedPort.id) {
      setSelectedPortState(urlPort);
    }
  }, [urlPort, selectedPort.id]);

  const setSelectedPort = (port: Port) => {
    navigate(`/puerto/${port.id}`);
  };

  useEffect(() => {
    document.title = `Mareas en ${selectedPort.name} - Predicción Oficial IHM`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `Tablas de mareas, pleamares, bajamares y coeficientes para ${selectedPort.name}. Datos oficiales del Instituto Hidrográfico de la Marina.`);

    let scriptLd = document.querySelector('script[type="application/ld+json"]');
    if (!scriptLd) {
      scriptLd = document.createElement('script');
      scriptLd.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptLd);
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": `Predicción de mareas en ${selectedPort.name}`,
      "description": `Datos de pleamar, bajamar oficiales del IHM para ${selectedPort.name}, ${selectedPort.region}.`,
      "spatialCoverage": {
        "@type": "Place",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": selectedPort.lat,
          "longitude": selectedPort.lng
        }
      },
      "provider": {
        "@type": "Organization",
        "name": "Instituto Hidrográfico de la Marina (IHM)"
      }
    };
    scriptLd.textContent = JSON.stringify(structuredData);
  }, [selectedPort]);
  
  // Selected Date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Favorites in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tablademarea_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Units Settings
  const [units, setUnits] = useState<UserUnits>(() => {
    try {
      const saved = localStorage.getItem('tablademarea_units');
      return saved ? JSON.parse(saved) : { height: 'm', speed: 'knots', temp: 'C' };
    } catch {
      return { height: 'm', speed: 'knots', temp: 'C' };
    }
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('tablademarea_notifications');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        subscribedPortIds: [],
        alertTimingMinutes: 15,
        notifyPleamar: true,
        notifyBajamar: true,
        notifyMareasVivas: true,
      };
    } catch {
      return {
        enabled: true,
        subscribedPortIds: [],
        alertTimingMinutes: 15,
        notifyPleamar: true,
        notifyBajamar: true,
        notifyMareasVivas: true,
      };
    }
  });

  // Modals state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('aviso-legal');

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Day Tide Data state
  const [dayData, setDayData] = useState<TideDayData>(() =>
    getTideDayData(PORTS_DATABASE[0], new Date(), Date.now())
  );

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tablademarea_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Sync units to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tablademarea_units', JSON.stringify(units));
    } catch (e) {
      console.error(e);
    }
  }, [units]);

  // Sync notifications settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tablademarea_notifications', JSON.stringify(notificationSettings));
    } catch (e) {
      console.error(e);
    }
  }, [notificationSettings]);

  // Periodically check for tide alerts
  useEffect(() => {
    const checkAlerts = () => {
      checkAndTriggerTideAlerts(
        notificationSettings.subscribedPortIds,
        notificationSettings,
        units,
        setSelectedPort
      );
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [notificationSettings, units]);

  // Recalculate tide day data when port or date changes, and fetch live marine telemetry
  useEffect(() => {
    let isMounted = true;
    const data = getTideDayData(selectedPort, selectedDate, Date.now());
    setDayData(data);

    Promise.all([
      fetchLiveIhmTides(selectedPort, selectedDate, data),
      fetchLiveMarineWeather(selectedPort, data.weather)
    ]).then(([tideResult, weatherResult]) => {
      if (isMounted) {
        setDayData(prev => ({
          ...prev,
          highLows: tideResult.highLows,
          hourlyPoints: tideResult.hourlyPoints,
          weather: weatherResult.isLive ? weatherResult.weather : prev.weather
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedPort, selectedDate]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const now = new Date();
    const initialData = getTideDayData(selectedPort, selectedDate, now.getTime());
    setDayData(initialData);

    const [tideResult, weatherResult] = await Promise.all([
      fetchLiveIhmTides(selectedPort, selectedDate, initialData),
      fetchLiveMarineWeather(selectedPort, initialData.weather)
    ]);

    setDayData(prev => ({
      ...prev,
      highLows: tideResult.highLows,
      hourlyPoints: tideResult.hourlyPoints,
      weather: weatherResult.isLive ? weatherResult.weather : prev.weather
    }));
    
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRefreshToast(`Datos oficiales IHM y telemetría actualizada a las ${timeStr}`);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);

    setTimeout(() => {
      setRefreshToast(null);
    }, 3800);
  };

  const handleToggleFavorite = (portId: string) => {
    setFavorites(prev => {
      const isAdding = !prev.includes(portId);
      const updatedFavs = isAdding ? [...prev, portId] : prev.filter(id => id !== portId);
      
      setNotificationSettings(prevNotif => {
        const currentSubscribed = prevNotif.subscribedPortIds;
        let newSubscribed = currentSubscribed;
        if (isAdding) {
          if (!currentSubscribed.includes(portId)) {
            newSubscribed = [...currentSubscribed, portId];
          }
        } else {
          newSubscribed = currentSubscribed.filter(id => id !== portId);
        }
        return { ...prevNotif, subscribedPortIds: newSubscribed };
      });

      return updatedFavs;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between antialiased relative">
      
      {/* Floating Refresh Toast Banner */}
      {refreshToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-blue-400 animate-bounce transition-all">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Header
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        units={units}
        onChangeUnits={setUnits}
        onOpenMapModal={() => setIsMapModalOpen(true)}
        notificationSettings={notificationSettings}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">
        
        {/* Real-time Water Height Live Gauge & Next Tide Countdown */}
        <CurrentTideGauge
          dayData={dayData}
          port={selectedPort}
          units={units}
        />

        {/* Interactive Tide Curve Recharts Graph */}
        <TideChart
          dayData={dayData}
          port={selectedPort}
          units={units}
        />

        {/* Solunar Calendar & Fishing Activity Index */}
        <SolunarSection
          solunar={dayData.solunar}
          dateStr={dayData.dateStr}
        />

        {/* Real-time Marine Weather, Wind Compass & Swell */}
        <MarineWeather
          weather={dayData.weather}
          units={units}
        />



        {/* Monthly Tide Calendar Table */}
        <MonthlyTable
          port={selectedPort}
          units={units}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

      </main>

      {/* Interactive Global Port Map Modal */}
      <PortMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
      />

      {/* Browser Tide Notification Settings Modal */}
      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        favorites={favorites}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
        units={units}
      />

      {/* Legal & Compliance Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Floating Cookie Consent Banner */}
      <CookieBanner onOpenLegal={handleOpenLegal} />

      {/* Footer */}
      <Footer onSelectPort={setSelectedPort} onOpenLegal={handleOpenLegal} />

    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/puerto/:portId" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/puerto/cadiz" replace />} />
    </Routes>
  );
}

