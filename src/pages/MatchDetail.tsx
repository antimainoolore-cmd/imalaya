import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { PitchLineup } from '@/components/PitchLineup';
import { StatsComparison } from '@/components/StatsComparison';
import { H2HTable } from '@/components/H2HTable';

const HOME_TEAM = 'Real Madrid';
const AWAY_TEAM = 'Barcelona';

const mockPlayers = [
  { number: 1, name: 'Courtois', position_x: 50, position_y: 92 },
  { number: 2, name: 'Carvajal', position_x: 82, position_y: 75 },
  { number: 3, name: 'Militao', position_x: 60, position_y: 78 },
  { number: 4, name: 'Rudiger', position_x: 40, position_y: 78 },
  { number: 23, name: 'Mendy', position_x: 18, position_y: 75 },
  { number: 10, name: 'Modric', position_x: 70, position_y: 55 },
  { number: 8, name: 'Kroos', position_x: 50, position_y: 58 },
  { number: 15, name: 'Valverde', position_x: 30, position_y: 55 },
  { number: 7, name: 'Vinicius', position_x: 75, position_y: 25 },
  { number: 9, name: 'Bellingham', position_x: 50, position_y: 20 },
  { number: 11, name: 'Rodrygo', position_x: 25, position_y: 25 },
];

const mockStats = [
  { label: 'Posesion %', home: 62, away: 38, format: (v: number) => `${v}%` },
  { label: 'Tiros', home: 15, away: 8 },
  { label: 'Tiros al arco', home: 7, away: 3 },
  { label: 'xG', home: 2.1, away: 0.8, format: (v: number) => v.toFixed(1) },
  { label: 'Pases', home: 612, away: 378 },
  { label: 'Precision pases %', home: 91, away: 84, format: (v: number) => `${v}%` },
  { label: 'Faltas', home: 9, away: 14 },
  { label: 'Tarjetas amarillas', home: 2, away: 4 },
  { label: 'Corners', home: 6, away: 3 },
];

const mockH2H = [
  { date: '2026-04-20', competition: 'La Liga', homeTeam: 'Real Madrid', homeScore: 3, awayScore: 1, awayTeam: 'Barcelona' },
  { date: '2026-01-14', competition: 'Copa del Rey', homeTeam: 'Barcelona', homeScore: 2, awayScore: 2, awayTeam: 'Real Madrid' },
  { date: '2025-10-26', competition: 'La Liga', homeTeam: 'Real Madrid', homeScore: 1, awayScore: 0, awayTeam: 'Barcelona' },
  { date: '2025-04-13', competition: 'La Liga', homeTeam: 'Barcelona', homeScore: 0, awayScore: 4, awayTeam: 'Real Madrid' },
  { date: '2025-01-15', competition: 'Supercopa', homeTeam: 'Real Madrid', homeScore: 2, awayScore: 1, awayTeam: 'Barcelona' },
];

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Back link */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a partidos
      </Link>

      {/* Match header */}
      <div className="glass-card mb-6 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500/10 via-slate-800/20 to-red-500/10 border-b border-slate-800/60 px-6 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">La Liga - Jornada 32</span>
        </div>
        <div className="px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            {/* Home team */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 border-2 border-blue-500/30">
                <span className="text-2xl font-bold text-blue-400">RM</span>
              </div>
              <h1 className="text-base font-bold text-white text-center sm:text-lg">{HOME_TEAM}</h1>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/80 px-5 py-2.5">
                <span className="text-3xl font-bold text-white sm:text-4xl">2</span>
                <span className="text-slate-500 text-2xl">-</span>
                <span className="text-3xl font-bold text-white sm:text-4xl">1</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                EN VIVO · 67'
              </span>
            </div>

            {/* Away team */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 border-2 border-red-500/30">
                <span className="text-2xl font-bold text-red-400">FCB</span>
              </div>
              <h1 className="text-base font-bold text-white text-center sm:text-lg">{AWAY_TEAM}</h1>
            </div>
          </div>

          {/* Match info */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Sabado 26 de Septiembre, 2026
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              21:00
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Santiago Bernabeu, Madrid
            </span>
          </div>
        </div>
      </div>

      {/* Stats + Lineup grid */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <StatsComparison homeTeam={HOME_TEAM} awayTeam={AWAY_TEAM} stats={mockStats} />
        <PitchLineup players={mockPlayers} teamColor="bg-blue-500" formation="4-3-3" />
      </div>

      {/* H2H */}
      <div className="mb-6">
        <H2HTable matches={mockH2H} teamA={HOME_TEAM} teamB={AWAY_TEAM} />
      </div>

      {/* Match ID footer */}
      <p className="text-center text-xs text-slate-600">ID del partido: {id}</p>
    </div>
  );
}
