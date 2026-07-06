-- Habilita as extensões necessárias para o agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agenda ou atualiza a execução da Edge Function dota-matches a cada 10 minutos
SELECT cron.schedule(
  'fetch-dota-matches-every-10-minutes',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jlghsevsildatnjhediw.supabase.co/functions/v1/dota-matches',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
