-- Erstelle ultra-einfache Policies ohne jegliche Rekursion
-- Jeder kann sein eigenes Profil lesen
CREATE POLICY "allow_read_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Jeder kann sein eigenes Profil erstellen
CREATE POLICY "allow_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Jeder kann sein eigenes Profil aktualisieren
CREATE POLICY "allow_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);