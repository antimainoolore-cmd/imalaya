/*
# Add Player Analysis Tables

1. New Tables
- `teams`: Stores team information synced from the API.
  - id (uuid, primary key)
  - api_team_id (text, unique, nullable) - external APIFootball team ID
  - name (text, not null)
  - logo (text, nullable) - URL to team badge/logo
  - country (text, nullable)
  - league (text, nullable) - primary league/competition
  - created_at (timestamptz)

- `players`: Stores player profiles.
  - id (uuid, primary key)
  - api_player_id (text, unique, nullable) - external API player ID
  - name (text, not null)
  - team_id (uuid, FK to teams, nullable)
  - position (text, nullable) - GK, DEF, MID, FWD
  - nationality (text, nullable)
  - photo (text, nullable) - URL to player photo
  - date_of_birth (date, nullable)
  - height (int, nullable) - in cm
  - weight (int, nullable) - in kg
  - created_at (timestamptz)

- `player_stats`: Per-match statistics for individual players.
  - id (uuid, primary key)
  - player_id (uuid, FK to players, not null)
  - match_id (uuid, FK to matches, not null)
  - team_id (uuid, FK to teams, nullable)
  - minutes_played (int, nullable)
  - goals (int, default 0)
  - assists (int, default 0)
  - yellow_cards (int, default 0)
  - red_cards (int, default 0)
  - shots_total (int, nullable)
  - shots_on_target (int, nullable)
  - xg (numeric(5,2), nullable) - expected goals
  - xa (numeric(5,2), nullable) - expected assists
  - passes (int, nullable)
  - passes_completed (int, nullable)
  - fouls_committed (int, nullable)
  - fouls_drawn (int, nullable)
  - offsides (int, nullable)
  - tackles (int, nullable)
  - interceptions (int, nullable)
  - saves (int, nullable) - for goalkeepers
  - rating (numeric(4,2), nullable) - match rating
  - created_at (timestamptz)
  - UNIQUE constraint on (player_id, match_id)

- `lineups`: Starting lineups and formations for each match.
  - id (uuid, primary key)
  - match_id (uuid, FK to matches, not null)
  - team_id (uuid, FK to teams, not null)
  - formation (text, nullable) - e.g. "4-3-3"
  - is_home (boolean, not null)
  - players (jsonb, nullable) - array of player IDs with positions
  - created_at (timestamptz)
  - UNIQUE constraint on (match_id, team_id)

- `h2h`: Head-to-head records between two teams.
  - id (uuid, primary key)
  - team_a_id (uuid, FK to teams, not null)
  - team_b_id (uuid, FK to teams, not null)
  - match_id (uuid, FK to matches, nullable) - reference to a specific match
  - team_a_wins (int, default 0)
  - team_b_wins (int, default 0)
  - draws (int, default 0)
  - team_a_goals (int, default 0)
  - team_b_goals (int, default 0)
  - last_played (timestamptz, nullable)
  - created_at (timestamptz)
  - UNIQUE constraint on (team_a_id, team_b_id)

2. Security
- Enable RLS on all new tables.
- Public read access (anon + authenticated) for all tables (single-tenant, no auth).
- Write access (INSERT/UPDATE/DELETE) restricted to the service role only.
  Since the service role bypasses RLS entirely, we only add SELECT policies
  for anon/authenticated. No INSERT/UPDATE/DELETE policies are created,
  which means anon/authenticated users CANNOT modify these tables —
  only the service role (used by edge functions) can write to them.

3. Indexes
- Indexes on foreign keys and frequently queried columns for performance.
*/

-- ===================== TEAMS =====================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_team_id text UNIQUE,
  name text NOT NULL,
  logo text,
  country text,
  league text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_teams" ON teams;
CREATE POLICY "public_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_teams_api_id ON teams(api_team_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- ===================== PLAYERS =====================
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_player_id text UNIQUE,
  name text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  position text CHECK (position IN ('GK', 'DEF', 'MID', 'FWD') OR position IS NULL),
  nationality text,
  photo text,
  date_of_birth date,
  height int,
  weight int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_players" ON players;
CREATE POLICY "public_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_players_api_id ON players(api_player_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- ===================== PLAYER_STATS =====================
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  minutes_played int,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0,
  shots_total int,
  shots_on_target int,
  xg numeric(5,2),
  xa numeric(5,2),
  passes int,
  passes_completed int,
  fouls_committed int,
  fouls_drawn int,
  offsides int,
  tackles int,
  interceptions int,
  saves int,
  rating numeric(4,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, match_id)
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_player_stats" ON player_stats;
CREATE POLICY "public_select_player_stats" ON player_stats FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match_id ON player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_id ON player_stats(team_id);

-- ===================== LINEUPS =====================
CREATE TABLE IF NOT EXISTS lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  formation text,
  is_home boolean NOT NULL,
  players jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, team_id)
);

ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_lineups" ON lineups;
CREATE POLICY "public_select_lineups" ON lineups FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON lineups(team_id);

-- ===================== H2H =====================
CREATE TABLE IF NOT EXISTS h2h (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  team_a_wins int NOT NULL DEFAULT 0,
  team_b_wins int NOT NULL DEFAULT 0,
  draws int NOT NULL DEFAULT 0,
  team_a_goals int NOT NULL DEFAULT 0,
  team_b_goals int NOT NULL DEFAULT 0,
  last_played timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_a_id, team_b_id)
);

ALTER TABLE h2h ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_h2h" ON h2h;
CREATE POLICY "public_select_h2h" ON h2h FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_h2h_team_a ON h2h(team_a_id);
CREATE INDEX IF NOT EXISTS idx_h2h_team_b ON h2h(team_b_id);
CREATE INDEX IF NOT EXISTS idx_h2h_match_id ON h2h(match_id);
