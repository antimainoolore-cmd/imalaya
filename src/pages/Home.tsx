import { useState, useCallback } from 'react';
import { Trophy, Loader2, CalendarDays, RefreshCw, Sparkles, TrendingUp, Shield, Target, AlertTriangle, Flame, Radio } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { Leaderboard } from '@/components/Leaderboard';
import { useMatches, useAllPredictions, useAutoUpdate } from '@/lib/hooks';
import type { Prediction } from '@/lib/supabase';

type View = 'matches' | 'leaderboard';
type Filter = 'all' | 'today' | 'tomorrow' | 'live' | 'finished';

interface Insight {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  type: 'form' | 'h2h_dominance' | 'goal_machine' | 'defensive_wall' | 'streak' | 'upset_alert';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  pick: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-matches`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function insightIcon(type: Insight['type']) {
  switch (type) {
    case 'form': return TrendingUp;
    case 'h2h_dominance': return Trophy;
    case 'goal_machine': return Target;
    case 'defensive_wall': return Shield;
    case 'streak': return Flame;
    case 'upset_alert': return AlertTriangle;
    default: return Sparkles;
  }
}

function insightColor(type: Insight['type']) {
  switch (type) {
    case 'form': return 'from-emerald-500/15 to-green-500/10 border-emerald-500/25';
    case 'h2h_dominance': return 'from-amber-500/15 to-yellow-500/10 border-amber-500/25';
    case 'goal_machine': return 'from-rose-500/15 to-red-500/10 border-rose-500/25';
    case 'defensive_wall': return 'from-sky-500/15 to-blue-500/10 border-sky-500/25';
    case 'streak': return 'from-orange-500/15 to-amber-500/10 border-orange-500/25';
    case 'upset_alert': return 'from-red-500/15 to-rose-500/10 border-red-500/25';
    default: return 'from-slate-500/15 to-slate-600/10 border-slate-500/25';
  }
}

function confidenceBadge(conf: 'high' | 'medium' | 'low') {
  switch (conf) {
    case 'high': return 'bg-emerald-500/20 text-emerald-400';
    case 'medium': return 'bg-amber-500/20 text-amber-400';
    case 'low': return 'bg-slate-500/20 text-slate-400';
  }
}

function confidenceLabel(conf: 'high' | 'medium' | 'low') {
  switch (conf) {
    case 'high': return 'Alta';
    case 'medium': return 'Media';
    case 'low': return 'Baja';
  }
}

export default function Home() {
  const [view, setView] = useState<View>('matches');
  const [filter, setFilter] = useState<Filter>('today');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const { matches, loading, error, refetch: refetchMatches, lastUpdated } = useMatches();
  const { predictions, refetch: refetchAllPredictions } = useAllPredictions();
  const { autoUpdating, lastAutoUpdate } = useAutoUpdate(matches);

  const refetchAll = useCallback(() => {
    refetchMatches();
    refetchAllPredictions();
  }, [refetchMatches, refetchAllPredictions]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const resp = await fetch(`${FUNCTION_URL}?action=sync`, {
        headers: { Authorization: `Bearer ${ANON_KEY}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al sincronizar');
      setSyncMsg(`${data.inserted} nuevos, ${data.updated} actualizados`);
      refetchAll();
    } catch (err: any) {
      setSyncMsg(`Error: ${err.message}`);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 5000);
  }, [refetchAll]);

  const handleUpdate = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const resp = await fetch(`${FUNCTION_URL}?action=update`, {
        headers: { Authorization: `Bearer ${ANON_KEY}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al actualizar');
      setSyncMsg(`${data.updated} resultados actualizados`);
      refetchAll();
    } catch (err: any) {
      setSyncMsg(`Error: ${err.message}`);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 5000);
  }, [refetchAll]);

  const handleInsights = useCallback(async () => {
    if (insights) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const resp = await fetch(`${FUNCTION_URL}?action=insights`, {
        headers: { Authorization: `Bearer ${ANON_KEY}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al generar insights');
      setInsights(data.insights || []);
    } catch (err: any) {
      setInsightsError(err.message);
    }
    setInsightsLoading(false);
  }, [insights]);

  const predictionsByMatch = new Map<string, Prediction[]>();
  predictions.forEach((p) => {
    const arr = predictionsByMatch.get(p.match_id) || [];
    arr.push(p);
    predictionsByMatch.set(p.match_id, arr);
  });

  const todayStr = new Date().toDateString();
  const tomorrowStr = new Date(Date.now() + 86400000).toDateString();

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'today') return new Date(m.match_date).toDateString() === todayStr;
    if (filter === 'tomorrow') return new Date(m.match_date).toDateString() === tomorrowStr;
    if (filter === 'live') return m.status === 'live';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  const scheduledCount = matches.filter((m) => m.status === 'scheduled').length;
  const liveCount = matches.filter((m) => m.status === 'live').length;
  const finishedCount = matches.filter((m) => m.status === 'finished').length;
  const todayCount = matches.filter((m) => new Date(m.match_date).toDateString() === todayStr).length;
  const tomorrowCount = matches.filter((m) => new Date(m.match_date).toDateString() === tomorrowStr).length;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: matches.length },
    { key: 'today', label: 'Hoy', count: todayCount },
    { key: 'tomorrow', label: 'Manana', count: tomorrowCount },
    { key: 'live', label: 'En vivo', count: liveCount },
    { key: 'finished', label: 'Finalizados', count: finishedCount },
  ];

  return (
    <div>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Sync buttons + auto-update indicator */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Cargar partidos
          </button>
          <button
            onClick={handleUpdate}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Actualizar resultados
          </button>
          {syncMsg && (
            <span className="text-sm text-slate-400 animate-fade-in">{syncMsg}</span>
          )}
          {liveCount > 0 && (
            <span className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Auto-actualizacion {autoUpdating ? 'sincronizando...' : 'activa'}
              {lastAutoUpdate && (
                <span className="text-slate-500">
                  · {lastAutoUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </span>
          )}
          {lastUpdated && (
            <span className="ml-auto text-xs text-slate-500">
              Datos: {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {/* Hero stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Partidos</p>
            <p className="text-2xl font-bold text-white mt-1">{matches.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Proximos</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{scheduledCount}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Pronosticos</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{predictions.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Finalizados</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{finishedCount}</p>
          </div>
        </div>

        {/* Smart Insights */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Smart Insights</h2>
                <p className="text-xs text-slate-400">Oportunidades detectadas automaticamente</p>
              </div>
            </div>
            {!insights && !insightsLoading && (
              <button
                onClick={handleInsights}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500"
              >
                <Sparkles className="h-4 w-4" />
                Analizar
              </button>
            )}
            {insights && (
              <button
                onClick={() => { setInsights(null); handleInsights(); }}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </button>
            )}
          </div>

          {insightsLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              <span className="ml-3 text-sm text-slate-400">Analizando partidos...</span>
            </div>
          )}

          {insightsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {insightsError}
            </div>
          )}

          {insights && insights.length === 0 && (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-slate-400">No se detectaron oportunidades claras en los partidos proximos.</p>
              <p className="text-xs text-slate-500 mt-1">Carga partidos y vuelve a analizar para mas datos.</p>
            </div>
          )}

          {insights && insights.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((ins, i) => {
                const Icon = insightIcon(ins.type);
                return (
                  <div
                    key={`${ins.match_id}-${ins.type}-${i}`}
                    className={`glass-card rounded-2xl border bg-gradient-to-br ${insightColor(ins.type)} p-4 animate-slide-up`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-300" />
                        <h3 className="text-sm font-bold text-white">{ins.title}</h3>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${confidenceBadge(ins.confidence)}`}>
                        {confidenceLabel(ins.confidence)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{ins.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {ins.home_team} vs {ins.away_team} · {ins.league}
                      </span>
                      <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-amber-400">
                        {ins.pick}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {view === 'matches' ? (
          <>
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                    filter === f.key
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {f.label}
                  <span className={`rounded-md px-1.5 py-0.5 text-xs ${
                    filter === f.key ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400">{error}</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <CalendarDays className="h-12 w-12 text-slate-700 mb-4" />
                <p className="text-slate-400">No hay partidos en esta categoria.</p>
                <p className="text-sm text-slate-500 mt-1">Presiona "Cargar partidos" para traer los partidos reales.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMatches.map((match, i) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    predictions={predictionsByMatch.get(match.id) || []}
                    onPredictionAdded={refetchAll}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Tabla de Posiciones</h2>
            </div>
            <Leaderboard predictions={predictions} matches={matches} />
          </>
        )}
      </main>
    </div>
  );
}
