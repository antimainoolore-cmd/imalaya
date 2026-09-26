-- Add team API IDs so we can fetch H2H and recent form from APIFootball
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_team_api_id text,
  ADD COLUMN IF NOT EXISTS away_team_api_id text;
