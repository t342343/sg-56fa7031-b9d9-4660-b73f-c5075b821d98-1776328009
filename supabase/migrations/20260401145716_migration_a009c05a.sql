-- Prüfe ob maturity_date existiert und füge sie hinzu falls nicht
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'maturity_date'
    ) THEN
        ALTER TABLE transactions ADD COLUMN maturity_date TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN transactions.maturity_date IS 'Fälligkeitsdatum - bis zu diesem Datum läuft die Rendite';
    END IF;
END $$;

-- Aktualisiere Schema-Cache durch NOTIFY
NOTIFY pgrst, 'reload schema';