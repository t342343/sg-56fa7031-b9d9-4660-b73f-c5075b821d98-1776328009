-- Füge Spalten für finalen Auszahlungsbetrag hinzu
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS withdrawn_amount_eur DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS withdrawn_amount_btc DECIMAL(18, 8);

COMMENT ON COLUMN transactions.withdrawn_amount_eur IS 'Finaler Auszahlungsbetrag inkl. Rendite in EUR (zum Zeitpunkt der Genehmigung)';
COMMENT ON COLUMN transactions.withdrawn_amount_btc IS 'Finaler Auszahlungsbetrag in Bitcoin (zum aktuellen BTC-Kurs bei Genehmigung)';