-- 1. Habilitar a extensão pg_net (necessária para Webhooks)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Configurar o Webhook via SQL (Opcional, pode ser feito pela UI do Supabase)
-- No Dashboard: Database -> Webhooks -> Create New Webhook
-- Name: send-bot-notification
-- Table: public.visits
-- Events: Insert
-- Filter: source = 'Bot'
-- URL: (A URL gerada após o deploy da Edge Function)
-- Authorization: (O seu anon/service role key)

/* 
  DICA: Recomendamos configurar pela interface do Supabase Dashboard 
  para garantir que o cabeçalho de 'Authorization' seja configurado 
  corretamente para chamar a Edge Function.
*/

-- 3. Caso queira um gatilho SQL puro chamando a função recém-criada (Exemplo):
/*
CREATE OR REPLACE TRIGGER on_bot_visit_created
AFTER INSERT ON public.visits
FOR EACH ROW
WHEN (NEW.source = 'Bot')
EXECUTE FUNCTION supabase_functions.http_request(
  'https://<PROJECT_REF>.supabase.co/functions/v1/send-bot-notification',
  'POST',
  '{"Content-Type":"application/json", "Authorization": "Bearer <YOUR_ANON_KEY>"}',
  jsonb_build_object('record', row_to_json(NEW))
);
*/

-- 4. Exemplo de como marcar o campo source para garantir que filtros funcionem
COMMENT ON COLUMN public.visits.source IS 'Origem do registro (Web ou Bot). Usado para gatilhos de e-mail.';
