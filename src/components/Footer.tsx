import React from 'react';
import { Waves, ShieldAlert, BookOpen, Scale, FileText, Lock, Cookie, Anchor } from 'lucide-react';
import { PORTS_DATABASE } from '../data/portsData';
import { Port } from '../types';
import { LegalTab } from './LegalModal';

interface FooterProps {
  onSelectPort: (port: Port) => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectPort, onOpenLegal }) => {
  return (
    <footer className="bg-slate-950 border-t-2 border-slate-800 text-slate-400 text-xs py-10 px-4 mt-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Terminology Guide */}
        <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-blue-600 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Glosario Náutico: Conceptos Clave de Mareas y Pesca</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div>
              <strong className="text-blue-300 block mb-1 uppercase font-mono text-[11px]">Pleamar y Bajamar</strong>
              <p className="text-slate-400">
                <strong>Pleamar</strong> es el nivel máximo que alcanza el mar en el ciclo de marea. <strong>Bajamar</strong> es el nivel mínimo. Se suceden aproximadamente cada 6 horas y 12 minutos.
              </p>
            </div>

            <div>
              <strong className="text-blue-300 block mb-1 uppercase font-mono text-[11px]">Coeficiente de Mareas</strong>
              <p className="text-slate-400">
                Índice entre 30 y 120. Un coeficiente alto (&gt;80) indica <em>Mareas Vivas</em> con mayor diferencia de nivel y corrientes más intensas.
              </p>
            </div>

            <div>
              <strong className="text-blue-300 block mb-1 uppercase font-mono text-[11px]">Tabla Solunar y Períodos</strong>
              <p className="text-slate-400">
                Los <em>Períodos Mayores</em> (~2h) y <em>Menores</em> (~1h) indican los momentos de máxima atracción gravitacional lunar, estimulando la actividad de picadas.
              </p>
            </div>
          </div>
        </div>

        {/* Directory of Ports */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {PORTS_DATABASE.slice(0, 12).map(p => (
            <button
              key={p.id}
              onClick={() => onSelectPort(p)}
              className="text-left text-slate-400 hover:text-blue-300 transition-colors py-1 truncate cursor-pointer font-mono text-[11px]"
            >
              • Mareas {p.name.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Legal & Compliance Navigation Row */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>Cumplimiento Normativo & Privacidad:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={() => onOpenLegal('aviso-legal')}
              className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Aviso Legal</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => onOpenLegal('privacidad')}
              className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Política de Privacidad</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => onOpenLegal('cookies')}
              className="text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Cookie className="w-3.5 h-3.5 text-slate-400" />
              <span>Política de Cookies</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={() => onOpenLegal('terminos-nauticos')}
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Anchor className="w-3.5 h-3.5 text-amber-500" />
              <span>Descargo Náutico</span>
            </button>
          </div>
        </div>

        {/* Technical Station ID Bar & Disclaimer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white uppercase tracking-tight flex items-center gap-2">
                TABLA DE MAREAS PRO <span className="text-[10px] text-slate-400 font-mono">© 2026</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>STATION ID: ESP-CDZ-022</span>
                <span>•</span>
                <span>LAT: 36.52°N</span>
                <span>•</span>
                <span>LONG: 6.28°W</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-bold">CONEXIÓN SATELITAL ACTIVA</span>
            <span className="text-slate-600">|</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Uso recreativo y deportivo.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

