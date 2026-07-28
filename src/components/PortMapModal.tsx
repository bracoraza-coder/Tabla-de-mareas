import React, { useState } from 'react';
import { Map, MapPin, X, Globe, Search, Anchor, Compass } from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/portsData';

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

  const countries = ['Todos', 'España', 'Portugal', 'Francia', 'EE. UU.', 'Argentina', 'Chile', 'México'];

  const filteredPorts = PORTS_DATABASE.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCountry = selectedCountryFilter === 'Todos' || p.country === selectedCountryFilter;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Catálogo Global de Puertos y Estaciones
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Selecciona la estación maregráfica de referencia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por puerto, ría o provincia..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {countries.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCountryFilter(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCountryFilter === c
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Port Grid List */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPorts.map((port) => {
            const isSelected = selectedPort.id === port.id;
            return (
              <button
                key={port.id}
                onClick={() => {
                  onSelectPort(port);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                  isSelected
                    ? 'bg-blue-950 border-blue-500 border-l-4 border-l-blue-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-blue-200">
                        {port.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {port.region}, {port.country}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] bg-blue-500 text-white font-black px-2 py-0.5 rounded font-mono">
                      SELECCIONADO
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                  <span>Coord: {port.lat.toFixed(2)}°, {port.lng.toFixed(2)}°</span>
                  <span className="text-blue-300 font-bold">Marea: {port.amplitude}m</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          Mostrando {filteredPorts.length} puertos marítimos oficiales.
        </div>

      </div>
    </div>
  );
};
