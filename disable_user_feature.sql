-- ============================================================================
-- FUNCIONALIDADE: DESABILITAR / REABILITAR USUÁRIOS
-- Copie e cole este script no SQL Editor do Supabase.
--
-- Diferente de "Excluir", desabilitar mantém o cadastro e o histórico do
-- usuário, apenas impede que ele faça login. Usamos o campo nativo
-- auth.users.banned_until do Supabase, que bloqueia a autenticação, e
-- espelhamos o estado em public.profiles.is_active para uso na interface.
-- ============================================================================

-- 1. Coluna de status no perfil (usada apenas para exibição/filtragem na UI)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_active IS
  'false = usuário desabilitado (login bloqueado via auth.users.banned_until)';

-- 2. Função RPC para gestores desabilitarem/reabilitarem um usuário
CREATE OR REPLACE FUNCTION admin_set_user_active(
  target_user_id UUID,
  active BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Ignora RLS para editar auth.users e profiles
SET search_path = public, auth
AS $$
DECLARE
    is_gestor BOOLEAN;
BEGIN
    -- Verifica se quem chama é gestor
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'gestor'
    ) INTO is_gestor;

    IF NOT is_gestor THEN
        RAISE EXCEPTION 'Apenas gestores podem realizar esta ação.';
    END IF;

    -- Impede que o gestor desabilite a si mesmo
    IF target_user_id = auth.uid() AND active = false THEN
        RAISE EXCEPTION 'Você não pode desabilitar a sua própria conta.';
    END IF;

    -- Bloqueia (ou libera) o login no Supabase Auth.
    -- banned_until no futuro distante = login bloqueado; NULL = login liberado.
    UPDATE auth.users
    SET banned_until = CASE WHEN active THEN NULL ELSE 'infinity'::timestamptz END,
        updated_at = now()
    WHERE id = target_user_id;

    -- Espelha o estado no perfil para a interface
    UPDATE public.profiles
    SET is_active = active
    WHERE id = target_user_id;

    RETURN json_build_object(
        'status', 'success',
        'is_active', active,
        'message', CASE WHEN active
                        THEN 'Usuário reabilitado com sucesso.'
                        ELSE 'Usuário desabilitado com sucesso.' END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_set_user_active TO authenticated;

-- 3. (Opcional) Sincroniza o is_active de perfis já existentes com o estado
--    atual de banned_until, caso já existam usuários banidos manualmente.
UPDATE public.profiles p
SET is_active = (u.banned_until IS NULL OR u.banned_until <= now())
FROM auth.users u
WHERE u.id = p.id;
