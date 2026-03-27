-- Execute este script no SQL Editor do seu projeto Supabase para adicionar as novas colunas e a função do Bot.

ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS location_url TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Web';

-- Opcional: Comentários para documentação das colunas
COMMENT ON COLUMN visits.address_street IS 'Nome da rua da vistoria';
COMMENT ON COLUMN visits.address_number IS 'Número predial da vistoria';
COMMENT ON COLUMN visits.location_url IS 'Link do Google Maps para a localização';
COMMENT ON COLUMN visits.source IS 'Origem do registro (Web ou Bot)';

-- 1. Garante que o RLS está ativado
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 2. Regra para permitir que usuários autenticados (Gestores/Consultores) vejam e insiram via Web
-- (As regras originais permanecem as mesmas ou podem ser ajustadas aqui se necessário)

-- 3. FUNÇÃO RPC PARA BYPASS DE RLS (MÉTODO RECOMENDADO PARA O BOT)
-- Este bloco limpa todas as versões anteriores da função para evitar erros de "nome não é único"
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as args
              FROM pg_proc 
              INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
              WHERE proname = 'register_visit_from_bot' AND nspname = 'public')
    LOOP
        EXECUTE 'DROP FUNCTION public.' || quote_ident(r.proname) || '(' || r.args || ')';
    END LOOP;
END $$;

-- Criação da versão final oficial
CREATE OR REPLACE FUNCTION register_visit_from_bot(
  p_name TEXT,
  p_cpf TEXT,
  p_phone1 TEXT,
  p_city TEXT,
  p_neighborhood TEXT,
  p_address_street TEXT,
  p_address_number TEXT,
  p_phone2 TEXT DEFAULT NULL,
  p_address_block TEXT DEFAULT NULL,
  p_address_lot TEXT DEFAULT NULL,
  p_location_url TEXT DEFAULT NULL,
  p_observations TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Ignora RLS para o Bot
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.visits (
    name, cpf, phone1, phone2, city, neighborhood, 
    address_street, address_number, address_block, 
    address_lot, location_url, observations, source, status
  )
  VALUES (
    p_name, p_cpf, p_phone1, p_phone2, p_city, p_neighborhood, 
    p_address_street, p_address_number, p_address_block, 
    p_address_lot, p_location_url, p_observations, 'Bot', 'Agendar Vistoria'
  )
  RETURNING id INTO new_id;

  RETURN json_build_object('status', 'success', 'id', new_id);
END;
$$;

GRANT EXECUTE ON FUNCTION register_visit_from_bot TO anon;
