-- Migração de Endurecimento de Segurança (Securiryt Hardening)
-- Baseado nos relatórios de vulnerabilidade do Supabase
-- Data: 2026-04-16

-- 1. Ativação de RLS (Row Level Security) em tabelas críticas onde está desativado
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_settings ENABLE ROW LEVEL SECURITY;

-- 2. Correção de segurança em funções (Mutable Search Path)
-- Isso evita ataques de sequestro de caminho ao executar funções como SECURITY DEFINER.
ALTER FUNCTION public.generate_os_display_code() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;

-- 3. Refinamento de políticas "Always True" para serem mais restritivas
-- Nota: Usamos DROP POLICY seguido de CREATE POLICY para garantir a atualização.

-- A. Drone Services (Não permitir que qualquer um apague/edite tudo)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.drone_services;

CREATE POLICY "drone_services_select" ON public.drone_services 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "drone_services_insert" ON public.drone_services 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "drone_services_update" ON public.drone_services 
    FOR UPDATE TO authenticated USING (
        auth.uid() = created_by OR 
        auth.uid() = technician_id OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
    );

CREATE POLICY "drone_services_delete" ON public.drone_services 
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
    );

-- B. Drone Service Logs (Histórico/Chat de Drone)
DROP POLICY IF EXISTS "Enable all for authenticated users on logs" ON public.drone_service_logs;

CREATE POLICY "drone_logs_select" ON public.drone_service_logs 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "drone_logs_insert" ON public.drone_service_logs 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "drone_logs_delete" ON public.drone_service_logs 
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
    );

-- C. Suporte (Chat DEV/Telegram)
DROP POLICY IF EXISTS "Anyone can view messages" ON public.dev_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.dev_chat_messages;

CREATE POLICY "dev_messages_select" ON public.dev_chat_messages 
    FOR SELECT TO authenticated USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
    );

CREATE POLICY "dev_messages_insert" ON public.dev_chat_messages 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- D. Questionários (Se existirem)
DO $$ 
BEGIN
    -- service_order_questionnaire_templates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_order_questionnaire_templates') THEN
        ALTER TABLE public.service_order_questionnaire_templates ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Enable all" ON public.service_order_questionnaire_templates;
        
        CREATE POLICY "templates_select" ON public.service_order_questionnaire_templates FOR SELECT TO authenticated USING (true);
        CREATE POLICY "templates_manage" ON public.service_order_questionnaire_templates FOR ALL USING (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
        );
    END IF;

    -- service_order_questionnaire_responses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_order_questionnaire_responses') THEN
        ALTER TABLE public.service_order_questionnaire_responses ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Enable all" ON public.service_order_questionnaire_responses;
        
        CREATE POLICY "responses_select" ON public.service_order_questionnaire_responses FOR SELECT TO authenticated USING (true);
        CREATE POLICY "responses_insert" ON public.service_order_questionnaire_responses FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "responses_update" ON public.service_order_questionnaire_responses FOR UPDATE TO authenticated USING (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
        );
    END IF;
END $$;

-- 4. Endurecimento de Storage (Buckets)
-- O Supabase alertou que o bucket permite listagem pública de arquivos.
-- Vamos restringir para usuários autenticados e impedir a listagem anônima.

-- chat-attachments
DROP POLICY IF EXISTS "Allow public read access support" ON storage.objects;
CREATE POLICY "authenticated_read_chat_attachments" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-attachments');

-- support-attachments (nome que apareceu no relatório)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'support-attachments') THEN
        DROP POLICY IF EXISTS "Allow public read" ON storage.objects; -- Nome genérico provável
        CREATE POLICY "authenticated_read_support_attachments" 
        ON storage.objects FOR SELECT 
        TO authenticated 
        USING (bucket_id = 'support-attachments');
    END IF;
END $$;

-- 5. Proteção Adicional para user_roles (Garantir que ninguém mude o próprio cargo sem ser MASTER)
DROP POLICY IF EXISTS "Masters can update roles" ON public.user_roles;
CREATE POLICY "Masters can update roles" ON public.user_roles 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DEV'))
    );
