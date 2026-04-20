-- Atualização da política de visibilidade de cargos para permitir que Engenheiros e outros vejam a lista de técnicos
-- Data: 2026-04-20

-- Remover a política antiga restritiva
DROP POLICY IF EXISTS "roles_select_own" ON public.user_roles;

-- Criar uma nova política que permite que qualquer usuário autenticado veja os cargos
-- Isso é necessário para que a lista de técnicos apareça para quem está criando uma OS (ex: ENGENHEIRO)
CREATE POLICY "roles_select_all" ON public.user_roles 
    FOR SELECT TO authenticated 
    USING (true);
