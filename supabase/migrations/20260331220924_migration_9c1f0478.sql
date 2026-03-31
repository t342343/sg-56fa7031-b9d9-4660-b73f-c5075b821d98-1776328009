-- SCHRITT 1: Deaktiviere RLS komplett
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- SCHRITT 2: Lösche ALLE Policies (falls noch welche existieren)
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