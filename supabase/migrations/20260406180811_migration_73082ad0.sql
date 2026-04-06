-- Lösche die alte, restriktive INSERT Policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Erstelle eine neue Policy die SOWOHL User-Inserts ALS AUCH System-Inserts erlaubt
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (
    -- Entweder der User erstellt sein eigenes Profil
    auth.uid() = id
    -- ODER es ist ein System-Insert (z.B. durch den handle_new_user Trigger)
    OR auth.uid() IS NULL
  );

-- Verifiziere die neue Policy
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';