-- Schritt 4: Füge die Spalte für den ursprünglichen Betrag bei Verlängerungen hinzu
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS extended_base_amount numeric;