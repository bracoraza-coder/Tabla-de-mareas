import React, { useState, useRef } from 'react';
import { Map, MapPin, X, Search, List, ZoomIn, ZoomOut } from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';
import { buildPortPath } from '../utils/router';

function lngToX(lng: number) { return ((lng + 180) / 360) * 1000; }
function latToY(lat: number) { return ((90 - lat) / 180) * 500; }

const WorldMapView: React.FC<{ ports: Port[]; selectedPort: Port; onPick: (p: Port) => void }> = ({ ports, selectedPort, onPick }) => {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; startTx: number; startTy: number } | null>(null);
  const pinchRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampScale = (s: number) => Math.max(1, Math.min(6, s));

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => clampScale(s - e.deltaY * 0.0015));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, startTx: tx, startTy: ty };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setTx(dragRef.current.startTx + dx);
    setTy(dragRef.current.startTy + dy);
  };
  const onPointerUp = () => { dragRef.current = null; };

  // Pinch-zoom (two-finger touch)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinchRef.current = d;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current !== null) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = d - pinchRef.current;
      setScale(s => clampScale(s + delta * 0.01));
      pinchRef.current = d;
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden touch-none select-none" ref={containerRef}>
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: 'center center', transition: dragRef.current ? 'none' : 'transform 0.05s linear' }}
        >
          <defs>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c2a4a" />
              <stop offset="100%" stopColor="#08182e" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1000" height="500" fill="url(#ocean)" />
          {/* graticule */}
          {Array.from({ length: 12 }, (_, i) => i * 1000 / 12).map((x, i) => (
            <line key={'v' + i} x1={x} y1={0} x2={x} y2={500} stroke="#1e3a5f" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 6 }, (_, i) => i * 500 / 6).map((y, i) => (
            <line key={'h' + i} x1={0} y1={y} x2={1000} y2={y} stroke="#1e3a5f" strokeWidth="0.5" />
          ))}
          {/* rough continent silhouettes (simplified) */}
          <g fill="#16324f" stroke="#24507d" strokeWidth="1">
            <path d="M120,90 L280,80 L320,150 L260,230 L180,260 L100,200 Z" />{/* N. America */}
            <path d="M220,270 L280,260 L300,400 L240,440 L200,360 Z" />{/* S. America */}
            <path d="M460,60 L560,55 L600,140 L520,160 L470,120 Z" />{/* Europe */}
            <path d="M470,160 L600,150 L640,320 L520,380 L460,280 Z" />{/* Africa */}
            <path d="M600,70 L820,60 L860,220 L700,260 L610,180 Z" />{/* Asia */}
            <path d="M800,300 L900,290 L920,350 L840,370 Z" />{/* Oceania */}
          </g>
          {/* port pins */}
          {ports.map(p => {
            const x = lngToX(p.lng), y = latToY(p.lat);
            const isSel = p.id === selectedPort.id;
            return (
              <g
                key={p.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onPick(p)}
                className="cursor-pointer"
              >
                <circle r={isSel ? 7 : 4.5} fill={isSel ? '#fbbf24' : '#38bdf8'} stroke="#0f172a" strokeWidth="1.2" />
                {isSel && <circle r="12" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button onClick={() => setScale(s => clampScale(s + 0.5))} className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700 text-white flex items-center justify-center"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => setScale(s => clampScale(s - 0.5))} className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700 text-white flex items-center justify-center"><ZoomOut className="w-5 h-5" /></button>
      </div>
      <div className="absolute top-3 left-3 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
        Pellizca o usa la rueda para hacer zoom · Arrastra para mover
      </div>
    </div>
  );
};

interface PortMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPort: Port;
  onSelectPort: (port: Port) => void;
}

export const PortMapModal: React.FC<PortMapModalProps> = ({
  isOpen,
  onClose,
  selectedPort,
  onSelectPort,
}) => {
  if (!isOpen) return null;

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('Todos');
  const [view, setView] = useState<'mapa' | 'lista'>('mapa');

  const countries = ['Todos', 'España', 'Portugal', 'Francia', 'EE. UU.', 'Argentina', 'Chile', 'México'];

  const filteredPorts = PORTS_DATABASE.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCountry = selectedCountryFilter === 'Todos' || p.country === selectedCountryFilter;
    return matchesSearch && matchesCountry;
  });

  const handlePick = (port: Port) => {
    onSelectPort(port);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              Elige tu puerto
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setView(v => v === 'mapa' ? 'lista' : 'mapa')}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              {view === 'mapa' ? <><List className="w-4 h-4" /> Lista</> : <><Map className="w-4 h-4" /> Mapa</>}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {view === 'mapa' ? (
          <div className="flex-1 min-h-[60vh] sm:min-h-[500px]">
            <WorldMapView ports={filteredPorts} selectedPort={selectedPort} onPick={handlePick} />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por puerto, ría o provincia..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {countries.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountryFilter(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                      selectedCountryFilter === c ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPorts.map((port) => {
                const isSelected = selectedPort.id === port.id;
                return (
                  <a
                    key={port.id}
                    href={buildPortPath(port)}
                    onClick={(e) => { e.preventDefault(); handlePick(port); }}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-950 border-blue-500 border-l-4 border-l-blue-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm text-white">{port.name}</div>
                        <div className="text-xs text-slate-400">{port.region}, {port.country}</div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </>
        )}

        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400 shrink-0">
          {filteredPorts.length} puertos disponibles
        </div>

      </div>
    </div>
  );
};
