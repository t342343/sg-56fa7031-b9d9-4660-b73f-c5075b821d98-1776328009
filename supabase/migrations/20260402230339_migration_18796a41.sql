-- Füge original_amount_eur Spalte hinzu für echten Einzahlungsbetrag
ALTER TABLE transactions
ADD COLUMN original_amount_eur NUMERIC(20, 8);

-- Migriere bestehende Daten: original = aktueller amount
UPDATE transactions
SET original_amount_eur = amount_eur
WHERE original_amount_eur IS NULL;

-- Mache Spalte NOT NULL
ALTER TABLE transactions
ALTER COLUMN original_amount_eur SET NOT NULL;