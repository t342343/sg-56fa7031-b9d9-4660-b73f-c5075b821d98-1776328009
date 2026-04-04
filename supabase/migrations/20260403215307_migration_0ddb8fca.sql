-- 1. ALLE kaputten Policies löschen
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

-- 2. Sichere Admin-Check-Funktion erstellen (umgeht RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 3. Neue Policies mit sicherer Funktion
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
USING (is_admin() = true);

CREATE POLICY "Admins can view all wallets" ON bitcoin_wallets FOR SELECT
USING (is_admin() = true);

CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT
USING (is_admin() = true);