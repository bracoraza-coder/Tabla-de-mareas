import React, { useState } from 'react';
import { 
  Radio, 
  Fish, 
  Compass, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  Info, 
  HelpCircle,
  Clock,
  Database,
  Search,
  Wind,
  Waves,
  Thermometer,
  ExternalLink
} from 'lucide-react';
import { Port, TideDayData, UserUnits } from '../types';
import { generateStationReport } from '../utils/stationReportEngine';
import { formatZonedHHMM } from '../utils/timezoneHelpers';

interface StationReportProps {
  port: Port;
  dayData: TideDayData;
  units: UserUnits;
}

export const AiAssistant: React.FC<StationReportProps> = ({
  port,
  dayData,
  units,
}) => {
  const [activeTab, setActiveTab] = useState<'pesca' | 'navegacion' | 'origen'>('pesca');
  const [userQuery, setUserQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>(formatZonedHHMM(Date.now(), port.timezone));

  const report = generateStationReport(port, dayData, units, userQuery);

  const quickQuestions = [
    '¿A qué hora exacta conviene salir a pescar hoy?',
    '¿Qué peces y carnadas están activos con esta marea?',
    '¿Es seguro salir a navegar hoy con este viento y oleaje?',
    '¿De dónde provienen los registros y datos de esta marea?',
  ];

  const handleRefresh = () => {
    setLastRefreshed(formatZonedHHMM(Date.now(), port.timezone));
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-blue-600 rounded-2xl p-5 shadow-2xl space-y-5" id="station-bulletin-container">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl shadow-md flex items-center justify-center text-white shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Boletín Met-Oceánico en Vivo
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                SIN IA • DATOS DE ESTACIÓN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Telemetría oficial, físicas armónicas M2/S2 y estación meteorológica para {port.name}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-blue-300 border border-slate-800 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          id="refresh-station-btn"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Actualizado: {lastRefreshed}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pesca')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pesca'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Fish className="w-4 h-4" />
          <span>Dictamen de Pesca (Solunar & Marea)</span>
        </button>

        <button
          onClick={() => setActiveTab('navegacion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'navegacion'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Navegación & Seguridad Náutica</span>
        </button>

        <button
          onClick={() => setActiveTab('origen')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'origen'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Origen & Verificación de Datos</span>
        </button>
      </div>

      {/* Live Executive Summary Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-mono leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white uppercase mr-2">[ESTADO ACTUAL]:</span>
          {report.summary}
        </div>
      </div>

      {/* Tab 1: Fishing Technical Diagnosis */}
      {activeTab === 'pesca' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Solunar & Activity Score */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>ÍNDICE DE PICADA</span>
                <span className="text-amber-400 font-bold">{report.fishingDiagnosis.score} / 5.0</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {report.fishingDiagnosis.activityLevel}
              </div>
              <p className="text-xs text-slate-400">
                Puntuación calculada combinando el coeficiente de marea astronómica y la alineación solunar de Knight.
              </p>
            </div>

            {/* Target Species */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Fish className="w-4 h-4 text-cyan-400" /> ESPECIES RECOMENDADAS HOY
              </div>
              <ul className="text-xs text-slate-200 font-mono space-y-1">
                {report.fishingDiagnosis.recommendedSpecies.map((sp, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-blue-400">•</span>
                    <span>{sp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best Baits */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CARNADAS & SEÑUELOS
              </div>
              <ul className="text-xs text-slate-200 font-mono space-y-1">
                {report.fishingDiagnosis.recommendedBaits.map((bait, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{bait}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Time Windows & Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Ventanas de Máxima Actividad
              </div>
              <ul className="text-xs text-slate-300 font-mono space-y-1.5">
                {report.fishingDiagnosis.bestTimeWindows.map((tw, idx) => (
                  <li key={idx} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-amber-300 font-bold">
                    ⏱ {tw}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase font-mono">
                Estrategia por Coeficiente y Presión
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.fishingDiagnosis.tideStrategy}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-900">
                {report.fishingDiagnosis.pressureImpact}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Navigation & Safety Bulletin */}
      {activeTab === 'navegacion' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase font-mono">ESTADO DE NAVEGACIÓN</div>
              <div className={`text-base font-bold font-mono px-3 py-1.5 rounded-lg border inline-block ${
                report.navigationBulletin.safetyStatus === 'Excelente' 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : report.navigationBulletin.safetyStatus === 'Precaución'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-red-950 text-red-300 border-red-800'
              }`}>
                {report.navigationBulletin.safetyStatus}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 md:col-span-2">
              <div className="text-xs font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> AVISO COSTERO & RECOMENDACIÓN
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {report.navigationBulletin.coastalAdvice}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-400" /> Telemetría de Viento
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {report.navigationBulletin.windSummary}
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-blue-400" /> Mar de Fondo y Oleaje
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {report.navigationBulletin.seaStateDetails}
              </p>
              <p className="text-xs text-blue-300 leading-relaxed font-mono pt-2 border-t border-slate-900">
                {report.navigationBulletin.waveType}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Data Sources Transparency */}
      {activeTab === 'origen' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Transparencia de Datos y Estaciones Meteorológicas
              </h3>
              <p className="text-xs text-slate-400">
                Garantía de origen: Todos los datos son procesados directamente desde estaciones hidrométricas y modelos armónicos físicos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="font-bold text-blue-300 uppercase flex items-center gap-1.5">
                <Waves className="w-4 h-4" /> 1. MAREAS Y NIVEL
              </div>
              <p className="text-slate-300">
                {report.dataSources.tides}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <Wind className="w-4 h-4" /> 2. METEOROLOGÍA & BOYA
              </div>
              <p className="text-slate-300">
                {report.dataSources.weather}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="font-bold text-amber-300 uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 3. EFEMÉRIDES SOLUNARES
              </div>
              <p className="text-slate-300">
                {report.dataSources.solunar}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-xs font-mono space-y-1.5 text-slate-400">
            <div className="text-white font-bold flex items-center gap-2">
              <span>📍 ESTACIÓN MAREOGRÁFICA ACTIVA:</span>
              <span className="text-blue-300">{report.stationInfo.name}</span>
            </div>
            <div>Coordenadas GPS: {report.stationInfo.coordinates}</div>
            <div>Modelo Mareográfico: {report.stationInfo.tideModel}</div>
            <div>Última sincronización de telemetría: {report.stationInfo.lastUpdate}</div>
          </div>
        </div>
      )}

      {/* Quick Topic Filter Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase font-mono">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> CONSULTAS RÁPIDAS DE LA ESTACIÓN:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUserQuery(q);
                if (q.includes('navegar')) setActiveTab('navegacion');
                else if (q.includes('origen')) setActiveTab('origen');
                else setActiveTab('pesca');
              }}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
