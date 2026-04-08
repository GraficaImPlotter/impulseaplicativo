-- Add missing cost_center text column to transactions
-- The form sends cost_center as a plain text label (not the FK cost_center_id)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS cost_center TEXT;

-- Also ensure payment_method exists (used in the form as well)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Ensure notes column exists
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS notes TEXT;
