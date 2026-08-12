import React, { useState, useEffect } from 'react';
import { TideDayData, Port, MarineWeather } from '../types';
import { Fish, Compass, BookOpen, Plus, Trash2, ShieldAlert, Sparkles, Award, Clock, Thermometer, Anchor, Scale } from 'lucide-react';

interface ProfessionalFishingSuiteProps {
  dayData: TideDayData;
  weather: MarineWeather;
  port: Port;
}

interface CatchRecord {
  id: string;
  species: string;
  weightKg: number;
  lengthCm: number;
  baitUsed: string;
  tideState: string;
  timeStr: string;
  dateStr: string;
  notes: string;
}

export const ProfessionalFishingSuite: React.FC<ProfessionalFishingSuiteProps> = ({ dayData, weather, port }) => {
  const { solunar, highLows, coefficient, currentTideState } = dayData;

  // Catch log state stored in localStorage
  const [catches, setCatches] = useState<CatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mareas_catch_log');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: '1',
        species: 'Lubina (Robalo)',
        weightKg: 2.4,
        lengthCm: 58,
        baitUsed: 'Vinilo ragot blanco',
        tideState: 'Pleamar (Entrada)',
        timeStr: '07:30',
        dateStr: new Date().toISOString().split('T')[0],
        notes: 'Capturada en rompiente con mar de fondo moderado y coeficiente 78.',
      },
      {
        id: '2',
        species: 'Dorada',
        weightKg: 1.6,
        lengthCm: 45,
        baitUsed: 'Tanga / Cangrejo vivo',
        tideState: 'Bajamar',
        timeStr: '14:15',
        dateStr: new Date().toISOString().split('T')[0],
        notes: 'Fondo de arena y roca, excelente pique en período mayor solunar.',
      },
    ];
  });

  const [isAddingCatch, setIsAddingCatch] = useState(false);
  const [newSpecies, setNewSpecies] = useState('Lubina');
  const [newWeight, setNewWeight] = useState('1.5');
  const [newLength, setNewLength] = useState('45');
  const [newBait, setNewBait] = useState('Vinilo / Gusana');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('mareas_catch_log', JSON.stringify(catches));
    } catch {
      // ignore
    }
  }, [catches]);

  const handleAddCatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: CatchRecord = {
      id: Date.now().toString(),
      species: newSpecies,
      weightKg: parseFloat(newWeight) || 1.0,
      lengthCm: parseFloat(newLength) || 40,
      baitUsed: newBait || 'Cebo natural',
      tideState: currentTideState,
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: new Date().toISOString().split('T')[0],
      notes: newNotes || 'Sin notas adicionales',
    };
    setCatches([newRecord, ...catches]);
    setIsAddingCatch(false);
    setNewNotes('');
  };

  const handleDeleteCatch = (id: string) => {
    setCatches(catches.filter(c => c.id !== id));
  };

  // Coastal Species Recommendations based on region & conditions
  const targetSpecies = [
    {
      name: 'Lubina (Dicentrarchus labrax)',
      habitat: 'Rompientes, desembocaduras y espuma',
      bestTide: 'Creciente hacia Pleamar (1h antes y 1h después)',
      bestBait: 'Vinilos, paseantes de superficie, cangrejo',
      probability: coefficient > 70 ? 'Muy Alta' : 'Moderada',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      name: 'Dorada (Sparus aurata)',
      habitat: 'Fondos mixtos arena/roca y rías',
      bestTide: 'Pleamar y primera hora de bajada',
      bestBait: 'Cangrejo verde, americana, tita',
      probability: dayData.solunar.activityScore > 75 ? 'Alta' : 'Moderada',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      name: 'Sargo Común (Diplodus sargus)',
      habitat: 'Zonas rocosas, acantilados y puertos',
      bestTide: 'Pico de Pleamar con oleaje moderado',
      bestBait: 'Gusana de playa, mejillón, gamba',
      probability: 'Muy Alta',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      name: 'Calamar (Loligo vulgaris)',
      habitat: 'Puertos iluminados y fondos de piedra (3-20m)',
      bestTide: 'Ocaso / Noche cerrada con poca luna',
      bestBait: 'Pajaritas / Jibioneras fosforescentes',
      probability: solunar.illuminationPercent < 40 ? 'Excelente (Noche)' : 'Baja (Luna llena)',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      name: 'Pulpo de Roca (Octopus vulgaris)',
      habitat: 'Fondos rocosos poco profundos',
      bestTide: 'Bajamar grande (Coeficiente alto)',
      bestBait: 'Cangrejo artificial / Potera',
      probability: coefficient > 80 ? 'Excelente' : 'Normal',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
  ];

  // Calculate Golden Bite Windows (Intersection of Solunar Major periods with High/Low Tide turns)
  const goldenWindows = solunar.majorPeriods.map((major, idx) => {
    return {
      timeRange: `${major.start} - ${major.end}`,
      type: idx === 0 ? 'Ventana Matutina (Tránsito Superior)' : 'Ventana Vespertina (Tránsito Inferior)',
      intensity: '★★★★★ (Máxima Actividad Biológica)',
      advice: 'Coincide con la elevación cenital lunar y corriente de marea óptima. Prepare los cebos.',
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Professional Fishing Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Suite Profesional de Pesca Deportiva
            </span>
            <span className="text-xs text-slate-400 font-mono">Puerto: {port.name}</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Análisis Biológico, Especies y Diario de Capturas
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Algoritmo avanzado de predicción de picada basado en coeficientes de marea ({coefficient}), presión atmosférica ({weather.pressureHpa} hPa), temperatura del agua ({weather.waterTemp}°C) y efemérides solunares de John Alden Knight.
          </p>
        </div>

        <button
          onClick={() => setIsAddingCatch(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Registrar Captura
        </button>
      </div>

      {/* Golden Windows & Environmental Factors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Factor 1: Coeficiente & Marea */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Coeficiente Marea</span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${coefficient >= 80 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
              {coefficient >= 90 ? 'Marea Viva Extrema' : coefficient >= 80 ? 'Marea Viva' : coefficient >= 60 ? 'Marea Media' : 'Marea Muerta'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{coefficient}</span>
            <span className="text-xs text-slate-400">/ 120</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {coefficient >= 80 
              ? 'Corrientes fuertes. Los depredadores se activan en puntas de roca y rías buscando alimento arrastrado.'
              : 'Corrientes suaves. Ideal para pesca a fondo en estuarios y calmados con cebo fino.'}
          </p>
        </div>

        {/* Factor 2: Presión & Vejiga Natatoria */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Presión Barométrica</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              {weather.pressureTrend === 'ascenso' ? '↑ En Alza' : weather.pressureTrend === 'descenso' ? '↓ En Baja' : '→ Estable'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{weather.pressureHpa}</span>
            <span className="text-xs text-slate-400 font-mono">hPa</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {weather.pressureHpa > 1018 
              ? 'Alta presión estable. Los peces tienden a bajar a capas más profundas y comer con menor voracidad.'
              : 'Presión baja/favorable. Los peces sienten alivio en su vejiga natatoria y suben a cazar activamente.'}
          </p>
        </div>

        {/* Factor 3: Temperatura del Agua */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Temperatura Agua</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              Termoclina Óptima
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{weather.waterTemp}°C</span>
            <span className="text-xs text-slate-400 font-mono">Mar Costero</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Temperatura idónea para la costa atlántico-mediterránea. Actividad metabólica alta en especies de roca y arena.
          </p>
        </div>

      </div>

      {/* Golden Bite Windows Details */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Ventanas de Oro de Picada (Solunar + Marea)
            </h4>
          </div>
          <span className="text-xs font-mono text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800">
            {goldenWindows.length} Ventanas Clave Hoy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goldenWindows.map((gw, i) => (
            <div key={i} className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  {gw.timeRange}
                </span>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  {gw.intensity}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                <strong>{gw.type}</strong>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {gw.advice}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Target Species Guide Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Guía de Especies Objetivo & Probabilidad de Captura
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">Basado en estación y marea</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Especie</th>
                <th className="p-3">Hábitat / Zona</th>
                <th className="p-3">Marea Recomendada</th>
                <th className="p-3">Cebo / Artificial</th>
                <th className="p-3 text-right">Probabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {targetSpecies.map((sp, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {sp.name}
                  </td>
                  <td className="p-3 text-slate-300">{sp.habitat}</td>
                  <td className="p-3 text-slate-300">{sp.bestTide}</td>
                  <td className="p-3 text-amber-300 font-mono">{sp.bestBait}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold ${sp.color}`}>
                      {sp.probability}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diario de Capturas (Catch Notebook) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Diario de Capturas del Pescador ({catches.length})
            </h4>
          </div>
          <button
            onClick={() => setIsAddingCatch(true)}
            className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Entrada
          </button>
        </div>

        {catches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {catches.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 relative group">
                <button
                  onClick={() => handleDeleteCatch(c.id)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 transition-colors p-1"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Scale className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-sm">{c.species}</h5>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {c.dateStr} a las {c.timeStr} ({c.tideState})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div>Peso: <strong className="text-amber-300">{c.weightKg} kg</strong></div>
                  <div>Talla: <strong className="text-cyan-300">{c.lengthCm} cm</strong></div>
                  <div className="col-span-2 truncate">Cebo: <span className="text-slate-200">{c.baitUsed}</span></div>
                </div>

                {c.notes && (
                  <p className="text-xs text-slate-400 italic">
                    "{c.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No hay capturas registradas en tu diario. Haz clic en "Registrar Captura" para guardar tus trofeos de pesca.
          </div>
        )}
      </div>

      {/* Modal / Form to Add Catch */}
      {isAddingCatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Fish className="w-5 h-5 text-amber-400" /> Registrar Nueva Captura
              </h3>
              <button
                onClick={() => setIsAddingCatch(false)}
                className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Especie:</label>
                <select
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="Lubina (Robalo)">Lubina (Robalo)</option>
                  <option value="Dorada">Dorada</option>
                  <option value="Sargo Común">Sargo Común</option>
                  <option value="Calamar">Calamar</option>
                  <option value="Pulpo de Roca">Pulpo de Roca</option>
                  <option value="Merluza">Merluza</option>
                  <option value="Corvina">Corvina</option>
                  <option value="Congrio">Congrio</option>
                  <option value="Otra Especie">Otra Especie</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Peso (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Talla (cm):</label>
                  <input
                    type="number"
                    value={newLength}
                    onChange={(e) => setNewLength(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Cebo o Artificial Utilizado:</label>
                <input
                  type="text"
                  value={newBait}
                  onChange={(e) => setNewBait(e.target.value)}
                  placeholder="Ej. Vinilo ragot, cangrejo vivo, rapala..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Notas / Observaciones:</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Estado de la mar, viento, ría o espigón exacto..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCatch(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Guardar en Diario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
