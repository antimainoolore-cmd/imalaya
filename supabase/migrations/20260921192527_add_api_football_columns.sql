/*
# Add APIFootball integration columns

1. Modified Tables
- `matches`: Added columns to store the external API match ID, team logos, and match statistics.
  - api_match_id (text, nullable) - the APIFootball match_id for syncing results
  - home_team_logo (text, nullable) - URL to home team logo
  - away_team_logo (text, nullable) - URL to away team logo
  - match_statistics (jsonb, nullable) - stores detailed stats (possession, shots, cards, etc.)

2. Security
- No changes to existing RLS policies (new columns inherit the table's existing policies).
*/

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS api_match_id text,
  ADD COLUMN IF NOT EXISTS home_team_logo text,
  ADD COLUMN IF NOT EXISTS away_team_logo text,
  ADD COLUMN IF NOT EXISTS match_statistics jsonb;
