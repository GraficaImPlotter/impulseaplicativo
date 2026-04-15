-- Add missing columns to drone_services table
DO $$ 
BEGIN
    -- Add client_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drone_services' AND column_name = 'client_id') THEN
        ALTER TABLE public.drone_services ADD COLUMN client_id UUID REFERENCES public.clients(id);
    END IF;

    -- Add opening_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drone_services' AND column_name = 'opening_date') THEN
        ALTER TABLE public.drone_services ADD COLUMN opening_date DATE DEFAULT CURRENT_DATE;
    END IF;

    -- Add execution_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drone_services' AND column_name = 'execution_date') THEN
        ALTER TABLE public.drone_services ADD COLUMN execution_date DATE;
    END IF;
END $$;
