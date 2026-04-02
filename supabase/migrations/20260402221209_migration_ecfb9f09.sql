-- Schritt 4: Alle Policies von profiles löschen
DROP POLICY IF EXISTS "select_own" ON profiles;
DROP POLICY IF EXISTS "select_fresh" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "delete_own" ON profiles;
DROP POLICY IF EXISTS "admin_all" ON profiles;
DROP POLICY IF EXISTS "anon_read_own" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;