import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, Radio, Plus, BarChart3, ChevronDown, ChevronUp, History, Loader2 } from 'lucide-react';
import type { Match, Prediction, MatchStatistic, H2HData } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface MatchCardProps {
  match: Match;
  predictions: Prediction[];
  onPredictionAdded: () => void;
  index: number;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-matches`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getLeagueColor(league: string) {
  const colors: Record<string, string> = {
    'La Liga': 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    'Premier League': 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
    'Bundesliga': 'from-red-500/20 to-rose-500/20 border-red-500/30',
    'Serie A': 'from-blue-500/20 to-sky-500/20 border-blue-500/30',
    'Ligue 1': 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30',
  'Champions League': 'from-blue-600/20 to-indigo-600/20 border-blue-600/30',
  'Europa League': 'from-orange-600/20 to-amber-600/20 border-orange-600/30',
  'World Cup': 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
  'Copa Libertadores': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  'MLS': 'from-sky-400/20 to-blue-400/20 border-sky-400/30',
    'Eredivisie': 'from-orange-400/20 to-amber-400/20 border-orange-400/30',
    'Primeira Liga': 'from-green-600/20 to-emerald-600/20 border-green-600/30',
    'Super League': 'from-rose-400/20 to-pink-400/20 border-rose-400/30',
    'Jupiler Pro League': 'from-amber-400/20 to-yellow-400/20 border-amber-400/30',
    'Scottish Premiership': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'Liga MX': 'from-green-400/20 to-lime-400/20 border-green-400/30',
    'Brasileirao': 'from-green-500/20 to-yellow-500/20 border-green-500/30',
    'Argentine Liga': 'from-sky-500/20 to-blue-500/20 border-sky-500/30',
    'Saudi Pro League': 'from-green-600/20 to-teal-600/20 border-green-600/30',
    'EFL Championship': 'from-blue-400/20 to-indigo-400/20 border-blue-400/30',
    'Liga Portugal': 'from-green-600/20 to-emerald-600/20 border-green-600/30',
    'Turkish Super Lig': 'from-red-600/20 to-rose-600/20 border-red-600/30',
    'Russian Premier League': 'from-red-500/20 to-blue-500/20 border-red-500/30',
    'Austrian Bundesliga': 'from-red-400/20 to-rose-400/20 border-red-400/30',
    'Swiss Super League': 'from-red-500/20 to-rose-500/20 border-red-500/30',
    'Greek Super League': 'from-blue-600/20 to-cyan-600/20 border-blue-600/30',
    'Croatian League': 'from-red-500/20 to-white/20 border-red-500/30',
    'Czech League': 'from-blue-500/20 to-red-500/20 border-blue-500/30',
    'Serbian League': 'from-red-500/20 to-blue-500/20 border-red-500/30',
    'Danish Superliga': 'from-red-500/20 to-white/20 border-red-500/30',
    'Swedish Allsvenskan': 'from-blue-500/20 to-yellow-500/20 border-blue-500/30',
    'Norwegian Eliteserien': 'from-red-500/20 to-blue-500/20 border-red-500/30',
    'Finnish Veikkausliiga': 'from-blue-500/20 to-white/20 border-blue-500/30',
    'Polish Ekstraklasa': 'from-red-500/20 to-white/20 border-red-500/30',
    'Hungarian League': 'from-green-500/20 to-red-500/20 border-green-500/30',
    'Romanian Liga I': 'from-yellow-500/20 to-blue-500/20 border-yellow-500/30',
    'Bulgarian League': 'from-green-500/20 to-white/20 border-green-500/30',
    'Israeli Premier League': 'from-blue-500/20 to-white/20 border-blue-500/30',
    'Ukrainian Premier League': 'from-blue-500/20 to-yellow-500/20 border-blue-500/30',
    'Belgian Pro League': 'from-amber-400/20 to-yellow-400/20 border-amber-400/30',
    // National team competitions
    'UEFA Nations League': 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    'Concacaf Nations League': 'from-red-500/20 to-orange-500/20 border-red-500/30',
    'Africa Cup of Nations Qualification': 'from-green-600/20 to-emerald-600/20 border-green-600/30',
    'Africa Cup of Nations': 'from-green-600/20 to-yellow-500/20 border-green-600/30',
    'CONMEBOL Copa America': 'from-yellow-500/20 to-blue-500/20 border-yellow-500/30',
    'Concacaf Gold Cup': 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    'AFC Asian Cup': 'from-red-500/20 to-yellow-500/20 border-red-500/30',
    'Gulf Cup of Nations': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    'FIFA World Cup': 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    'CONMEBOL World Cup Qualifiers': 'from-yellow-500/20 to-blue-500/20 border-yellow-500/30',
    'UEFA World Cup Qualifiers': 'from-blue-500/20 to-sky-500/20 border-blue-500/30',
    'AFC World Cup Qualifiers': 'from-red-500/20 to-yellow-500/20 border-red-500/30',
    'CAF World Cup Qualifiers': 'from-green-600/20 to-yellow-500/20 border-green-600/30',
    'Concacaf World Cup Qualifiers': 'from-red-500/20 to-blue-500/20 border-red-500/30',
    'OFC World Cup Qualifiers': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'UEFA European Championship Qualifiers': 'from-blue-600/20 to-indigo-600/20 border-blue-600/30',
  };
  // Match partial league names for national team sub-competitions (e.g. "UEFA Nations League - League B")
  for (const [key, val] of Object.entries(colors)) {
    if (league.includes(key)) return val;
  }
  return colors[league] || 'from-slate-500/20 to-slate-600/20 border-slate-600/30';
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = isToday
    ? 'Hoy'
    : isTomorrow
    ? 'Manana'
    : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  return { dateLabel, time };
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function getResultBadge(homeScore: string, awayScore: string, teamIsHome: boolean) {
  const h = parseInt(homeScore) || 0;
  const a = parseInt(awayScore) || 0;
  if (teamIsHome) {
    if (h > a) return { label: 'G', color: 'bg-emerald-500/20 text-emerald-400' };
    if (h < a) return { label: 'P', color: 'bg-red-500/20 text-red-400' };
    return { label: 'E', color: 'bg-slate-500/20 text-slate-400' };
  } else {
    if (a > h) return { label: 'G', color: 'bg-emerald-500/20 text-emerald-400' };
    if (a < h) return { label: 'P', color: 'bg-red-500/20 text-red-400' };
    return { label: 'E', color: 'bg-slate-500/20 text-slate-400' };
  }
}

export function MatchCard({ match, predictions, onPredictionAdded, index }: MatchCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [h2hData, setH2hData] = useState<H2HData | null>(null);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [h2hError, setH2hError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasStats = match.match_statistics && match.match_statistics.length > 0;
  const canFetchHistory = !!match.home_team_api_id && !!match.away_team_api_id;

  const { dateLabel, time } = formatDate(match.match_date);
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';

  const fetchH2H = async () => {
    if (!canFetchHistory || h2hData) {
      setShowHistory(!showHistory);
      return;
    }
    setH2hLoading(true);
    setH2hError(null);
    try {
      const resp = await fetch(
        `${FUNCTION_URL}?action=h2h&homeId=${match.home_team_api_id}&awayId=${match.away_team_api_id}`,
        { headers: { Authorization: `Bearer ${ANON_KEY}` } }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al cargar historial');
      setH2hData(data);
      setShowHistory(true);
    } catch (err: any) {
      setH2hError(err.message);
    }
    setH2hLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || homeScore === '' || awayScore === '') return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('predictions').insert({
      match_id: match.id,
      predictor_name: name.trim(),
      predicted_home_score: parseInt(homeScore),
      predicted_away_score: parseInt(awayScore),
    });

    setSubmitting(false);

    if (insertError) {
      setError('No se pudo guardar la prediccion. Intenta de nuevo.');
      return;
    }

    setName('');
    setHomeScore('');
    setAwayScore('');
    setShowForm(false);
    onPredictionAdded();
  };

  const scoreColor = (predicted: number, actual: number | null) => {
    if (actual === null) return 'text-slate-400';
    return predicted === actual ? 'text-emerald-400' : 'text-slate-400';
  };

  return (
    <Link
      to={`/match/${match.id}`}
      className={`glass-card rounded-2xl overflow-hidden animate-slide-up transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
        isLive ? 'animate-pulse-live' : ''
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* League badge */}
      <div className={`bg-gradient-to-r ${getLeagueColor(match.league)} border-b px-4 py-2.5 flex items-center justify-between`}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {match.league}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
            <Radio className="h-3 w-3 animate-pulse" />
            EN VIVO
          </span>
        )}
        {isFinished && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            FINALIZADO
          </span>
        )}
      </div>

      {/* Match content */}
      <div className="p-5">
        {/* Date */}
        <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {time}
          </span>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-col items-center gap-2">
            {match.home_team_logo && (
              <img src={match.home_team_logo} alt={match.home_team} className="h-10 w-10 object-contain" />
            )}
            <p className="font-bold text-white text-sm sm:text-base text-center">{match.home_team}</p>
          </div>

          <div className="flex items-center gap-2 px-3">
            {isFinished || isLive ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5">
                <span className="text-2xl font-bold text-white">{match.home_score}</span>
                <span className="text-slate-500">-</span>
                <span className="text-2xl font-bold text-white">{match.away_score}</span>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-500">
                VS
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            {match.away_team_logo && (
              <img src={match.away_team_logo} alt={match.away_team} className="h-10 w-10 object-contain" />
            )}
            <p className="font-bold text-white text-sm sm:text-base text-center">{match.away_team}</p>
          </div>
        </div>

        {/* Statistics toggle */}
        {hasStats && (isFinished || isLive) && (
          <div className="mt-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {showStats ? 'Ocultar estadisticas' : 'Ver estadisticas'}
              {showStats ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showStats && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {match.match_statistics!.map((stat, i) => (
                  <StatBar key={i} stat={stat} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History toggle */}
        {canFetchHistory && (
          <div className="mt-4">
            <button
              onClick={fetchH2H}
              disabled={h2hLoading}
              className="flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-50"
            >
              {h2hLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />}
              {showHistory ? 'Ocultar historial' : 'Ver historial y ultimos 10 partidos'}
              {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {h2hError && (
              <p className="mt-2 text-xs text-red-400 text-center">{h2hError}</p>
            )}
            {showHistory && h2hData && (
              <div className="mt-3 space-y-4 animate-fade-in">
                {/* H2H */}
                {h2hData.h2h.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Enfrentamientos directos
                    </p>
                    <div className="space-y-1.5">
                      {h2hData.h2h.map((m, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs">
                          <span className="text-slate-400">{formatDateShort(m.date)}</span>
                          <span className="text-slate-300 font-medium truncate mx-2">
                            {m.home} <span className="text-slate-500">vs</span> {m.away}
                          </span>
                          <span className="font-bold text-white flex-shrink-0">{m.home_score}-{m.away_score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Home team form */}
                {h2hData.homeLast.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Ultimos 10 de {match.home_team}
                    </p>
                    <div className="space-y-1.5">
                      {h2hData.homeLast.map((m, i) => {
                        const isHome = m.home === match.home_team;
                        const badge = getResultBadge(m.home_score, m.away_score, isHome);
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs">
                            <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-slate-400 flex-shrink-0">{formatDateShort(m.date)}</span>
                            <span className="text-slate-300 truncate mx-2 text-center">
                              {m.home} <span className="text-slate-500">vs</span> {m.away}
                            </span>
                            <span className="font-bold text-white flex-shrink-0">{m.home_score}-{m.away_score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Away team form */}
                {h2hData.awayLast.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Ultimos 10 de {match.away_team}
                    </p>
                    <div className="space-y-1.5">
                      {h2hData.awayLast.map((m, i) => {
                        const isHome = m.home === match.away_team;
                        const badge = getResultBadge(m.home_score, m.away_score, isHome);
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs">
                            <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.color}`}>
                              {badge.label}
                            </span>
                            <span className="text-slate-400 flex-shrink-0">{formatDateShort(m.date)}</span>
                            <span className="text-slate-300 truncate mx-2 text-center">
                              {m.home} <span className="text-slate-500">vs</span> {m.away}
                            </span>
                            <span className="font-bold text-white flex-shrink-0">{m.home_score}-{m.away_score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Predictions list */}
        {predictions.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pronosticos ({predictions.length})
            </p>
            {predictions.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2 text-sm animate-fade-in"
              >
                <span className="text-slate-300 truncate">{p.predictor_name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-bold ${scoreColor(p.predicted_home_score, match.home_score)}`}>
                    {p.predicted_home_score}
                  </span>
                  <span className="text-slate-600">-</span>
                  <span className={`font-bold ${scoreColor(p.predicted_away_score, match.away_score)}`}>
                    {p.predicted_away_score}
                  </span>
                  {isFinished && p.points > 0 && (
                    <span className="ml-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-400">
                      {p.points} pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add prediction form / button */}
        {!isFinished && (
          <div className="mt-4">
            {showForm ? (
              <form onSubmit={handleSubmit} className="animate-scale-in space-y-3 rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    placeholder="Local"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-center text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <span className="text-slate-500 text-sm">-</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    placeholder="Visitante"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-center text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400 disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : 'Enviar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setError(null); }}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-amber-500/50 hover:text-amber-400"
              >
                <Plus className="h-4 w-4" />
                Hacer pronostico
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function StatBar({ stat }: { stat: MatchStatistic }) {
  const home = parseFloat(stat.home) || 0;
  const away = parseFloat(stat.away) || 0;
  const total = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const awayPct = total > 0 ? (away / total) * 100 : 50;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span className="font-semibold text-slate-300">{stat.home}</span>
        <span className="uppercase tracking-wider">{stat.type}</span>
        <span className="font-semibold text-slate-300">{stat.away}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden bg-slate-800">
        <div className="bg-amber-500/70 rounded-l-full" style={{ width: `${homePct}%` }} />
        <div className="bg-sky-500/70 rounded-r-full" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  );
}
