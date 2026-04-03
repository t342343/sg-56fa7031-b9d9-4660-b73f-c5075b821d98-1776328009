-- Füge Spalte original_deposit hinzu für ursprünglichen Einzahlungsbetrag
ALTER TABLE transactions
ADD COLUMN original_deposit DECIMAL(20, 8);