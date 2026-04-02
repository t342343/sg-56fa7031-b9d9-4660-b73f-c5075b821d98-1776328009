-- Entferne die gerade hinzugefügte Spalte
ALTER TABLE transactions
DROP COLUMN IF EXISTS original_amount_eur;