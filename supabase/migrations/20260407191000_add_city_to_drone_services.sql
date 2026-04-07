-- Add missing client_address_city column to drone_services
ALTER TABLE public.drone_services
    ADD COLUMN IF NOT EXISTS client_address_city TEXT;
