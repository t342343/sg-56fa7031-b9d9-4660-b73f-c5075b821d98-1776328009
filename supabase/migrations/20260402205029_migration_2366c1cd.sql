-- RLS-Policy für Profil-Erstellung durch Trigger anpassen
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;

-- Neue Policy: Erlaubt INSERT wenn die ID mit auth.uid() übereinstimmt
CREATE POLICY "allow_insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);