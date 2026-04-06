ALTER TABLE public.bitcoin_wallets
ADD COLUMN IF NOT EXISTS countdown_days INTEGER DEFAULT 30;

NOTIFY pgrst, 'reload schema';