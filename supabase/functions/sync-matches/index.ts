import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_KEY = Deno.env.get("API_FOOTBALL_KEY") || "43fa1d43d0e78c710a612a1ca04dd35787ec0dc037399f16a96adfd1cf5600b4";

// Top European leagues + national team competitions
const LEAGUE_IDS = [
  // Club leagues
  "152",  // Premier League (England)
  "302",  // La Liga (Spain)
  "207",  // Serie A (Italy)
  "175",  // Bundesliga (Germany)
  "168",  // Ligue 1 (France)
  "57",   // Primeira Liga (Portugal)
  "37",   // Eredivisie (Netherlands)
  "148",  // Jupiler Pro League (Belgium)
  // National team competitions
  "633",  // UEFA Nations League
  "7098", // Africa Cup of Nations Qualification
  "664",  // Concacaf Nations League
  "27",   // CONMEBOL World Cup Qualifiers (South America)
  "24",   // UEFA World Cup Qualifiers (Europe)
  "22",   // AFC World Cup Qualifiers (Asia)
  "21",   // CAF World Cup Qualifiers (Africa)
  "23",   // Concacaf World Cup Qualifiers (N/C America)
  "26",   // OFC World Cup Qualifiers (Oceania)
  "29",   // CAF Africa Cup of Nations
  "17",   // CONMEBOL Copa America
  "15",   // Concacaf Gold Cup
  "347",  // AFC Asian Cup
  "478",  // Gulf Cup of Nations
  "28",   // FIFA World Cup
  "354",  // UEFA European Championship Qualifiers
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "sync";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "sync") {
      return await syncTopMatches(supabase);
    } else if (action === "update") {
      return await updateResults(supabase);
    } else if (action === "h2h") {
      const homeId = url.searchParams.get("homeId");
      const awayId = url.searchParams.get("awayId");
      if (!homeId || !awayId) {
        return jsonResponse({ error: "homeId and awayId required" }, 400);
      }
      return await fetchH2H(homeId, awayId);
    } else if (action === "insights") {
      return await generateInsights(supabase);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchApiEvents(dateFrom: string, dateTo: string, leagueId: string) {
  const apiUrl = `https://apiv3.apifootball.com/?action=get_events&from=${dateFrom}&to=${dateTo}&league_id=${leagueId}&APIkey=${API_KEY}`;
  const resp = await fetch(apiUrl);
  const data = await resp.json();
  if (Array.isArray(data)) return data;
  if (data && data.error === 404) return [];
  throw new Error(`APIFootball league ${leagueId}: ${JSON.stringify(data).slice(0, 200)}`);
}

async function fetchH2H(homeId: string, awayId: string) {
  const apiUrl = `https://apiv3.apifootball.com/?action=get_H2H&firstTeamId=${homeId}&secondTeamId=${awayId}&APIkey=${API_KEY}`;
  const resp = await fetch(apiUrl);
  const data = await resp.json();

  const h2h = (data.firstTeam_VS_secondTeam || []).map((m: any) => ({
    date: m.match_date,
    home: m.match_hometeam_name,
    away: m.match_awayteam_name,
    home_score: m.match_hometeam_score,
    away_score: m.match_awayteam_score,
    league: m.league_name || "",
  }));

  const homeLast = (data.firstTeam_lastResults || []).map((m: any) => ({
    date: m.match_date,
    home: m.match_hometeam_name,
    away: m.match_awayteam_name,
    home_score: m.match_hometeam_score,
    away_score: m.match_awayteam_score,
    league: m.league_name || "",
    status: m.match_status || "",
  }));

  const awayLast = (data.secondTeam_lastResults || []).map((m: any) => ({
    date: m.match_date,
    home: m.match_hometeam_name,
    away: m.match_awayteam_name,
    home_score: m.match_hometeam_score,
    away_score: m.match_awayteam_score,
    league: m.league_name || "",
    status: m.match_status || "",
  }));

  return jsonResponse({ h2h, homeLast, awayLast });
}

function mapStatus(apiStatus: string): "scheduled" | "live" | "finished" {
  const s = apiStatus.toLowerCase();
  if (s === "ft" || s === "finished" || s === "aet" || s === "pen.") return "finished";
  if (s === "not started" || s === "ns" || s === "") return "scheduled";
  return "live";
}

async function syncTopMatches(supabase: any) {
  const dateFrom = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const dateTo = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  let allEvents: any[] = [];
  const leagueResults: Record<string, number> = {};

  for (const leagueId of LEAGUE_IDS) {
    try {
      const events = await fetchApiEvents(dateFrom, dateTo, leagueId);
      leagueResults[leagueId] = events.length;
      allEvents = allEvents.concat(events);
    } catch {
      leagueResults[leagueId] = -1;
    }
  }

  const seen = new Set<string>();
  allEvents = allEvents.filter((ev) => {
    if (seen.has(ev.match_id)) return false;
    seen.add(ev.match_id);
    return true;
  });

  let inserted = 0;
  let updated = 0;

  for (const ev of allEvents) {
    const apiMatchId = ev.match_id;
    if (!apiMatchId) continue;

    const matchDate = ev.match_date && ev.match_time
      ? `${ev.match_date}T${ev.match_time}:00`
      : ev.match_date
      ? `${ev.match_date}T00:00:00`
      : null;
    if (!matchDate) continue;

    const { data: existing } = await supabase
      .from("matches")
      .select("id")
      .eq("api_match_id", apiMatchId)
      .maybeSingle();

    const matchData: any = {
      home_team: ev.match_hometeam_name || "Unknown",
      away_team: ev.match_awayteam_name || "Unknown",
      league: ev.league_name || ev.country_name || "Unknown League",
      match_date: matchDate,
      home_score: ev.match_hometeam_score !== "" && ev.match_hometeam_score != null ? parseInt(ev.match_hometeam_score) : null,
      away_score: ev.match_awayteam_score !== "" && ev.match_awayteam_score != null ? parseInt(ev.match_awayteam_score) : null,
      status: mapStatus(ev.match_status || ""),
      api_match_id: apiMatchId,
      home_team_logo: ev.team_home_badge || null,
      away_team_logo: ev.team_away_badge || null,
      home_team_api_id: ev.match_hometeam_id || null,
      away_team_api_id: ev.match_awayteam_id || null,
    };

    if (ev.statistics && Array.isArray(ev.statistics)) {
      matchData.match_statistics = ev.statistics;
    }

    if (existing) {
      const { error } = await supabase
        .from("matches")
        .update(matchData)
        .eq("id", existing.id);
      if (!error) updated++;
    } else {
      const { error } = await supabase
        .from("matches")
        .insert(matchData);
      if (!error) inserted++;
    }
  }

  if (inserted > 0 || updated > 0) {
    await recalculatePoints(supabase);
  }

  return jsonResponse({ inserted, updated, total: allEvents.length, dateFrom, dateTo, leagueResults });
}

async function updateResults(supabase: any) {
  const { data: pendingMatches } = await supabase
    .from("matches")
    .select("id, api_match_id, match_date")
    .not("api_match_id", "is", null)
    .neq("status", "finished");

  if (!pendingMatches || pendingMatches.length === 0) {
    return jsonResponse({ updated: 0, message: "No pending matches to update" });
  }

  const dateFrom = new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10);
  const dateTo = new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10);

  let allEvents: any[] = [];
  for (const leagueId of LEAGUE_IDS) {
    try {
      const events = await fetchApiEvents(dateFrom, dateTo, leagueId);
      allEvents = allEvents.concat(events);
    } catch {
      // skip
    }
  }

  const eventMap = new Map(allEvents.map((ev: any) => [ev.match_id, ev]));

  let updated = 0;
  let statsUpdated = 0;

  for (const match of pendingMatches) {
    const ev = eventMap.get(match.api_match_id);
    if (!ev) continue;

    const newStatus = mapStatus(ev.match_status || "");
    const homeScore = ev.match_hometeam_score !== "" && ev.match_hometeam_score != null ? parseInt(ev.match_hometeam_score) : null;
    const awayScore = ev.match_awayteam_score !== "" && ev.match_awayteam_score != null ? parseInt(ev.match_awayteam_score) : null;

    const updateData: any = {
      home_score: homeScore,
      away_score: awayScore,
      status: newStatus,
    };

    if (ev.statistics && Array.isArray(ev.statistics)) {
      updateData.match_statistics = ev.statistics;
      statsUpdated++;
    }

    const { error } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", match.id);

    if (!error) updated++;
  }

  if (updated > 0) {
    await recalculatePoints(supabase);
  }

  return jsonResponse({ updated, statsUpdated, total: pendingMatches.length });
}

async function recalculatePoints(supabase: any) {
  const { data: finishedMatches } = await supabase
    .from("matches")
    .select("id, home_score, away_score")
    .eq("status", "finished");

  if (!finishedMatches || finishedMatches.length === 0) return;

  for (const match of finishedMatches) {
    if (match.home_score === null || match.away_score === null) continue;

    const { data: preds } = await supabase
      .from("predictions")
      .select("id, predicted_home_score, predicted_away_score")
      .eq("match_id", match.id);

    if (!preds || preds.length === 0) continue;

    for (const pred of preds) {
      let points = 0;
      const exact = pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score;
      const predResult = Math.sign(pred.predicted_home_score - pred.predicted_away_score);
      const actualResult = Math.sign(match.home_score - match.away_score);

      if (exact) points = 3;
      else if (predResult === actualResult) points = 1;

      await supabase
        .from("predictions")
        .update({ points })
        .eq("id", pred.id);
    }
  }
}

interface TeamForm {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string[];
}

function analyzeForm(matches: any[], teamId: string): TeamForm {
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  const form: string[] = [];

  for (const m of matches) {
    const isHome = String(m.match_hometeam_id) === String(teamId);
    const homeScore = parseInt(m.match_hometeam_score) || 0;
    const awayScore = parseInt(m.match_awayteam_score) || 0;
    const myScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;

    goalsFor += myScore;
    goalsAgainst += oppScore;

    if (myScore > oppScore) { wins++; form.push("G"); }
    else if (myScore < oppScore) { losses++; form.push("P"); }
    else { draws++; form.push("E"); }
  }

  return { wins, draws, losses, goalsFor, goalsAgainst, form };
}

interface Insight {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  type: "form" | "h2h_dominance" | "goal_machine" | "defensive_wall" | "streak" | "upset_alert";
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  pick: string;
}

async function generateInsights(supabase: any) {
  // Get upcoming matches (scheduled or live) with team API IDs
  const { data: upcoming } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["scheduled", "live"])
    .not("home_team_api_id", "is", null)
    .not("away_team_api_id", "is", null)
    .order("match_date", { ascending: true })
    .limit(20);

  if (!upcoming || upcoming.length === 0) {
    return jsonResponse({ insights: [], message: "No upcoming matches with team data" });
  }

  const insights: Insight[] = [];

  for (const match of upcoming) {
    try {
      const h2hResp = await fetch(
        `https://apiv3.apifootball.com/?action=get_H2H&firstTeamId=${match.home_team_api_id}&secondTeamId=${match.away_team_api_id}&APIkey=${API_KEY}`
      );
      const h2hData = await h2hResp.json();

      const homeLast = h2hData.firstTeam_lastResults || [];
      const awayLast = h2hData.secondTeam_lastResults || [];
      const h2h = h2hData.firstTeam_VS_secondTeam || [];

      const homeForm = analyzeForm(homeLast, match.home_team_api_id);
      const awayForm = analyzeForm(awayLast, match.away_team_api_id);

      // Insight: Strong form advantage
      const homeWinPct = homeLast.length > 0 ? homeForm.wins / homeLast.length : 0;
      const awayWinPct = awayLast.length > 0 ? awayForm.wins / awayLast.length : 0;

      if (homeWinPct >= 0.6 && awayWinPct <= 0.3 && homeLast.length >= 5) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "form",
          title: `${match.home_team} en racha`,
          description: `${match.home_team} viene de ${homeForm.wins}V-${homeForm.draws}E-${homeForm.losses}D en sus ultimos ${homeLast.length} partidos, mientras ${match.away_team} solo ${awayForm.wins}V-${awayForm.draws}E-${awayForm.losses}D.`,
          confidence: homeWinPct >= 0.7 ? "high" : "medium",
          pick: `Victoria ${match.home_team}`,
        });
      }

      if (awayWinPct >= 0.6 && homeWinPct <= 0.3 && awayLast.length >= 5) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "form",
          title: `${match.away_team} visitante peligroso`,
          description: `${match.away_team} viene de ${awayForm.wins}V-${awayForm.draws}E-${awayForm.losses}D en sus ultimos ${awayLast.length} partidos. ${match.home_team} solo ${homeForm.wins}V-${homeForm.draws}E-${homeForm.losses}D.`,
          confidence: awayWinPct >= 0.7 ? "high" : "medium",
          pick: `Victoria ${match.away_team}`,
        });
      }

      // Insight: H2H dominance
      if (h2h.length >= 3) {
        let homeWins = 0, awayWins = 0, draws = 0;
        for (const m of h2h) {
          const hs = parseInt(m.match_hometeam_score) || 0;
          const as = parseInt(m.match_awayteam_score) || 0;
          const homeIsHome = m.match_hometeam_name === match.home_team;
          if (homeIsHome) {
            if (hs > as) homeWins++;
            else if (hs < as) awayWins++;
            else draws++;
          } else {
            if (hs > as) awayWins++;
            else if (hs < as) homeWins++;
            else draws++;
          }
        }
        if (homeWins >= 3 && homeWins > awayWins) {
          insights.push({
            match_id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            league: match.league,
            match_date: match.match_date,
            type: "h2h_dominance",
            title: `Dominio historico de ${match.home_team}`,
            description: `En ${h2h.length} enfrentamientos: ${match.home_team} gano ${homeWins}, ${match.away_team} gano ${awayWins}, ${draws} empates.`,
            confidence: homeWins >= 4 ? "high" : "medium",
            pick: `Victoria o empate ${match.home_team}`,
          });
        }
        if (awayWins >= 3 && awayWins > homeWins) {
          insights.push({
            match_id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            league: match.league,
            match_date: match.match_date,
            type: "h2h_dominance",
            title: `${match.away_team} domina el historial`,
            description: `En ${h2h.length} enfrentamientos: ${match.away_team} gano ${awayWins}, ${match.home_team} gano ${homeWins}, ${draws} empates.`,
            confidence: awayWins >= 4 ? "high" : "medium",
            pick: `Victoria o empate ${match.away_team}`,
          });
        }
      }

      // Insight: Goal machine (both teams scoring lots)
      const homeAvgGoals = homeLast.length > 0 ? homeForm.goalsFor / homeLast.length : 0;
      const awayAvgGoals = awayLast.length > 0 ? awayForm.goalsFor / awayLast.length : 0;
      const homeAvgConceded = homeLast.length > 0 ? homeForm.goalsAgainst / homeLast.length : 0;
      const awayAvgConceded = awayLast.length > 0 ? awayForm.goalsAgainst / awayLast.length : 0;

      if (homeAvgGoals >= 2 && awayAvgGoals >= 2) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "goal_machine",
          title: `Partido de goles esperado`,
          description: `${match.home_team} promedia ${homeAvgGoals.toFixed(1)} goles a favor y ${match.away_team} ${awayAvgGoals.toFixed(1)}. Ambos equipos anotan con frecuencia.`,
          confidence: homeAvgGoals >= 2.5 && awayAvgGoals >= 2.5 ? "high" : "medium",
          pick: "Mas de 2.5 goles",
        });
      }

      // Insight: Defensive wall (both conceding little)
      if (homeAvgConceded <= 0.5 && awayAvgConceded <= 0.5 && homeLast.length >= 5 && awayLast.length >= 5) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "defensive_wall",
          title: `Partido de pocos goles`,
          description: `${match.home_team} recibe solo ${homeAvgConceded.toFixed(1)} goles por partido y ${match.away_team} ${awayAvgConceded.toFixed(1)}. Defensas solidas.`,
          confidence: homeAvgConceded <= 0.3 && awayAvgConceded <= 0.3 ? "high" : "medium",
          pick: "Menos de 2.5 goles",
        });
      }

      // Insight: Winning/losing streak
      const homeStreak = homeForm.form.join("");
      const awayStreak = awayForm.form.join("");

      const homeWinStreak = homeStreak.match(/G+$/)?.[0]?.length || 0;
      const awayWinStreak = awayStreak.match(/G+$/)?.[0]?.length || 0;
      const homeLossStreak = homeStreak.match(/P+$/)?.[0]?.length || 0;
      const awayLossStreak = awayStreak.match(/P+$/)?.[0]?.length || 0;

      if (homeWinStreak >= 3) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "streak",
          title: `${match.home_team} con ${homeWinStreak} victorias seguidas`,
          description: `${match.home_team} viene encadenando ${homeWinStreak} victorias consecutivas. Momento dulce.`,
          confidence: homeWinStreak >= 4 ? "high" : "medium",
          pick: `Victoria ${match.home_team}`,
        });
      }
      if (awayWinStreak >= 3) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "streak",
          title: `${match.away_team} con ${awayWinStreak} victorias seguidas`,
          description: `${match.away_team} viene encadenando ${awayWinStreak} victorias consecutivas. Llega en racha.`,
          confidence: awayWinStreak >= 4 ? "high" : "medium",
          pick: `Victoria ${match.away_team}`,
        });
      }
      if (homeLossStreak >= 3) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "upset_alert",
          title: `${match.home_team} en crisis`,
          description: `${match.home_team} acumula ${homeLossStreak} derrotas seguidas. Alerta de sorpresa.`,
          confidence: homeLossStreak >= 4 ? "high" : "medium",
          pick: `Victoria ${match.away_team}`,
        });
      }
      if (awayLossStreak >= 3) {
        insights.push({
          match_id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          league: match.league,
          match_date: match.match_date,
          type: "upset_alert",
          title: `${match.away_team} llega tocado`,
          description: `${match.away_team} acumula ${awayLossStreak} derrotas seguidas. Aprovecha ${match.home_team}.`,
          confidence: awayLossStreak >= 4 ? "high" : "medium",
          pick: `Victoria ${match.home_team}`,
        });
      }
    } catch {
      // skip this match if H2H fails
    }
  }

  // Sort: high confidence first
  const confOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => confOrder[a.confidence] - confOrder[b.confidence]);

  return jsonResponse({ insights, total: upcoming.length });
}
