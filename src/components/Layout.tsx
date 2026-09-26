import { NavLink, Outlet } from 'react-router-dom';
import { Trophy, TrendingUp } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen pitch-bg">
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                <Trophy className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight text-white">
                  El Pronosticador
                </h1>
                <p className="text-xs text-slate-400">Predicciones de Futbol</p>
              </div>
            </NavLink>

            <nav className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Partidos</span>
              </NavLink>
              <NavLink
                to="/"
                className="flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Tabla</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-slate-800/60 py-6 text-center">
        <p className="text-xs text-slate-500">
          3 puntos por marcador exacto - 1 punto por resultado correcto
        </p>
      </footer>
    </div>
  );
}
