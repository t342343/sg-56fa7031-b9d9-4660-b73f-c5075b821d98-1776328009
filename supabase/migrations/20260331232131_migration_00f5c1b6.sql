-- Deaktiviere RLS für transactions Tabelle
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Lösche alle existierenden Policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'transactions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON transactions', pol.policyname);
    END LOOP;
END $$;