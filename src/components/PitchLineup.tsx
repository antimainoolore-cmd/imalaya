interface Player {
  number: number;
  name: string;
  position_x: number;
  position_y: number;
}

interface PitchLineupProps {
  players: Player[];
  teamColor?: string;
  formation?: string;
}

export function PitchLineup({ players, teamColor = 'bg-blue-500', formation = '4-3-3' }: PitchLineupProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Alineacion</h3>
        <span className="rounded-lg bg-slate-800/80 px-3 py-1 text-xs font-semibold text-amber-400">{formation}</span>
      </div>

      {/* Pitch */}
      <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-green-700 via-green-600 to-green-700">
        {/* Grass stripes */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-green-600/30' : 'bg-green-700/30'}`}
            />
          ))}
        </div>

        {/* Pitch lines */}
        <div className="absolute inset-3 rounded-lg border-2 border-white/40" />
        {/* Center line */}
        <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-white/40" />
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
        {/* Penalty areas */}
        <div className="absolute left-1/2 top-3 h-16 w-32 -translate-x-1/2 rounded-t-lg border-2 border-b-0 border-white/40" />
        <div className="absolute left-1/2 bottom-3 h-16 w-32 -translate-x-1/2 rounded-b-lg border-2 border-t-0 border-white/40" />
        {/* Goal boxes */}
        <div className="absolute left-1/2 top-3 h-8 w-16 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-white/40" />
        <div className="absolute left-1/2 bottom-3 h-8 w-16 -translate-x-1/2 rounded-b-md border-2 border-t-0 border-white/40" />

        {/* Players */}
        {players.map((player) => (
          <div
            key={player.number}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
            style={{
              left: `${player.position_x}%`,
              top: `${player.position_y}%`,
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${teamColor} border-2 border-white/80 shadow-lg`}>
                <span className="text-sm font-bold text-white">{player.number}</span>
              </div>
              <span className="max-w-[70px] truncate rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {player.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
