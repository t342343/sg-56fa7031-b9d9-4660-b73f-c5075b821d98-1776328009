-- Füge neue Spalte extended_base_amount hinzu (falls nicht vorhanden)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS extended_base_amount NUMERIC;

COMMENT ON COLUMN transactions.extended_base_amount IS 'Betrag bei Verlängerung (wird nicht mehr verändert, Basis für Gewinnberechnung)';