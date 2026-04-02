-- Policy entfernen, da RLS bereits deaktiviert ist
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;