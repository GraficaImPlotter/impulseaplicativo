-- Create financial_accounts table
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'CORRENTE', -- CORRENTE, POUPANCA, CAIXA, INVESTIMENTO
    active BOOLEAN DEFAULT true,
    color TEXT,
    initial_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add account_id to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.financial_accounts(id);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for financial_accounts
CREATE POLICY "Allow public select for accounts" ON public.financial_accounts
    FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated users on accounts" ON public.financial_accounts
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert a default account
INSERT INTO public.financial_accounts (name, type, active)
VALUES ('Caixa Geral', 'CAIXA', true)
ON CONFLICT DO NOTHING;
