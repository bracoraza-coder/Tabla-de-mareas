import React, { useState, useEffect } from 'react';
import { Users, Eye, TrendingUp, Radio, UserPlus, UserCheck, RefreshCw, RotateCcw } from 'lucide-react';

export interface VisitorStats {
  totalVisits: number;
  todayVisits: number;
  newUsers: number;
  returningUsers: number;
  onlineNow: number;
}

interface VisitorCounterProps {
  variant?: 'compact' | 'full' | 'admin';
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({ variant = 'admin' }) => {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisits: 0,
    todayVisits: 0,
    newUsers: 0,
    returningUsers: 0,
    onlineNow: 1
  });
  const [loading, setLoading] = useState(true);

  const fetchAndRecordVisit = async () => {
    // 1. Determine if this user is NEW or RETURNING
    const isKnownUser = localStorage.getItem('v_user_known');
    const userType = isKnownUser ? 'returning' : 'new';
    
    // Mark user as known for future visits
    if (!isKnownUser) {
      localStorage.setItem('v_user_known', '1');
    }

    // 2. Check session storage so multiple tab refreshes in same tab session are counted accurately
    const sessionCounted = sessionStorage.getItem('v_session_counted');
    const shouldInc = !sessionCounted;
    if (shouldInc) {
      sessionStorage.setItem('v_session_counted', 'true');
    }

    // Local fallback calculation starting cleanly from 0
    let localTotal = 0;
    let localToday = 0;
    let localNew = 0;
    let localReturning = 0;

    try {
      const stored = JSON.parse(localStorage.getItem('web_real_stats_v2') || '{}');
      const todayStr = new Date().toISOString().split('T')[0];

      if (typeof stored.total === 'number') localTotal = stored.total;
      if (typeof stored.newUsers === 'number') localNew = stored.newUsers;
      if (typeof stored.returningUsers === 'number') localReturning = stored.returningUsers;
      if (typeof stored.today === 'number' && stored.lastDate === todayStr) {
        localToday = stored.today;
      } else {
        localToday = 0;
      }

      if (shouldInc) {
        localTotal += 1;
        localToday += 1;
        if (userType === 'new') localNew += 1;
        else localReturning += 1;

        localStorage.setItem('web_real_stats_v2', JSON.stringify({
          total: localTotal,
          today: localToday,
          newUsers: localNew,
          returningUsers: localReturning,
          lastDate: todayStr
        }));
      }
    } catch (e) {
      console.error(e);
    }

    // Call server endpoint
    try {
      const endpoint = `/api/counter${shouldInc ? `?inc=1&type=${userType}` : ''}`;
      const res = await fetch(endpoint, {
        method: shouldInc ? 'POST' : 'GET'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setStats({
            totalVisits: typeof data.totalVisits === 'number' ? data.totalVisits : localTotal,
            todayVisits: typeof data.todayVisits === 'number' ? data.todayVisits : localToday,
            newUsers: typeof data.newUsers === 'number' ? data.newUsers : localNew,
            returningUsers: typeof data.returningUsers === 'number' ? data.returningUsers : localReturning,
            onlineNow: data.onlineNow || 1
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      // API fallback to local state
    }

    setStats({
      totalVisits: localTotal,
      todayVisits: localToday,
      newUsers: localNew,
      returningUsers: localReturning,
      onlineNow: 1
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchAndRecordVisit();
  }, []);

  const handleResetCounter = async () => {
    if (!window.confirm('¿Seguro que deseas reiniciar todos los contadores de visitas a 0?')) {
      return;
    }
    localStorage.removeItem('web_real_stats_v2');
    localStorage.removeItem('web_visitor_stats');
    sessionStorage.removeItem('v_session_counted');
    
    setStats({
      totalVisits: 0,
      todayVisits: 0,
      newUsers: 0,
      returningUsers: 0,
      onlineNow: 1
    });
  };

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 shadow-md">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Eye className="w-3.5 h-3.5" />
          <span>{stats.totalVisits} visitas</span>
        </div>
        <span className="text-slate-700">•</span>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>{stats.onlineNow} en línea</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-white border-b border-slate-800/80 pb-3">
        <span className="flex items-center gap-2 text-emerald-400 uppercase tracking-wider text-xs">
          <Users className="w-4 h-4" />
          Métricas de Visitas y Tráfico Real (Solo Admin)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAndRecordVisit}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-normal"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleResetCounter}
            className="text-slate-500 hover:text-rose-400 flex items-center gap-1 text-[11px] font-normal ml-2"
            title="Reiniciar contadores a 0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reiniciar a 0</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Totales</span>
          </div>
          <div className="text-lg font-black text-white font-mono mt-1">
            {stats.totalVisits.toLocaleString('es-ES')}
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Hoy</span>
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">
            +{stats.todayVisits.toLocaleString('es-ES')}
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
            <UserPlus className="w-3 h-3 text-blue-400" />
            <span>Nuevos</span>
          </div>
          <div className="text-lg font-black text-blue-400 font-mono mt-1">
            {stats.newUsers.toLocaleString('es-ES')}
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
            <UserCheck className="w-3 h-3 text-purple-400" />
            <span>Recurrentes</span>
          </div>
          <div className="text-lg font-black text-purple-400 font-mono mt-1">
            {stats.returningUsers.toLocaleString('es-ES')}
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center justify-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>En Línea</span>
          </div>
          <div className="text-lg font-black text-emerald-300 font-mono mt-1 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {stats.onlineNow}
          </div>
        </div>
      </div>
    </div>
  );
};
