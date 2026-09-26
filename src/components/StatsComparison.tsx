interface StatItem {
  label: string;
  home: number;
  away: number;
  format?: (val: number) => string;
}

interface StatsComparisonProps {
  homeTeam: string;
  awayTeam: string;
  stats: StatItem[];
}

export function StatsComparison({ homeTeam, awayTeam, stats }: StatsComparisonProps) {
  const fmt = (s: StatItem, val: number) => (s.format ? s.format(val) : String(val));

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Comparativa de Estadisticas</h3>
      </div>

      <div className="px-5 py-4">
        {/* Team labels */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-bold text-blue-400">{homeTeam}</span>
          <span className="text-xs text-slate-500">vs</span>
          <span className="text-sm font-bold text-red-400">{awayTeam}</span>
        </div>

        {/* Stats bars */}
        <div className="space-y-4">
          {stats.map((stat) => {
            const total = stat.home + stat.away || 1;
            const homePct = (stat.home / total) * 100;
            const awayPct = (stat.away / total) * 100;

            return (
              <div key={stat.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-400">{fmt(stat, stat.home)}</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</span>
                  <span className="text-sm font-bold text-red-400">{fmt(stat, stat.away)}</span>
                </div>
                <div className="flex h-2 items-center overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-l-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${homePct}%` }}
                  />
                  <div className="h-full w-px bg-slate-600" />
                  <div
                    className="h-full rounded-r-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-500"
                    style={{ width: `${awayPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
