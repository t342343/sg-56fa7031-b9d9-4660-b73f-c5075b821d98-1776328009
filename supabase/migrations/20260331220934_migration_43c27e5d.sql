-- SCHRITT 3: Aktiviere RLS wieder mit den EINFACHSTEN Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Jeder kann sein eigenes Profil lesen
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Jeder kann sein eigenes Profil erstellen
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy 3: Jeder kann sein eigenes Profil aktualisieren
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());