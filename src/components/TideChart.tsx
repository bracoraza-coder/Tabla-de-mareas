import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Waves, Clock, ArrowUpRight, ArrowDownRight, Radio } from 'lucide-react';
import { TideDayData, Port, UserUnits } from '../types';
import { getZonedFractionalHours, formatZonedHHMM, getUtcOffsetLabel, getZoneAbbreviation } from '../utils/timezoneHelpers';

interface TideChartProps {
  dayData: TideDayData;
  port: Port;
  units: UserUnits;
}

export const TideChart: React.FC<TideChartProps> = ({
  dayData,
  port,
  units,
}) => {
  const [hoursRange, setHoursRange] = useState<24 | 48>(24);

  const formatHeight = (meters: number) => {
    if (units.height === 'ft') {
      return (meters * 3.28084).toFixed(2);
    }
    return meters.toFixed(2);
  };

  const heightUnitLabel = units.height === 'ft' ? 'ft' : 'm';

  // Prepare chart data & merge exact High/Low tide timestamps
  const highLowMap = new Map<string, { type: 'pleamar' | 'bajamar'; height: number; time: string }>();
  dayData.highLows.forEach(hl => {
    highLowMap.set(hl.time, hl);
  });

  const basePoints = dayData.hourlyPoints.map(pt => {
    const heightVal = units.height === 'ft' ? pt.height * 3.28084 : pt.height;
    const hl = highLowMap.get(pt.time);
    return {
      time: pt.time,
      height: Math.round(heightVal * 100) / 100,
      timestamp: pt.timestamp,
      isHighLow: !!hl,
      highLowType: hl?.type,
    };
  });

  // Inject exact High/Low points if not already on exact hourly/half-hourly ticks
  dayData.highLows.forEach(hl => {
    if (!basePoints.some(p => p.time === hl.time)) {
      const heightVal = units.height === 'ft' ? hl.height * 3.28084 : hl.height;
      basePoints.push({
        time: hl.time,
        height: Math.round(heightVal * 100) / 100,
        timestamp: hl.timestamp,
        isHighLow: true,
        highLowType: hl.type,
      });
    }
  });

  // Chronologically sorted chart data
  const chartData = basePoints.sort((a, b) => a.timestamp - b.timestamp);

  // Give the Y axis extra headroom above/below the real min/max so that the
  // high/low tide time badges (which float above/below their dot) always
  // have room to render fully inside the chart's drawing area, instead of
  // being clipped by the SVG canvas edge when a peak sits right at the top
  // or bottom of the curve.
  const heightValues = chartData.map(d => d.height);
  const dataMinHeight = heightValues.length ? Math.min(...heightValues) : 0;
  const dataMaxHeight = heightValues.length ? Math.max(...heightValues) : 1;
  const heightRange = dataMaxHeight - dataMinHeight || 1;
  const yAxisPadding = Math.max(heightRange * 0.22, 0.35);
  const yAxisDomain: [number, number] = [
    Math.round((dataMinHeight - yAxisPadding) * 100) / 100,
    Math.round((dataMaxHeight + yAxisPadding) * 100) / 100,
  ];

  // Current time finding - using the PORT'S own local time, not the
  // visitor's browser clock, so the "AHORA" marker lands on the right
  // point of the curve regardless of where in the world the visitor is.
  const now = new Date();
  const nowMs = now.getTime();
  const portFractionalHours = getZonedFractionalHours(nowMs, port.timezone);
  const currentMinutesTotal = portFractionalHours * 60;

  const currentPoint = chartData.length > 0
    ? chartData.reduce((prev, curr) => {
        const [pH, pM] = prev.time.split(':').map(Number);
        const [cH, cM] = curr.time.split(':').map(Number);
        const prevDiff = Math.abs((pH * 60 + (pM || 0)) - currentMinutesTotal);
        const currDiff = Math.abs((cH * 60 + (cM || 0)) - currentMinutesTotal);
        return currDiff < prevDiff ? curr : prev;
      }, chartData[0])
    : null;

  // Custom Recharts Dot renderer for Live Position and Exact High/Low Tides
  const renderCustomDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps;
    if (!payload || cx == null || cy == null) return null;

    const isLiveNow = currentPoint && payload.time === currentPoint.time;
    const isHighLow = !!payload.isHighLow;

    if (!isLiveNow && !isHighLow) return null;

    const nowTimeStr = formatZonedHHMM(nowMs, port.timezone);

    // When "now" happens to land on (or very near) an actual high/low tide
    // point - which happens often, since a real tide event is exactly the
    // kind of moment people check - both badges need to render. Otherwise
    // the live marker silently swallows the tide time label underneath it.
    const liveBadgeYOffset = isHighLow ? -46 : -26;

    return (
      <g key={`dot-${payload.time}`}>
        {isLiveNow && (
          <g>
            <circle cx={cx} cy={cy} r={16} className="fill-emerald-400 opacity-70 animate-ping" />
            <circle cx={cx} cy={cy} r={9} className="fill-emerald-500 opacity-50 animate-pulse" />
            <circle cx={cx} cy={cy} r={5.5} fill="#22c55e" stroke="#ffffff" strokeWidth={2} />
            <g transform={`translate(${cx}, ${cy + liveBadgeYOffset})`}>
              <rect x="-46" y="-12" width="92" height="21" rx="5" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
              <text x="0" y="2" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
                AHORA {nowTimeStr}h
              </text>
            </g>
          </g>
        )}

        {isHighLow && (() => {
          const isPleamar = payload.highLowType === 'pleamar';
          const formattedHeight = `${payload.height}${heightUnitLabel}`;
          const baseYOffset = isPleamar ? -20 : 20;
          const badgeBg = isPleamar ? '#1e3a8a' : '#451a03';
          const badgeBorder = isPleamar ? '#3b82f6' : '#f59e0b';
          const textColor = isPleamar ? '#bfdbfe' : '#fef08a';
          const arrowSymbol = isPleamar ? '▲' : '▼';
          const labelText = `${arrowSymbol} ${payload.time}h (${formattedHeight})`;
          const textLen = labelText.length;
          const badgeWidth = Math.max(70, textLen * 5.7 + 8);
          const halfWidth = badgeWidth / 2;

          if (!isLiveNow) {
            return (
              <>
                <circle cx={cx} cy={cy} r={4.5} fill={isPleamar ? '#3b82f6' : '#f59e0b'} stroke="#ffffff" strokeWidth={1.8} />
                <g transform={`translate(${cx}, ${cy + baseYOffset})`}>
                  <rect x={-halfWidth} y="-9" width={badgeWidth} height="18" rx="4" fill={badgeBg} stroke={badgeBorder} strokeWidth="1" opacity="0.95" />
                  <text x="0" y="3" textAnchor="middle" fill={textColor} fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                    {labelText}
                  </text>
                </g>
              </>
            );
          }
          // Both markers on the same point: push the tide badge further out
          // (below the pulsing live dot) so it never overlaps the "AHORA" box.
          const sharedYOffset = isPleamar ? -70 : 30;
          return (
            <g transform={`translate(${cx}, ${cy + sharedYOffset})`}>
              <rect x={-halfWidth} y="-9" width={badgeWidth} height="18" rx="4" fill={badgeBg} stroke={badgeBorder} strokeWidth="1" opacity="0.95" />
              <text x="0" y="3" textAnchor="middle" fill={textColor} fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
                {labelText}
              </text>
            </g>
          );
        })()}
      </g>
    );
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isNow = data.time === currentPoint?.time;
      return (
        <div className="bg-slate-900 border border-cyan-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold border-b border-slate-800 pb-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Hora: {label} h</span>
            </div>
            {isNow && (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-700">
                AQUÍ AHORA
              </span>
            )}
          </div>
          <div className="text-white text-base font-black font-mono">
            Marea: {data.height} {heightUnitLabel}
          </div>
          <div className="text-slate-400 text-[11px]">
            Puerto: {port.name}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="tide-chart-section" className="bg-slate-900 border border-slate-800 border-l-4 border-l-blue-600 rounded-2xl p-5 shadow-2xl scroll-mt-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Waves className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Gráfico de Mareas
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">HOY {dayData.dateStr}</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>POSICIÓN ACTUAL {currentPoint ? `(${currentPoint.time}h)` : ''}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Curva hidrométrica armónica continua con indicador temporal en vivo (punto verde parpadeante) · Todas las horas en <strong className="text-slate-300">hora local de {port.name.split(' (')[0]}</strong> ({getZoneAbbreviation(Date.now(), port.timezone)}, {getUtcOffsetLabel(Date.now(), port.timezone)})
          </p>
          {dayData.tideSource === 'IHM' ? (
            <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
              <span>✓</span>
              <span>
                Horarios de pleamar/bajamar de la estación oficial <strong className="text-emerald-300">{dayData.tideSourceDetail || 'IHM'}</strong> (Instituto Hidrográfico de la Marina). La curva entre puntos es una interpolación visual.
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <span>⚠</span>
              <span>
                Modelo astronómico de aproximación, no oficial. Verifica siempre los horarios en la{' '}
                <a
                  href="https://armada.defensa.gob.es/ihm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-amber-300 hover:text-amber-200"
                >
                  web oficial del Instituto Hidrográfico de la Marina
                </a>
                {' '}antes de cualquier actividad donde la precisión sea crítica.
              </span>
            </p>
          )}
        </div>

        {/* Range Controls & Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-800 rounded">PLEAMAR</span>
            <span className="px-2.5 py-1 bg-slate-950 text-slate-400 border border-slate-800 rounded">BAJAMAR</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setHoursRange(24)}
              className={`px-2.5 py-1 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                hoursRange === 24 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              24H
            </button>
            <button
              onClick={() => setHoursRange(48)}
              className={`px-2.5 py-1 rounded font-bold text-[11px] transition-colors cursor-pointer ${
                hoursRange === 48 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              48H
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Area Chart */}
      <div className="w-full h-72 sm:h-80 bg-slate-950 rounded-xl p-2 sm:p-4 border border-slate-800 relative">
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 56, right: 44, left: -2, bottom: 26 }}
          >
            <defs>
              <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={3}
              padding={{ left: 22, right: 22 }}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit={` ${heightUnitLabel}`}
              domain={yAxisDomain}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Current Time Indicator Vertical Line */}
            {currentPoint && (
              <ReferenceLine
                x={currentPoint.time}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )}

            <Area
              type="monotone"
              dataKey="height"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#tideGradient)"
              dot={renderCustomDot}
              activeDot={{ r: 6, fill: '#60a5fa', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>

      </div>

      {/* High and Low Tide Point Indicators below chart */}
      <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {dayData.highLows.map((hl, idx) => (
          <div
            key={idx}
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              {hl.type === 'pleamar' ? (
                <div className="p-1 bg-blue-950 text-blue-400 border border-blue-800 rounded">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 bg-slate-900 text-amber-400 border border-slate-800 rounded">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
              )}
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">{hl.type}</div>
                <div className="font-bold text-white font-mono">{hl.time} h</div>
              </div>
            </div>
            <span className="font-mono font-bold text-blue-300 text-sm">
              {formatHeight(hl.height)} {heightUnitLabel}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

