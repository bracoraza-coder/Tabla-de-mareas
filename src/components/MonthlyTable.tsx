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
  Filter
} from 'lucide-react';
import { Port, MonthlyTideRow, UserUnits } from '../types';
import { getMonthlyTideData } from '../utils/tideEngine';
import { fetchMonthlyIhmTides } from '../utils/ihmFetcher';

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
    let isMounted = true;
    const initialData = getMonthlyTideData(port, currentYear, currentMonth);
    setRows(initialData);

    fetchMonthlyIhmTides(port, currentYear, currentMonth, initialData).then(finalData => {
      if (isMounted) {
        setRows(finalData);
      }
    });

    return () => {
      isMounted = false;
    };
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

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Fecha', 'Día', 'Coeficiente', 'Pleamares', 'Bajamares', 'Fase Lunar', 'Índice Solunar', 'Amanecer', 'Atardecer'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        r.dateStr,
        r.dayName,
        r.coefficient,
        `"${r.highTidesStr}"`,
        `"${r.lowTidesStr}"`,
        `"${r.moonPhaseName}"`,
        `${r.solunarScore}/5`,
        r.sunrise,
        r.sunset
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tabla_mareas_${port.id}_${monthsEs[currentMonth]}_${currentYear}.csv`);
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
            Calendario oficial de pleamares, bajamares y coeficientes astronómicos para {port.name}
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

      {/* Filter search bar */}
      <div className="flex items-center gap-2 max-w-xs print:hidden">
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

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
          <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider text-[11px] font-mono">
            <tr>
              <th className="py-3 px-3">FECHA</th>
              <th className="py-3 px-3 text-center">COEF.</th>
              <th className="py-3 px-3">PLEAMARES (HORA & ALTURA)</th>
              <th className="py-3 px-3">BAJAMARES (HORA & ALTURA)</th>
              <th className="py-3 px-3">FASE LUNAR</th>
              <th className="py-3 px-3 text-center">SOLUNAR</th>
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
                  className={`hover:bg-slate-800 transition-colors cursor-pointer ${
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
