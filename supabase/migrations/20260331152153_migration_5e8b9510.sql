-- Lösche die alte INSERT-Policy und erstelle eine neue, die Selbst-Registrierung erlaubt
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Neue Policy: Authentifizierte Benutzer können ihr eigenes Profil erstellen
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Stelle sicher, dass Admins alles machen können
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );