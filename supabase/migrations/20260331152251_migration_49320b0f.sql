-- Lösche die fehlerhafte Policy und erstelle sie richtig
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Neue Policy mit korrekter auth.uid() Funktion
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);