import React from 'react';
import { LineChart, Waves, Moon, Wind, CalendarDays } from 'lucide-react';

export type TabKey = 'grafico' | 'surf' | 'pesca' | 'meteo' | 'calendario';

interface QuickNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const ITEMS: { 
  id: TabKey; 
  label: string; 
  icon: React.ReactNode;
  activeClass: string;
  inactiveClass: string;
}[] = [
  { 
    id: 'grafico', 
    label: 'Mareas', 
    icon: <LineChart className="w-4 h-4 sm:w-5 sm:h-5" />,
    activeClass: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border-cyan-300 ring-2 ring-cyan-400/40 font-black scale-105',
    inactiveClass: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/50 hover:text-cyan-200'
  },
  { 
    id: 'surf', 
    label: 'Surf', 
    icon: <Waves className="w-4 h-4 sm:w-5 sm:h-5" />,
    activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-300 ring-2 ring-emerald-400/40 font-black scale-105',
    inactiveClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50 hover:text-emerald-200'
  },
  { 
    id: 'pesca', 
    label: 'Pesca', 
    icon: <Moon className="w-4 h-4 sm:w-5 sm:h-5" />,
    activeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 border-amber-300 ring-2 ring-amber-400/40 font-black scale-105',
    inactiveClass: 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50 hover:text-amber-200'
  },
  { 
    id: 'meteo', 
    label: 'Tiempo', 
    icon: <Wind className="w-4 h-4 sm:w-5 sm:h-5" />,
    activeClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border-purple-300 ring-2 ring-purple-400/40 font-black scale-105',
    inactiveClass: 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/50 hover:text-purple-200'
  },
  { 
    id: 'calendario', 
    label: 'Calendario', 
    icon: <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />,
    activeClass: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/30 border-rose-300 ring-2 ring-rose-400/40 font-black scale-105',
    inactiveClass: 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50 hover:text-rose-200'
  },
];

export const QuickNav: React.FC<QuickNavProps> = ({ active, onChange }) => {
  return (
    <nav 
      aria-label="Secciones del puerto" 
      className="bg-slate-950/80 py-1 sm:py-1.5 px-1 sm:px-2 rounded-xl border border-slate-800/80 shadow-inner my-1 transition-all"
      id="sticky-main-quicknav"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-5 gap-1 sm:gap-2">
        {ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 px-1 sm:py-1.5 sm:px-2.5 rounded-lg border text-[10px] sm:text-xs tracking-tight transition-all cursor-pointer font-bold select-none ${
                isActive ? item.activeClass : item.inactiveClass
              }`}
              id={`nav-tab-${item.id}`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

