import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { QuickNav } from './components/QuickNav';
import { CurrentTideGauge } from './components/CurrentTideGauge';
import { TideChart } from './components/TideChart';
import { SurfSection } from './components/SurfSection';
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
import { getTideDayData, applyOfficialTideAnchors } from './utils/tideEngine';
import { fetchOfficialTides, parseOfficialTimeToTimestamp } from './utils/officialTideFetcher';
import { fetchLiveMarineWeather, getCachedMarineWeather } from './utils/liveMarineFetcher';
import { checkAndTriggerTideAlerts } from './utils/notificationManager';
import { getPortFromLocation, syncUrlToPort, updateHeadForPort } from './utils/router';
import { formatZonedHHMM, getZonedParts } from './utils/timezoneHelpers';

export default function App() {
  // Theme (dark/light) - remembers the visitor's choice, defaulting to
  // their system preference the very first time they visit.
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('mareas_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem('mareas_theme', theme);
    } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const [activeTab, setActiveTab] = useState<'grafico' | 'surf' | 'pesca' | 'meteo' | 'calendario'>('grafico');

  // Active Port - initialised from the URL (e.g. /mareas/cadiz) when present,
  // so every port has its own shareable, indexable address.
  const [selectedPort, setSelectedPortState] = useState<Port>(
    () => getPortFromLocation() || PORTS_DATABASE[0]
  );

  // Central port selector: updates state, the browser URL and the page's
  // SEO tags (title/description/canonical/OG) all in one place, so every
  // entry point (search, favorites, GPS, map modal, notifications) stays
  // in sync automatically.
  const selectPort = (port: Port, replaceHistory = false) => {
    setSelectedPortState(port);
    syncUrlToPort(port, replaceHistory);
    updateHeadForPort(port);
  };

  // Set the correct URL/SEO tags for the initial port on first load, and
  // keep everything in sync with the browser's Back/Forward buttons.
  useEffect(() => {
    syncUrlToPort(selectedPort, true);
    updateHeadForPort(selectedPort);

    const handlePopState = () => {
      const portFromUrl = getPortFromLocation();
      if (portFromUrl) setSelectedPortState(portFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
        selectPort
      );
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [notificationSettings, units]);

  // Recalculate tide day data when port or date changes, and fetch live marine telemetry
  const [isWeatherUpdating, setIsWeatherUpdating] = useState(false);

  // Whether the selected date is "today" IN THE PORT'S OWN TIMEZONE. This
  // matters because "current water height", "next tide" countdown and the
  // "EN VIVO" weather badge only make sense for the real present moment -
  // showing them for a date the user is browsing in the past or future
  // (using today's real clock time under the hood) would be misleading.
  const isViewingToday = (() => {
    const todayInPort = getZonedParts(Date.now(), selectedPort.timezone);
    return (
      selectedDate.getFullYear() === todayInPort.year &&
      selectedDate.getMonth() + 1 === todayInPort.month &&
      selectedDate.getDate() === todayInPort.day
    );
  })();

  useEffect(() => {
    const abortController = new AbortController();
    // For "today", evaluate at the real current instant. For any other
    // date, evaluate at local noon of that day - there is no meaningful
    // "current instant" for a day you're not actually in right now.
    const referenceTimestamp = isViewingToday
      ? Date.now()
      : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0).getTime();

    const data = getTideDayData(selectedPort, selectedDate, referenceTimestamp);

    // Try the official source (our own /api/mareas backend -> IHM) on top of
    // the local model. This never blocks the UI: the estimated model shows
    // immediately, and gets upgraded to real official times if/when the
    // official lookup succeeds.
    fetchOfficialTides(selectedPort, data.dateStr).then(result => {
      if (abortController.signal.aborted) return;
      if (result.ok && result.tides && result.tides.length >= 2) {
        const anchors = result.tides
          .map(t => {
            const timestamp = parseOfficialTimeToTimestamp(t.time, data.dateStr, selectedPort.timezone);
            return timestamp === null ? null : { timestamp, height: t.height, type: t.type };
          })
          .filter((a): a is { timestamp: number; height: number; type: 'pleamar' | 'bajamar' } => a !== null);

        if (anchors.length >= 2) {
          setDayData(prev => applyOfficialTideAnchors(prev, anchors, selectedPort, result.stationName || 'IHM'));
        }
      }
    });

    if (isViewingToday) {
      // 1) Show cached live data instantly if we have it (no network wait, no
      //    flicker back to the local harmonic fallback when revisiting a port).
      const cached = getCachedMarineWeather(selectedPort.id);
      setDayData(cached ? { ...data, weather: cached.weather } : data);

      // 2) Revalidate in the background so the figures stay fresh, without blocking the UI.
      setIsWeatherUpdating(true);
      fetchLiveMarineWeather(selectedPort, data.weather, abortController.signal)
        .then(result => {
          if (abortController.signal.aborted) return;
          if (result.isLive) {
            setDayData(prev => ({ ...prev, weather: result.weather }));
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsWeatherUpdating(false);
        });
    } else {
      // Browsing a different day: never show "today's live weather" mislabelled
      // as this day's conditions. Use the date-specific estimated model only.
      setDayData(data);
      setIsWeatherUpdating(false);
    }

    return () => {
      abortController.abort();
    };
  }, [selectedPort, selectedDate, isViewingToday]);

  // Prefetch live weather for the user's favorite ports during idle time, so
  // switching to any of them from the header feels instant (served from cache).
  useEffect(() => {
    if (favorites.length === 0) return;
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    const schedule = idleWindow.requestIdleCallback || ((cb: () => void) => window.setTimeout(cb, 800));

    const handle = schedule(() => {
      favorites.forEach((portId, idx) => {
        const port = PORTS_DATABASE.find(p => p.id === portId);
        if (!port || getCachedMarineWeather(port.id)) return;
        // Stagger requests slightly to avoid bursting the free API all at once.
        setTimeout(() => {
          const seedData = getTideDayData(port, new Date(), Date.now());
          fetchLiveMarineWeather(port, seedData.weather).catch(() => {});
        }, idx * 400);
      });
    });

    return () => {
      if (idleWindow.requestIdleCallback && typeof handle === 'number') {
        // cancelIdleCallback isn't consistently typed; guard defensively.
        (window as any).cancelIdleCallback?.(handle);
      }
    };
  }, [favorites]);

  // Auto-refresh live marine telemetry every 10 minutes so every visitor
  // always sees up-to-date, freely-sourced weather/wave data (Open-Meteo),
  // without needing to manually reload the page. Only applies when viewing
  // today - refreshing "live" data for a different day makes no sense.
  useEffect(() => {
    if (!isViewingToday) return;
    const AUTO_REFRESH_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      fetchLiveMarineWeather(selectedPort, dayData.weather).then(result => {
        if (result.isLive) {
          // Only ever touch the weather field here. Tide times (official
          // IHM or estimated) don't change within the same day, and must
          // never be silently replaced back to the local model by this
          // periodic refresh.
          setDayData(curr => ({ ...curr, weather: result.weather }));
        }
      });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [selectedPort, selectedDate, isViewingToday]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    if (!isViewingToday) {
      // Nothing "live" to refresh for a day that isn't today - just let the
      // button briefly acknowledge the tap.
      setRefreshToast('Estás viendo la previsión de otro día: los datos en vivo solo aplican a hoy.');
      setTimeout(() => setIsRefreshing(false), 400);
      setTimeout(() => setRefreshToast(null), 3200);
      return;
    }

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
    
    const timeStr = formatZonedHHMM(now.getTime(), selectedPort.timezone);
    setRefreshToast(`Telemetría en tiempo real (Open-Meteo) actualizada a las ${timeStr}h (hora local de ${selectedPort.name.split(' (')[0]})`);
    
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
        onSelectPort={selectPort}
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
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Section tabs: only the selected section is shown, large and centered */}
      <QuickNav active={activeTab} onChange={setActiveTab} />

      {/* Main Container Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">

        {/* Real-time Water Height Live Gauge & Next Tide Countdown - always visible summary */}
        <div id="current-tide-gauge" className="scroll-mt-24">
          <CurrentTideGauge
            dayData={dayData}
            port={selectedPort}
            units={units}
            isViewingToday={isViewingToday}
          />
        </div>

        {activeTab === 'grafico' && (
          <TideChart dayData={dayData} port={selectedPort} units={units} />
        )}

        {activeTab === 'surf' && (
          <SurfSection weather={dayData.weather} dayData={dayData} port={selectedPort} units={units} />
        )}

        {activeTab === 'pesca' && (
          <>
            <SolunarSection solunar={dayData.solunar} dateStr={dayData.dateStr} />
            <AiAssistant port={selectedPort} dayData={dayData} units={units} />
          </>
        )}

        {activeTab === 'meteo' && (
          <MarineWeather weather={dayData.weather} units={units} isUpdating={isWeatherUpdating} />
        )}

        {activeTab === 'calendario' && (
          <MonthlyTable port={selectedPort} units={units} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )}

      </main>

      {/* Interactive Global Port Map Modal */}
      <PortMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        selectedPort={selectedPort}
        onSelectPort={selectPort}
      />

      {/* Browser Tide Notification Settings Modal */}
      <NotificationModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        favorites={favorites}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        selectedPort={selectedPort}
        onSelectPort={selectPort}
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
      <Footer onSelectPort={selectPort} onOpenLegal={handleOpenLegal} />

    </div>
  );
}

