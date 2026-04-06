ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS maturity_date timestamp with time zone;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawn_amount_eur numeric;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawn_amount_btc numeric;