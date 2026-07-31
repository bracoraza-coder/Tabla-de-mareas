import React from 'react';
import { Droplets, LineChart, Waves, Moon, Wind, CalendarDays } from 'lucide-react';

interface QuickNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
}

const ITEMS: QuickNavItem[] = [
  { id: 'current-tide-gauge', label: 'Marea Ahora', icon: <Droplets className="w-3.5 h-3.5" />, accent: 'hover:text-blue-300 hover:border-blue-700' },
  { id: 'tide-chart-section', label: 'Gráfico de Mareas', icon: <LineChart className="w-3.5 h-3.5" />, accent: 'hover:text-blue-300 hover:border-blue-700' },
  { id: 'surf-section', label: 'Surf y Olas', icon: <Waves className="w-3.5 h-3.5" />, accent: 'hover:text-emerald-300 hover:border-emerald-700' },
  { id: 'solunar-section', label: 'Pesca y Solunar', icon: <Moon className="w-3.5 h-3.5" />, accent: 'hover:text-purple-300 hover:border-purple-700' },
  { id: 'weather-section', label: 'Meteorología', icon: <Wind className="w-3.5 h-3.5" />, accent: 'hover:text-cyan-300 hover:border-cyan-700' },
  { id: 'monthly-table-section', label: 'Calendario Mensual', icon: <CalendarDays className="w-3.5 h-3.5" />, accent: 'hover:text-amber-300 hover:border-amber-700' },
];

export const QuickNav: React.FC = () => {
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="Acceso rápido a secciones"
      className="bg-slate-900/60 border-b border-slate-800 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono shrink-0 hidden sm:inline">Ir a:</span>
        {ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => scrollToId(item.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-950 border border-slate-800 text-slate-300 transition-colors cursor-pointer whitespace-nowrap ${item.accent}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
