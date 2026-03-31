-- Korrigiere ALLE Policies um auth.uid() statt uid() zu verwenden

-- Profiles Tabelle
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON profiles
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bitcoin Wallets Tabelle
DROP POLICY IF EXISTS "Users can view their own wallet" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON bitcoin_wallets;
DROP POLICY IF EXISTS "Admins can delete wallets" ON bitcoin_wallets;

CREATE POLICY "Users can view their own wallet"
  ON bitcoin_wallets
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all wallets"
  ON bitcoin_wallets
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert wallets"
  ON bitcoin_wallets
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update wallets"
  ON bitcoin_wallets
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete wallets"
  ON bitcoin_wallets
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Transactions Tabelle
DROP POLICY IF EXISTS "Users can view their wallet transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

CREATE POLICY "Users can view their wallet transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM bitcoin_wallets
      WHERE id = transactions.wallet_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );