-- DEAKTIVIERE RLS KOMPLETT - keine Sicherheit, aber funktionierend
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Lösche auch alle Policies zur Sicherheit
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;