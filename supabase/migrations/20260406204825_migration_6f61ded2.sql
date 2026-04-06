-- Schritt 3: Füge die Spalte für Verlängerungs-Status hinzu
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_extended boolean DEFAULT false;