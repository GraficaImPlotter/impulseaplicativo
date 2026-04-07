-- Create drone_service_logs table for chat/history
CREATE TABLE IF NOT EXISTS public.drone_service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drone_service_id UUID REFERENCES public.drone_services(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.drone_service_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for logs
CREATE POLICY "Enable all for authenticated users on logs" ON public.drone_service_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_drone_logs_service_id ON public.drone_service_logs(drone_service_id);
