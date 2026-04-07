-- Create cost_centers table
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cost_centers
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON public.cost_centers FOR ALL TO authenticated USING (true);

-- Add advanced fields to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS competence_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS reference_code TEXT,
ADD COLUMN IF NOT EXISTS nsu TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS installment_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_installments INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence TEXT;

-- Index for grouped installments
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON public.transactions(parent_id);

-- Create transaction_splits table for "Rateio"
CREATE TABLE IF NOT EXISTS public.transaction_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE CASCADE NOT NULL,
    percentage DECIMAL(5,2),
    amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for transaction_splits
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON public.transaction_splits FOR ALL TO authenticated USING (true);

-- Seed some default cost centers
INSERT INTO public.cost_centers (name) VALUES 
('Geral'),
('Marketing'),
('Operacional'),
('Vendas'),
('Administrativo')
ON CONFLICT DO NOTHING;
