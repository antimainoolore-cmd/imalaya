import { Trophy, Medal, Award } from 'lucide-react';
import type { Prediction, Match } from '@/lib/supabase';

interface LeaderboardProps {
  predictions: Prediction[];
  matches: Match[];
}

interface LeaderEntry {
  name: string;
  totalPoints: number;
  correctScores: number;
  correctResults: number;
  totalPredictions: number;
}

function computePoints(pred: Prediction, match: Match | undefined): { points: number; correctScore: boolean; correctResult: boolean } {
  if (!match || match.status !== 'finished' || match.home_score === null || match.away_score === null) {
    return { points: 0, correctScore: false, correctResult: false };
  }
  const exactScore = pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score;
  const predResult = Math.sign(pred.predicted_home_score - pred.predicted_away_score);
  const actualResult = Math.sign(match.home_score - match.away_score);
  const correctResult = predResult === actualResult;
  let points = 0;
  if (exactScore) points = 3;
  else if (correctResult) points = 1;
  return { points, correctScore: exactScore, correctResult };
}

export function Leaderboard({ predictions, matches }: LeaderboardProps) {
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const leaderMap = new Map<string, LeaderEntry>();

  predictions.forEach((p) => {
    const match = matchMap.get(p.match_id);
    const { points, correctScore, correctResult } = computePoints(p, match);
    const existing = leaderMap.get(p.predictor_name);
    if (existing) {
      existing.totalPoints += points;
      existing.correctScores += correctScore ? 1 : 0;
      existing.correctResults += correctResult ? 1 : 0;
      existing.totalPredictions += 1;
    } else {
      leaderMap.set(p.predictor_name, {
        name: p.predictor_name,
        totalPoints: points,
        correctScores: correctScore ? 1 : 0,
        correctResults: correctResult ? 1 : 0,
        totalPredictions: 1,
      });
    }
  });

  const leaders = Array.from(leaderMap.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores;
    return b.correctResults - a.correctResults;
  });

  if (leaders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Trophy className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-slate-400">Aun no hay pronosticos.</p>
        <p className="text-sm text-slate-500 mt-1">Haz tu primer pronostico para aparecer aqui.</p>
      </div>
    );
  }

  const getIcon = (i: number) => {
    if (i === 0) return <Medal className="h-5 w-5 text-amber-400" />;
    if (i === 1) return <Medal className="h-5 w-5 text-slate-300" />;
    if (i === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm font-bold text-slate-500 w-5 text-center">{i + 1}</span>;
  };

  return (
    <div className="space-y-3">
      {leaders.map((leader, i) => (
        <div
          key={leader.name}
          className={`glass-card rounded-2xl p-4 animate-slide-up flex items-center gap-4 ${
            i === 0 ? 'border-amber-500/40 bg-amber-500/5' : ''
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex h-10 w-10 items-center justify-center flex-shrink-0">
            {getIcon(i)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{leader.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-slate-400">
              <span>{leader.totalPredictions} pronosticos</span>
              <span className="text-emerald-400">{leader.correctScores} exactos</span>
              <span className="text-sky-400">{leader.correctResults} resultados</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-bold ${i === 0 ? 'text-amber-400' : 'text-white'}`}>
              {leader.totalPoints}
            </p>
            <p className="text-xs text-slate-500">puntos</p>
          </div>
        </div>
      ))}
    </div>
  );
}
