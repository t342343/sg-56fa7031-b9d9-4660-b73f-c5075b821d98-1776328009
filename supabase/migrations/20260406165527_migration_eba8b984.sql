-- 1. Erstelle bitcoin_wallets Tabelle
CREATE TABLE IF NOT EXISTS public.bitcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Erstelle transactions Tabelle
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.bitcoin_wallets(id) ON DELETE CASCADE,
  txid TEXT NOT NULL UNIQUE,
  amount_btc NUMERIC(16, 8) NOT NULL,
  eur_rate NUMERIC(12, 2) NOT NULL,
  amount_eur NUMERIC(12, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  block_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'withdrawn', 'archived')),
  maturity_days INTEGER DEFAULT 30,
  expires_at TIMESTAMP WITH TIME ZONE,
  original_deposit NUMERIC(12, 2)
);

-- 3. Erstelle chat_messages Tabelle
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Erstelle withdrawal_requests Tabelle
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  withdrawal_address TEXT NOT NULL,
  amount_btc DECIMAL(16, 8) NOT NULL,
  amount_eur DECIMAL(16, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Erstelle wallet_pool Tabelle
CREATE TABLE IF NOT EXISTS public.wallet_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  is_assigned BOOLEAN DEFAULT false,
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

-- 6. Erstelle site_settings Tabelle
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Füge grundlegende Zugriffsrechte (RLS Policies) hinzu, damit alle Funktionen im Dashboard und Admin arbeiten können
ALTER TABLE public.bitcoin_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_bitcoin_wallets" ON public.bitcoin_wallets USING (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_transactions" ON public.transactions USING (true);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_chat_messages" ON public.chat_messages USING (true);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_withdrawal_requests" ON public.withdrawal_requests USING (true);

ALTER TABLE public.wallet_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_wallet_pool" ON public.wallet_pool USING (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_site_settings" ON public.site_settings USING (true);

-- Lade Standardeinstellungen in site_settings
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES 
('btc_rate_adjustment', '0', 'Anpassung des BTC Preises in %'),
('maintenance_mode', 'false', 'Wartungsmodus aktivieren')
ON CONFLICT (setting_key) DO NOTHING;

-- Notiz an Supabase zum Aktualisieren des Schema-Caches (Behebt den "not found in schema cache" Fehler)
NOTIFY pgrst, 'reload schema';