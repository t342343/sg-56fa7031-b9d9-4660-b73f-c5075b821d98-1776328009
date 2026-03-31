-- Lösche ALLE bestehenden Policies und erstelle sie komplett neu mit auth.uid()

-- Profiles Tabelle
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Neue Policies mit auth.uid()
CREATE POLICY "admins_full_access_profiles"
  ON profiles
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "public_view_profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Bitcoin Wallets Tabelle
DROP POLICY IF EXISTS "Admins can view all wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can delete wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON bitcoin_wallets;

CREATE POLICY "admins_view_all_wallets"
  ON bitcoin_wallets
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admins_insert_wallets"
  ON bitcoin_wallets
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admins_update_wallets"
  ON bitcoin_wallets
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admins_delete_wallets"
  ON bitcoin_wallets
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "users_view_own_wallet"
  ON bitcoin_wallets
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

-- Transactions Tabelle
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their wallet transactions" ON transactions;
DROP POLICY IF EXISTS "Only system can insert transactions" ON transactions;

CREATE POLICY "admins_view_all_transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "users_view_own_transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM bitcoin_wallets
      WHERE bitcoin_wallets.id = transactions.wallet_id
      AND bitcoin_wallets.user_id = auth.uid()
    )
  );

-- Transaktionen können nur über Backend-API eingefügt werden
CREATE POLICY "service_role_insert_transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);