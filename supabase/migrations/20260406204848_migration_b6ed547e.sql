-- Schritt 5: Füge die Spalte für die Auszahlungsadresse hinzu
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawal_address text;