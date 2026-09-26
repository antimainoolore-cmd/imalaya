import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Match, Prediction } from '@/lib/supabase';

const POLL_INTERVAL = 30000; // 30 seconds

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });
    if (error) setError(error.message);
    else setMatches(data || []);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Auto-poll every 30s so live scores update automatically
  useEffect(() => {
    const interval = setInterval(fetchMatches, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { matches, loading, error, refetch: fetchMatches, setMatches, lastUpdated };
}

export function usePredictions(matchId: string | null) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    setPredictions(data || []);
    setLoading(false);
  }, [matchId]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  return { predictions, loading, refetch: fetchPredictions };
}

export function useAllPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });
    setPredictions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-poll predictions too
  useEffect(() => {
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { predictions, loading, refetch: fetchAll };
}

/**
 * Hook that calls the edge function to update live/finished match scores
 * automatically on an interval. Only runs when there are live or
 * recently-scheduled matches.
 */
export function useAutoUpdate(matches: Match[]) {
  const [autoUpdating, setAutoUpdating] = useState(false);
  const [lastAutoUpdate, setLastAutoUpdate] = useState<Date | null>(null);
  const updatingRef = useRef(false);

  const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-matches`;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const hasLiveOrPending = matches.some(
    (m) => m.status === 'live' || (m.status === 'scheduled' && new Date(m.match_date).getTime() < Date.now() + 3600000)
  );

  useEffect(() => {
    if (!hasLiveOrPending) return;

    const doUpdate = async () => {
      if (updatingRef.current) return;
      updatingRef.current = true;
      setAutoUpdating(true);
      try {
        await fetch(`${FUNCTION_URL}?action=update`, {
          headers: { Authorization: `Bearer ${ANON_KEY}` },
        });
        setLastAutoUpdate(new Date());
      } catch {
        // silent fail - UI will retry next cycle
      }
      setAutoUpdating(false);
      updatingRef.current = false;
    };

    // Run immediately, then every 60s
    doUpdate();
    const interval = setInterval(doUpdate, 60000);
    return () => clearInterval(interval);
  }, [hasLiveOrPending, FUNCTION_URL, ANON_KEY]);

  return { autoUpdating, lastAutoUpdate };
}
