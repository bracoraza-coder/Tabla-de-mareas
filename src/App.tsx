import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { CurrentTideGauge } from './components/CurrentTideGauge';
import { TideChart } from './components/TideChart';
import { SolunarSection } from './components/SolunarSection';
import { MarineWeather } from './components/MarineWeather';
import { MonthlyTable } from './components/MonthlyTable';
import { AiAssistant } from './components/AiAssistant';
import { PortMapModal } from './components/PortMapModal';
import { NotificationModal } from './components/NotificationModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { CookieBanner } from './components/CookieBanner';
import { Footer } from './components/Footer';

import { Port, TideDayData, UserUnits, NotificationSettings } from './types';
import { PORTS_DATABASE } from './data/portsData';
import { getTideDayData } from './utils/tideEngine';
import { fetchLiveMarineWeather } from './utils/liveMarineFetcher';
import { checkAndTriggerTideAlerts } from './utils/notificationManager';

export default function App() {
  // Active Port
  const [selectedPort, setSelectedPort] = useState<Port>(PORTS_DATABASE[0]); // Default Cádiz
  
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

    fetchLiveMarineWeather(selectedPort, data.weather).then(result => {
      if (isMounted && result.isLive) {
        setDayData(prev => ({
          ...prev,
          weather: result.weather
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

    const liveResult = await fetchLiveMarineWeather(selectedPort, initialData.weather);
    if (liveResult.isLive) {
      setDayData(prev => ({
        ...prev,
        weather: liveResult.weather
      }));
    }
    
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRefreshToast(`Telemetría en tiempo real (Open-Meteo) actualizada a las ${timeStr}`);
    
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

        {/* Marine & Fishing Technical Station Report */}
        <AiAssistant
          port={selectedPort}
          dayData={dayData}
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

