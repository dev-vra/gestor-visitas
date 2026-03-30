-- Copie e cole este script no SQL Editor do Supabase para ativar a função de troca de senha administrativa.
-- Esta função permite que um GESTOR altere a senha de qualquer outro usuário no sistema.

CREATE OR REPLACE FUNCTION admin_update_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função ignore o RLS e edite a tabela auth.users
SET search_path = public, auth
AS $$
DECLARE
    is_gestor BOOLEAN;
BEGIN
    -- 1. Verifica se o usuário atual (quem chama o RPC) tem o cargo de 'gestor'
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'gestor'
    ) INTO is_gestor;

    IF NOT is_gestor THEN
        RAISE EXCEPTION 'Apenas gestores podem realizar esta ação.';
    END IF;

    -- 2. Atualiza a senha na tabela auth.users do Supabase
    -- Nota: O Supabase exige que a senha seja criptografada usando crypt() da extensão pgcrypto
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = target_user_id;

    -- 3. (Opcional) Força o usuário a trocar a senha no próximo login se desejar
    -- UPDATE public.profiles SET must_change_password = true WHERE id = target_user_id;

    RETURN json_build_object('status', 'success', 'message', 'Senha atualizada com sucesso.');
END;
$$;

-- Dá permissão para usuários autenticados chamarem a função via RPC
GRANT EXECUTE ON FUNCTION admin_update_user_password TO authenticated;
