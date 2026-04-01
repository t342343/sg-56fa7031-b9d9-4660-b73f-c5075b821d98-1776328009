-- Füge withdrawal_address Spalte zur transactions Tabelle hinzu
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS withdrawal_address TEXT;

COMMENT ON COLUMN transactions.withdrawal_address IS 'Bitcoin Wallet-Adresse für die Auszahlung';