-- Create system_updates table
CREATE TABLE IF NOT EXISTS public.system_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feature', 'fix', 'improvement', 'notice')),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create table to track read status per user
CREATE TABLE IF NOT EXISTS public.system_update_reads (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.system_updates(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, update_id)
);

-- Enable RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_update_reads ENABLE ROW LEVEL SECURITY;

-- Policies for system_updates
CREATE POLICY "Anyone can view system updates" 
    ON public.system_updates FOR SELECT 
    USING (true);

CREATE POLICY "Only MASTER and DEV can insert updates" 
    ON public.system_updates FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('MASTER'::public.app_role, 'DEV'::public.app_role)
        )
    );

-- Policies for system_update_reads
CREATE POLICY "Users can view their own read status" 
    ON public.system_update_reads FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read status" 
    ON public.system_update_reads FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
