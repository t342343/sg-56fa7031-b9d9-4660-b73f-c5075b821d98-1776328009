-- Füge countdown_days zu bitcoin_wallets hinzu
ALTER TABLE bitcoin_wallets 
ADD COLUMN IF NOT EXISTS countdown_days INTEGER DEFAULT 14;

-- Füge neue Spalten zu transactions hinzu
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_extended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'withdrawn'));

-- Update existing transactions to set expires_at
UPDATE transactions
SET expires_at = timestamp + INTERVAL '14 days'
WHERE expires_at IS NULL;