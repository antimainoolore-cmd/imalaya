import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface MatchStatistic {
  type: string;
  home: string;
  away: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  created_at: string;
  api_match_id: string | null;
  home_team_logo: string | null;
  away_team_logo: string | null;
  match_statistics: MatchStatistic[] | null;
  home_team_api_id: string | null;
  away_team_api_id: string | null;
}

export interface H2HMatch {
  date: string;
  home: string;
  away: string;
  home_score: string;
  away_score: string;
  league: string;
}

export interface TeamFormMatch {
  date: string;
  home: string;
  away: string;
  home_score: string;
  away_score: string;
  league: string;
  status: string;
}

export interface H2HData {
  h2h: H2HMatch[];
  homeLast: TeamFormMatch[];
  awayLast: TeamFormMatch[];
}

export interface Prediction {
  id: string;
  match_id: string;
  predictor_name: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number;
  created_at: string;
}

export interface MatchWithPredictions extends Match {
  predictions: Prediction[];
}
