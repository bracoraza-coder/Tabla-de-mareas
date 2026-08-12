import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Printer, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  LineChart,
  Navigation
} from 'lucide-react';
import { Port, MonthlyTideRow, UserUnits } from '../types';
import { getMonthlyTideData } from '../utils/tideEngine';

interface MonthlyTableProps {
  port: Port;
  units: UserUnits;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = ({
  port,
  units,
  selectedDate,
  onSelectDate,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(selectedDate.getMonth());
  const [searchFilter, setSearchFilter] = useState('');
  const [rows, setRows] = useState<MonthlyTideRow[]>([]);

  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    const data = getMonthlyTideData(port, currentYear, currentMonth);
    setRows(data);
  }, [port, currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const filteredRows = rows.filter(r => 
    r.dayNumber.toString().includes(searchFilter) ||
    r.dayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.moonPhaseName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // CSV Export with UTF-8 BOM for Excel/PowerBI compatibility
  const handleExportCSV = () => {
    const headers = [
      'Puerto',
      'Fecha',
      'Día de la Semana',
      'Coeficiente de Marea',
      'Pleamares (Hora y Altura)',
      'Bajamares (Hora y Altura)',
      'Fase Lunar',
      'Iluminación Lunar (%)',
      'Índice Solunar (/5)',
      'Amanecer',
      'Atardecer'
    ];

    const csvLines = [
      headers.join(','),
      ...rows.map(r => [
        `"${port.name.replace(/"/g, '""')}"`,
        r.dateStr,
        r.dayName,
        r.coefficient,
        `"${r.highTidesStr.replace(/"/g, '""')}"`,
        `"${r.lowTidesStr.replace(/"/g, '""')}"`,
        `"${r.moonPhaseName.replace(/"/g, '""')}"`,
        r.moonIlluminationPct,
        `${r.solunarScore}/5`,
        r.sunrise,
        r.sunset
      ].join(','))
    ];

    // Prepend UTF-8 BOM (\uFEFF)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `InfoMarea_Tabla_30dias_${port.id}_${monthsEs[currentMonth]}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-4 border-l-blue-600 rounded-2xl p-5 shadow-2xl space-y-5 print:bg-white print:text-black">
      
      {/* Table Title Bar & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Tabla Mensual de Mareas - {monthsEs[currentMonth]} {currentYear}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Calendario estimado de pleamares, bajamares y coeficientes astronómicos para {port.name}
          </p>
        </div>

        {/* Month Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-blue-300 px-3 font-mono">
              {monthsEs[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="export-csv-btn"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="print-table-btn"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Imprimir</span>
          </button>

        </div>
      </div>

      {/* Filter search bar & info hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 max-w-xs w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por día o fase lunar..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="text-xs text-cyan-300 bg-cyan-950/70 border border-cyan-800/80 px-3 py-1.5 rounded-xl flex items-center gap-2 font-mono">
          <LineChart className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Haz clic en cualquier casilla de día para ver su gráfica de mareas</span>
        </div>
      </div>

      {/* Mobile Touch Scroll Banner Hint for Table */}
      <div className="sm:hidden flex items-center justify-between bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl text-[11px] text-cyan-300 font-mono my-2">
        <span className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          Desliza lateralmente para ver todas las columnas
        </span>
        <span className="text-[10px] text-slate-400 font-bold">Tabla Mensual</span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 touch-pan-x custom-scrollbar">
        <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
          <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider text-[11px] font-mono">
            <tr>
              <th className="py-3 px-3">FECHA</th>
              <th className="py-3 px-3 text-center">COEF.</th>
              <th className="py-3 px-3">PLEAMARES (HORA & ALTURA)</th>
              <th className="py-3 px-3">BAJAMARES (HORA & ALTURA)</th>
              <th className="py-3 px-3">FASE LUNAR</th>
              <th className="py-3 px-3 text-center">SOLUNAR</th>
              <th className="py-3 px-3 text-center">GRÁFICA</th>
              <th className="py-3 px-3 text-right">SOL (SALIDA / PUESTA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-medium">
            {filteredRows.map((row) => {
              const isSelectedDay = 
                selectedDate.getDate() === row.dayNumber &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              let coeffColor = 'text-slate-300';
              if (row.coefficient >= 85) coeffColor = 'text-emerald-400 font-bold';
              else if (row.coefficient <= 45) coeffColor = 'text-amber-400 font-bold';

              return (
                <tr
                  key={row.dateStr}
                  onClick={() => onSelectDate(new Date(currentYear, currentMonth, row.dayNumber, 12))}
                  title="Haz clic para ver la gráfica de mareas de este día"
                  className={`hover:bg-slate-800 transition-colors cursor-pointer group ${
                    isSelectedDay ? 'bg-blue-950/80 border-l-4 border-blue-500 font-semibold text-white' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded bg-slate-950 border border-slate-700 flex items-center justify-center text-xs font-mono text-blue-300">
                        {row.dayNumber}
                      </span>
                      <span>{row.dayName}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono text-sm whitespace-nowrap">
                    <span className={coeffColor}>{row.coefficient}</span>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-blue-300">
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{row.highTidesStr}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-300">
                    <div className="flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{row.lowTidesStr}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{row.moonPhaseIcon}</span>
                      <span className="text-slate-300 text-xs">{row.moonPhaseName}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-amber-300 font-mono text-xs">{row.solunarScore}/5</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all group-hover:scale-105 group-hover:border-cyan-400">
                      <LineChart className="w-3 h-3 text-cyan-400" /> Ver ➔
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-xs whitespace-nowrap">
                    {row.sunrise} - {row.sunset}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
