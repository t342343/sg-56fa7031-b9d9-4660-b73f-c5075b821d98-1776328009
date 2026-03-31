-- Erweitere profiles Tabelle um Finanzportal-Felder
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Erstelle bitcoin_wallets Tabelle
CREATE TABLE IF NOT EXISTS bitcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_assigned_by FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Erstelle transactions Tabelle
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES bitcoin_wallets(id) ON DELETE CASCADE,
  txid TEXT NOT NULL UNIQUE,
  amount_btc NUMERIC(16, 8) NOT NULL,
  eur_rate NUMERIC(12, 2) NOT NULL,
  amount_eur NUMERIC(12, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  block_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES bitcoin_wallets(id) ON DELETE CASCADE
);

-- Enable RLS für neue Tabellen
ALTER TABLE bitcoin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies für bitcoin_wallets
CREATE POLICY "Admins can view all wallets" ON bitcoin_wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own wallet" ON bitcoin_wallets FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Admins can insert wallets" ON bitcoin_wallets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update wallets" ON bitcoin_wallets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete wallets" ON bitcoin_wallets FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies für transactions
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their wallet transactions" ON transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bitcoin_wallets 
    WHERE bitcoin_wallets.id = transactions.wallet_id 
    AND bitcoin_wallets.user_id = auth.uid()
  )
);

CREATE POLICY "Only system can insert transactions" ON transactions FOR INSERT WITH CHECK (false);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_wallets_user ON bitcoin_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Kommentar zur Transaction-Insertion Policy:
-- INSERT wird via Service Key (Backend) gemacht, nicht direkt von Clients
-- Deshalb ist die Policy auf false gesetzt für maximale Sicherheit