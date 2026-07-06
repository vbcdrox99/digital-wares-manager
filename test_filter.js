import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jlghsevsildatnjhediw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZ2hzZXZzaWxkYXRuamhlZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDU1MDEsImV4cCI6MjA3MTY4MTUwMX0.xhyAfuxQM8cYy_MbEV1y3PI_txRRDVlU2QhdKjubH3k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: matches, error: errMatches } = await supabase
      .from('dota_matches')
      .select('*')
      .order('match_time', { ascending: true });
      
    if (errMatches) throw errMatches;
    
    const { data: settings, error: errSettings } = await supabase
      .from('dota_matches_settings')
      .select('*')
      .eq('id', 'default')
      .single();
      
    if (errSettings) throw errSettings;

    console.log("=== Active Settings in DB ===");
    console.log(settings);

    console.log("\n=== Filtering matches ===");
    
    const start = settings.start_date ? new Date(settings.start_date + "T00:00:00") : null;
    const end = settings.end_date ? new Date(settings.end_date + "T23:59:59") : null;
    const tournament = settings.selected_tournament || 'all';

    console.log("start:", start);
    console.log("end:", end);
    console.log("tournament filter:", tournament);

    const relevant = matches.filter(m => {
      const safeTimeStr = m.match_time ? m.match_time.replace(' ', 'T') : '';
      const mDate = new Date(safeTimeStr);
      
      if (isNaN(mDate.getTime())) {
        console.log(`[NaN Date] ${m.team1} vs ${m.team2} (${m.match_time})`);
        return true;
      }
      
      if (m.status === 'live') {
        console.log(`[LIVE] ${m.team1} vs ${m.team2} (${m.match_time})`);
        return true;
      }

      if (tournament !== 'all' && m.tournament_name !== tournament) {
        return false;
      }

      if (start && mDate < start) {
        return false;
      }
      if (end && mDate > end) {
        return false;
      }

      return true;
    });

    console.log(`\nFiltered down from ${matches.length} matches to ${relevant.length} matches.`);
    relevant.forEach(r => {
      console.log(`- [${r.status}] ${r.team1} vs ${r.team2} @ ${r.match_time} (${r.tournament_name})`);
    });

  } catch (e) {
    console.error(e);
  }
}

run();
