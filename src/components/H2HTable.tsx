interface H2HMatch {
  date: string;
  competition: string;
  homeTeam: string;
  homeScore: number;
  awayScore: number;
  awayTeam: string;
}

interface H2HTableProps {
  matches: H2HMatch[];
  teamA: string;
  teamB: string;
}

export function H2HTable({ matches, teamA, teamB }: H2HTableProps) {
  const teamAWins = matches.filter((m) => {
    const aIsHome = m.homeTeam === teamA;
    return aIsHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
  }).length;
  const teamBWins = matches.filter((m) => {
    const bIsHome = m.homeTeam === teamB;
    return bIsHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
  }).length;
  const draws = matches.length - teamAWins - teamBWins;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Historial de Enfrentamientos</h3>
        <span className="text-xs text-slate-500">{matches.length} partidos</span>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-2 px-5 py-3">
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-center">
          <p className="text-lg font-bold text-blue-400">{teamAWins}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{teamA}</p>
        </div>
        <div className="rounded-xl bg-slate-700/30 border border-slate-600/20 px-3 py-2 text-center">
          <p className="text-lg font-bold text-slate-300">{draws}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Empates</p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-center">
          <p className="text-lg font-bold text-red-400">{teamBWins}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{teamB}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-800/60 bg-slate-900/40">
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Competicion</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Local</th>
              <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Resultado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Visitante</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m, i) => {
              const homeWon = m.homeScore > m.awayScore;
              return (
                <tr
                  key={i}
                  className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-2.5 text-xs text-slate-400">
                    {new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{m.competition}</td>
                  <td className={`px-4 py-2.5 text-right text-sm font-medium ${homeWon ? 'text-white' : 'text-slate-400'}`}>
                    {m.homeTeam}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-sm font-bold text-white">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-left text-sm font-medium ${!homeWon ? 'text-white' : 'text-slate-400'}`}>
                    {m.awayTeam}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
