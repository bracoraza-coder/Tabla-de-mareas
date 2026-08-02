import React from 'react';
import { LineChart, Waves, Moon, Wind, CalendarDays } from 'lucide-react';

export type TabKey = 'grafico' | 'surf' | 'pesca' | 'meteo' | 'calendario';

interface QuickNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const ITEMS: { id: TabKey; label: string; icon: React.ReactNode }[] = [
  { id: 'grafico', label: 'Mareas', icon: <LineChart className="w-5 h-5" /> },
  { id: 'surf', label: 'Surf', icon: <Waves className="w-5 h-5" /> },
  { id: 'pesca', label: 'Pesca', icon: <Moon className="w-5 h-5" /> },
  { id: 'meteo', label: 'Tiempo', icon: <Wind className="w-5 h-5" /> },
  { id: 'calendario', label: 'Calendario', icon: <CalendarDays className="w-5 h-5" /> },
];

export const QuickNav: React.FC<QuickNavProps> = ({ active, onChange }) => {
  return (
    <nav aria-label="Secciones" className="bg-slate-900/60 border-b border-slate-800 sticky top-[52px] z-30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-2 grid grid-cols-5">
        {ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-bold border-b-4 transition-colors cursor-pointer ${
              active === item.id
                ? 'border-blue-500 text-blue-400 bg-blue-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
