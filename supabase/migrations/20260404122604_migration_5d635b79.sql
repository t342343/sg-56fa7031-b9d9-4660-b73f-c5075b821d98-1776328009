-- SCHRITT 1: Security Definer Function erstellen (umgeht RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- SCHRITT 2: Alle kaputten Policies auf profiles löschen
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- SCHRITT 3: Neue Policies OHNE Endlosschleife erstellen
-- Policy 1: Normale User sehen ihr eigenes Profil ODER Admins sehen alles
CREATE POLICY "users_and_admins_view_profiles" ON profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- Policy 2: User können ihr eigenes Profil aktualisieren
CREATE POLICY "users_update_own_profile" ON profiles
FOR UPDATE
USING (auth.uid() = id);