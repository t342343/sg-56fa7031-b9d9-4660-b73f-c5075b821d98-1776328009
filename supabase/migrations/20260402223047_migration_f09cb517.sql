-- RLS komplett deaktivieren für profiles (behebt Endlosschleife)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Alle Policies löschen die die Rekursion verursachen
DROP POLICY IF EXISTS "select_own" ON profiles;
DROP POLICY IF EXISTS "select_fresh" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "delete_own" ON profiles;
DROP POLICY IF EXISTS "admin_all" ON profiles;
DROP POLICY IF EXISTS "anon_read_own" ON profiles;