import React, { useEffect, useState } from 'react';
import { Port, TideDayData } from '../types';
import { fetchOfficialTides, parseOfficialTimeToTimestamp } from '../utils/officialTideFetcher';
import { formatZonedHHMM } from '../utils/timezoneHelpers';

interface DebugPanelProps {
  port: Port;
  dayData: TideDayData;
}

/**
 * TEMPORARY diagnostic panel - not for end users. Shows, in plain sight on
 * the page itself, exactly what the official-tide fetch returns and how it
 * gets parsed, so we can compare it directly against what the chart shows
 * without needing devtools or separate API calls. Safe to delete once the
 * official-data pipeline is confirmed working end-to-end.
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({ port, dayData }) => {
  const [raw, setRaw] = useState<any>(null);
  const [parsedAnchors, setParsedAnchors] = useState<{ label: string; timestamp: number; localFormatted: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const runFetch = async () => {
    setLoading(true);
    const result = await fetchOfficialTides(port, dayData.dateStr);
    setRaw(result);
    if (result.ok && result.tides) {
      const parsed = result.tides.map(t => {
        const ts = parseOfficialTimeToTimestamp(t.time, dayData.dateStr, port.timezone);
        return {
          label: `${t.type} ${t.time} (${t.height}m)`,
          timestamp: ts ?? -1,
          localFormatted: ts ? formatZonedHHMM(ts, port.timezone) : 'ERROR AL PARSEAR',
        };
      });
      setParsedAnchors(parsed);
    } else {
      setParsedAnchors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port.id, dayData.dateStr]);

  return (
    <div className="border-4 border-fuchsia-500 bg-fuchsia-950/40 rounded-2xl p-4 space-y-3 text-xs font-mono">
      <div className="flex items-center justify-between">
        <span className="text-fuchsia-300 font-bold text-sm">🔧 PANEL DE DIAGNÓSTICO (temporal)</span>
        <button
          onClick={runFetch}
          className="px-3 py-1 rounded bg-fuchsia-700 text-white font-bold hover:bg-fuchsia-600 cursor-pointer"
        >
          {loading ? 'Consultando...' : 'Volver a consultar /api/mareas'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-fuchsia-300 font-bold">1) Puerto y fecha seleccionados en la web:</div>
          <div className="text-white">id: {port.id} · nombre: {port.name} · fecha: {dayData.dateStr} · huso: {port.timezone}</div>

          <div className="text-fuchsia-300 font-bold mt-2">2) Respuesta CRUDA de /api/mareas ahora mismo:</div>
          <pre className="bg-slate-950 p-2 rounded overflow-x-auto text-emerald-300 whitespace-pre-wrap break-all">
            {raw ? JSON.stringify(raw, null, 2) : 'cargando...'}
          </pre>
        </div>

        <div className="space-y-1">
          <div className="text-fuchsia-300 font-bold">3) Horas ya convertidas a hora local ({port.timezone}):</div>
          {parsedAnchors.length === 0 ? (
            <div className="text-red-400">Sin anclas oficiales parseadas (o fetch falló).</div>
          ) : (
            <ul className="text-white space-y-0.5">
              {parsedAnchors.map((a, i) => (
                <li key={i}>{a.label} → <strong className="text-cyan-300">{a.localFormatted}</strong></li>
              ))}
            </ul>
          )}

          <div className="text-fuchsia-300 font-bold mt-2">4) Lo que el GRÁFICO está usando AHORA MISMO (dayData.highLows):</div>
          <div className="text-white">Fuente actual: <strong className={dayData.tideSource === 'IHM' ? 'text-emerald-400' : 'text-amber-400'}>{dayData.tideSource}</strong> {dayData.tideSourceDetail ? `(${dayData.tideSourceDetail})` : ''}</div>
          <ul className="text-white space-y-0.5">
            {dayData.highLows.map((hl, i) => (
              <li key={i}>{hl.type} {hl.time}h ({hl.height}m)</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
