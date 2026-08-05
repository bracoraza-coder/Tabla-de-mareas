import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, MapPin, X, Search, List, Navigation, Layers, Compass, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';
import { buildPortPath } from '../utils/router';

interface PortMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPort: Port;
  onSelectPort: (port: Port) => void;
  isEmbedded?: boolean;
}

type MapLayerType = 'dark' | 'satellite' | 'streets';

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; subdomains?: string; attribution: string }> = {
  dark: {
    name: 'Oscuro Marítimo',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    name: 'Satelital HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
  },
  streets: {
    name: 'Fronteras / Topográfico',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

const createPortDivIcon = (isSelected: boolean, isMatched: boolean, isFilteredActive: boolean) => {
  let bg = '#0284c7';
  let border = '#ffffff';
  let size = 16;
  let halo = '';
  let opacity = 1;

  if (isSelected) {
    bg = '#fbbf24';
    border = '#ffffff';
    size = 22;
    halo = '<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(251, 191, 36, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>';
  } else if (isMatched && isFilteredActive) {
    bg = '#38bdf8';
    border = '#ffffff';
    size = 18;
    halo = '<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(56, 189, 248, 0.3); animation: ping 2.5s infinite;"></div>';
  } else if (!isMatched && isFilteredActive) {
    bg = '#475569';
    border = '#94a3b8';
    size = 12;
    opacity = 0.45;
  }

  return L.divIcon({
    className: 'custom-port-marker-wrapper',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: ${opacity};">
        ${halo}
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bg};
          border: 2px solid ${border};
          border-radius: 50%;
          box-shadow: 0 0 10px ${bg};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        ">
          <div style="width: ${size > 14 ? '6px' : '4px'}; height: ${size > 14 ? '6px' : '4px'}; background: ${isSelected ? '#0f172a' : '#ffffff'}; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createUserGpsDivIcon = () => {
  return L.divIcon({
    className: 'custom-user-gps-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s infinite;"></div>
        <div style="
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 14px #3b82f6;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const PortMapModal: React.FC<PortMapModalProps> = ({
  isOpen,
  onClose,
  selectedPort,
  onSelectPort,
  isEmbedded = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('Todos');
  const [view, setView] = useState<'mapa' | 'lista'>('mapa');
  const [mapLayer, setMapLayer] = useState<MapLayerType>('dark');
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const countries = ['Todos', ...Array.from(new Set(PORTS_DATABASE.map(p => p.country)))];

  const normalizeStr = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredPorts = PORTS_DATABASE.filter(p => {
    const q = normalizeStr(filterQuery);
    const matchesSearch = !q || 
      normalizeStr(p.name).includes(q) ||
      normalizeStr(p.region).includes(q) ||
      normalizeStr(p.country).includes(q);
    const matchesCountry = selectedCountryFilter === 'Todos' || p.country === selectedCountryFilter;
    return matchesSearch && matchesCountry;
  });

  // Auto-fit bounds or fly to target when user searches or filters by country
  useEffect(() => {
    if (!mapInstanceRef.current || (!isOpen && !isEmbedded) || view !== 'mapa') return;

    if (filteredPorts.length === 1) {
      const target = filteredPorts[0];
      mapInstanceRef.current.flyTo([target.lat, target.lng], 10, { duration: 1 });
    } else if (filteredPorts.length > 1 && (filterQuery.trim().length > 0 || selectedCountryFilter !== 'Todos')) {
      const bounds = L.latLngBounds(filteredPorts.map(p => [p.lat, p.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
    }
  }, [filterQuery, selectedCountryFilter, isOpen, isEmbedded, view]);

  const handlePick = (port: Port) => {
    onSelectPort(port);
    if (!isEmbedded) onClose();
  };

  // Initialize or update Leaflet Map
  useEffect(() => {
    if ((!isOpen && !isEmbedded) || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Safely reset container's leaflet ID if DOM element was reused
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      try {
        const map = L.map(mapContainerRef.current, {
          center: [selectedPort.lat, selectedPort.lng],
          zoom: 6,
          zoomControl: false,
          minZoom: 2,
          maxZoom: 18,
          maxBounds: [[-85, -180], [85, 180]],
          maxBoundsViscosity: 1.0,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const currentLayerCfg = MAP_LAYERS[mapLayer];
        const tiles = L.tileLayer(currentLayerCfg.url, {
          attribution: currentLayerCfg.attribution,
          subdomains: currentLayerCfg.subdomains || 'abc',
          maxZoom: 18,
          noWrap: true,
        }).addTo(map);

        tileLayerRef.current = tiles;
        markersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Error initializing Leaflet map:", err);
      }
    } else {
      mapInstanceRef.current.setView([selectedPort.lat, selectedPort.lng], mapInstanceRef.current.getZoom() || 6);
    }

    if (view === 'mapa' && mapInstanceRef.current) {
      const invalidate = () => mapInstanceRef.current?.invalidateSize();
      invalidate();
      const t1 = setTimeout(invalidate, 50);
      const t2 = setTimeout(invalidate, 250);
      const t3 = setTimeout(invalidate, 600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, isEmbedded, view, selectedPort, isFullScreen]);

  // Clean up map when modal closes
  useEffect(() => {
    if (!isOpen && !isEmbedded) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersGroupRef.current = null;
        userMarkerRef.current = null;
      }
    }
  }, [isOpen, isEmbedded]);

  // Handle Layer change
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const layerCfg = MAP_LAYERS[mapLayer];
      const newTiles = L.tileLayer(layerCfg.url, {
        attribution: layerCfg.attribution,
        subdomains: layerCfg.subdomains || 'abc',
        maxZoom: 18,
        noWrap: true,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTiles;
    }
  }, [mapLayer]);

  // Update markers on ports/filter/selected changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const isFilteredActive = filterQuery.trim().length > 0 || selectedCountryFilter !== 'Todos';

    PORTS_DATABASE.forEach((port) => {
      const isSelected = port.id === selectedPort.id;
      const isMatched = filteredPorts.some(fp => fp.id === port.id);
      const icon = createPortDivIcon(isSelected, isMatched, isFilteredActive);

      const marker = L.marker([port.lat, port.lng], { 
        icon,
        zIndexOffset: isSelected ? 1000 : (isMatched ? 500 : 0)
      });

      marker.bindTooltip(`<b>${port.name}</b><br/><span style="font-size:10px; opacity:0.8;">${port.region}, ${port.country}</span>`, {
        direction: 'top',
        offset: [0, -10],
        className: 'custom-leaflet-tooltip',
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 min-w-[180px] font-sans';
      popupContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="background: #0284c7; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
            ${port.country}
          </span>
          <span style="color: #94a3b8; font-size: 10px;">${port.region}</span>
        </div>
        <div style="font-weight: 800; font-size: 14px; color: #ffffff; margin-bottom: 2px;">
          ${port.name}
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 10px;">
          📍 ${port.lat.toFixed(3)}°, ${port.lng.toFixed(3)}°
        </div>
        <button id="btn-select-port-${port.id}" style="
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        ">
          Elegir Puerto
        </button>
      `;

      popupContent.querySelector(`#btn-select-port-${port.id}`)?.addEventListener('click', () => {
        handlePick(port);
      });

      marker.bindPopup(popupContent);
      markersGroupRef.current?.addLayer(marker);
    });
  }, [filteredPorts, selectedPort, filterQuery, selectedCountryFilter]);

  // Locate User GPS
  const handleLocateUser = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Tu navegador no soporta GPS.');
      setTimeout(() => setGpsStatus(null), 3000);
      return;
    }

    setIsLocating(true);
    setGpsStatus('Obteniendo coordenadas GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 9, { duration: 1.5 });

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: createUserGpsDivIcon(),
            }).addTo(mapInstanceRef.current);
          }
          userMarkerRef.current.bindPopup('<div style="font-size:12px; font-weight:bold; color:#ffffff;">📍 Tu Ubicación Actual</div>').openPopup();
        }

        // Find nearest port
        let nearest = PORTS_DATABASE[0];
        let minDist = Infinity;
        PORTS_DATABASE.forEach(p => {
          const d = Math.hypot(p.lat - latitude, p.lng - longitude);
          if (d < minDist) {
            minDist = d;
            nearest = p;
          }
        });

        setGpsStatus(`Puerto más cercano: ${nearest.name}`);
        setTimeout(() => setGpsStatus(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        console.warn(err);
        setGpsStatus('No se pudo acceder a la ubicación GPS.');
        setTimeout(() => setGpsStatus(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  if (!isOpen && !isEmbedded) return null;

  return (
    <div className={!isFullScreen && isEmbedded ? "w-full min-h-[600px] sm:min-h-[700px] flex-1 flex flex-col animate-fade-in" : `fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-0 ${isFullScreen ? 'p-0' : 'sm:p-4'}`}>
      <div className={!isFullScreen && isEmbedded ? "bg-slate-900 border-t flex-1 border-slate-800 flex flex-col overflow-hidden w-full min-h-[600px] sm:min-h-[700px]" : `bg-slate-900 border border-slate-700/80 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${isFullScreen ? 'w-screen h-screen rounded-none max-w-none max-h-none' : 'rounded-none sm:rounded-2xl w-full h-full sm:h-[85vh] sm:max-w-5xl sm:max-h-[900px]'}`}>
        
        {/* Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isEmbedded && (
              <button
                onClick={onClose}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shrink-0"
                title="Volver a la pantalla anterior"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
            )}
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                Mapa Mundial de Puertos
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Selecciona tu zona costera o explora las estaciones de mareas disponibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEmbedded && (
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold hidden md:flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shadow-md"
                title={isFullScreen ? 'Salir de pantalla completa' : 'Ver mapa en pantalla completa'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span>{isFullScreen ? 'Restaurar' : 'Pantalla Completa'}</span>
              </button>
            )}

            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                onClick={() => setView('mapa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  view === 'mapa' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Mapa</span>
              </button>
              <button
                onClick={() => setView('lista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  view === 'lista' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {!isEmbedded && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-2.5 shrink-0 relative z-30">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar puerto, ría, región o país (ej. Cádiz, Vigo, Miami, Lisboa)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Live Autocomplete Results Dropdown when user is typing */}
            {filterQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-md max-h-56 overflow-y-auto">
                {filteredPorts.length > 0 ? (
                  <div className="py-1 divide-y divide-slate-800/60">
                    {filteredPorts.slice(0, 8).map((port) => (
                      <button
                        key={port.id}
                        onClick={() => {
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([port.lat, port.lng], 10, { duration: 1 });
                          }
                          handlePick(port);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-blue-600/30 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-white truncate">{port.name}</span>
                          <span className="text-[11px] text-slate-400 truncate">({port.region}, {port.country})</span>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-bold shrink-0 ml-2">Ver &rarr;</span>
                      </button>
                    ))}
                    {filteredPorts.length > 8 && (
                      <div className="px-3.5 py-1.5 text-[10px] text-slate-400 bg-slate-950/60 text-center">
                        y {filteredPorts.length - 8} puertos más...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No se encontraron puertos con "{filterQuery}". Intenta con otra ciudad o región.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-0.5">
            {countries.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCountryFilter(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCountryFilter === c
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* View Content */}
        <div className={view === 'mapa' ? 'relative flex-1 w-full h-full min-h-[500px] bg-slate-950 overflow-hidden isolate z-0' : 'hidden'}>
          <div ref={mapContainerRef} className="w-full h-full min-h-[500px] absolute inset-0 z-0" />

          {/* Map Controls Floating Overlay Top-Right */}
          <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center gap-2">
            {/* Fullscreen Toggle Button (Visible on all devices) */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shadow-xl backdrop-blur-md"
              title={isFullScreen ? 'Salir de pantalla completa' : 'Ver mapa en pantalla completa'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullScreen ? 'Restaurar' : 'Pantalla Completa'}</span>
            </button>

            {/* Layer Switcher */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-xl flex items-center gap-1 backdrop-blur-md">
              <Layers className="w-3.5 h-3.5 text-cyan-400 ml-2 mr-1 hidden sm:block" />
              {(['dark', 'satellite', 'streets'] as MapLayerType[]).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setMapLayer(layer)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    mapLayer === layer ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {MAP_LAYERS[layer].name}
                </button>
              ))}
            </div>

            {/* GPS Button */}
            <button
              onClick={handleLocateUser}
              disabled={isLocating}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all cursor-pointer border border-blue-400/50 backdrop-blur-md"
            >
              <Navigation className={`w-3.5 h-3.5 fill-white ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Buscando...' : '📍 GPS'}</span>
            </button>
          </div>

          {/* GPS Toast Status */}
          {gpsStatus && (
            <div className="absolute bottom-4 left-4 z-20 bg-blue-950/90 border border-blue-500/80 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>{gpsStatus}</span>
            </div>
          )}
        </div>

        {view === 'lista' && (
          <div className="p-3 sm:p-4 overflow-y-auto max-h-[60vh] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPorts.map((port) => {
              const isSelected = selectedPort.id === port.id;
              return (
                <a
                  key={port.id}
                  href={buildPortPath(port)}
                  onClick={(e) => { e.preventDefault(); handlePick(port); }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-500 border-l-4 border-l-cyan-400 text-white shadow-lg'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{port.name}</div>
                      <div className="text-xs text-slate-400">{port.region}, {port.country}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span>Lat: {port.lat.toFixed(2)}° | Lng: {port.lng.toFixed(2)}°</span>
                    <span className="text-cyan-400 font-semibold hover:underline">Seleccionar &rarr;</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 px-4">
          <span>{filteredPorts.length} puertos en la base de datos</span>
          <span className="hidden sm:inline text-[11px] text-slate-500">Haz clic en cualquier punto para fijar tu puerto</span>
        </div>

      </div>
    </div>
  );
};
