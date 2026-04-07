-- Add complement column to drone_services
ALTER TABLE public.drone_services
    ADD COLUMN IF NOT EXISTS client_address_complement TEXT;
