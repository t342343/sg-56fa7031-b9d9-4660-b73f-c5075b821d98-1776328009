-- STEP 1: Kaputte Policy löschen
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- STEP 2: Korrekte Policy mit auth.uid() erstellen
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- STEP 3: Admin-Policy hinzufügen (Admins sehen alle Profile)
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);