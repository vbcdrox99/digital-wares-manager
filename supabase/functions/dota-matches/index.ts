import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const expectedSecret = Deno.env.get('CRON_SECRET')

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let body = {}
    if (req.method === 'POST') {
      body = await req.json().catch(() => ({}))
    }
    
    const tournamentFilter = body.tournament ? body.tournament.toLowerCase() : null
    const page = 'Liquipedia:Matches' // Sempre pegar os campeonatos ativos/atuais

    // Fetch from Liquipedia MediaWiki API
    const apiUrl = `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(page)}&format=json`
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Dota Play (admin@dotaplay.com)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Liquipedia API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Liquipedia Page Error: ${data.error.info || 'Page not found'}`)
    }

    const htmlContent = data?.parse?.text?.['*']

    if (!htmlContent) {
      throw new Error('No HTML content returned from MediaWiki API')
    }

    const $ = cheerio.load(htmlContent)
    const matches: any[] = []

    $('.match-info').each((_, element) => {
      const matchRow = $(element)
      
      const team1 = matchRow.find('.match-info-header-opponent-left .name').text().trim();
      const team2 = matchRow.find('.match-info-header-opponent:not(.match-info-header-opponent-left) .name').text().trim();
      
      const logo1 = matchRow.find('.match-info-header-opponent-left img').attr('src');
      const logo2 = matchRow.find('.match-info-header-opponent:not(.match-info-header-opponent-left) img').attr('src');
      
      const team1_logo = logo1 ? (logo1.startsWith('http') ? logo1 : `https://liquipedia.net${logo1}`) : null;
      const team2_logo = logo2 ? (logo2.startsWith('http') ? logo2 : `https://liquipedia.net${logo2}`) : null;

      let tournamentText = matchRow.find('.match-info-tournament-name').text().trim() || 'Unknown';
      if (tournamentText.includes(' - ')) {
        tournamentText = tournamentText.split(' - ')[0].trim();
      }
      
      const timerObj = matchRow.find('.timer-object')
      const timestamp = timerObj.attr('data-timestamp')
      const timerText = timerObj.text().trim()
      const formatVal = matchRow.find('.match-info-header-scoreholder-lower').text().trim().replace(/[()]/g, '')

      if (tournamentFilter && !tournamentText.toLowerCase().includes(tournamentFilter)) {
        return;
      }

      if (team1 && team2) {
        let dateObj = new Date()
        if (timestamp) {
           const ts = parseInt(timestamp)
           if (!isNaN(ts)) {
               dateObj = new Date(ts * 1000)
           }
        }
        
        const isLive = timerText.toLowerCase().includes('live');
        const scoreText = matchRow.find('.match-info-header-scoreholder-upper').text().trim();
        const isCompleted = !isLive && scoreText !== 'vs';

        let score1 = null;
        let score2 = null;
        if (scoreText && scoreText !== 'vs') {
          const cleanScore = scoreText.replace(/\s+/g, '').replace(/[-–—]/g, ':');
          const parts = cleanScore.split(':');
          if (parts.length === 2) {
            const s1 = parseInt(parts[0]);
            const s2 = parseInt(parts[1]);
            if (!isNaN(s1) && !isNaN(s2)) {
              score1 = s1;
              score2 = s2;
            }
          }
        }

        matches.push({
          tournament_name: tournamentText,
          team1: team1.replace('(page does not exist)', '').trim(),
          team2: team2.replace('(page does not exist)', '').trim(),
          team1_logo,
          team2_logo,
          match_time: dateObj.toISOString(),
          status: isLive ? 'live' : (isCompleted ? 'completed' : 'upcoming'),
          format: formatVal || 'Bo3',
          score1,
          score2
        })
      }
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (supabaseUrl && supabaseKey && matches.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      if (tournamentFilter) {
         await supabase.from('dota_matches').delete().ilike('tournament_name', `%${tournamentFilter}%`)
      } else {
         // Apaga partidas anteriores
         await supabase.from('dota_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
      }
      
      const { error: insertError } = await supabase.from('dota_matches').insert(
        matches.map(m => ({
          tournament_name: m.tournament_name,
          team1: m.team1,
          team2: m.team2,
          team1_logo: m.team1_logo,
          team2_logo: m.team2_logo,
          match_time: m.match_time,
          status: m.status,
          format: m.format,
          score1: m.score1,
          score2: m.score2
        }))
      )
      
      if (insertError) {
        throw new Error(`DB Insert Error: ${insertError.message}`)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: matches.length, 
      matches 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
