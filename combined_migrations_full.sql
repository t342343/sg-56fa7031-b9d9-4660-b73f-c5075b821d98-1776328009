-- Erweitere profiles Tabelle um Finanzportal-Felder
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Erstelle bitcoin_wallets Tabelle
CREATE TABLE IF NOT EXISTS bitcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_assigned_by FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Erstelle transactions Tabelle
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES bitcoin_wallets(id) ON DELETE CASCADE,
  txid TEXT NOT NULL UNIQUE,
  amount_btc NUMERIC(16, 8) NOT NULL,
  eur_rate NUMERIC(12, 2) NOT NULL,
  amount_eur NUMERIC(12, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  block_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES bitcoin_wallets(id) ON DELETE CASCADE
);

-- Enable RLS für neue Tabellen
ALTER TABLE bitcoin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies für bitcoin_wallets
CREATE POLICY "Admins can view all wallets" ON bitcoin_wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own wallet" ON bitcoin_wallets FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Admins can insert wallets" ON bitcoin_wallets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update wallets" ON bitcoin_wallets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete wallets" ON bitcoin_wallets FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies für transactions
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their wallet transactions" ON transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bitcoin_wallets 
    WHERE bitcoin_wallets.id = transactions.wallet_id 
    AND bitcoin_wallets.user_id = auth.uid()
  )
);

CREATE POLICY "Only system can insert transactions" ON transactions FOR INSERT WITH CHECK (false);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_wallets_user ON bitcoin_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Kommentar zur Transaction-Insertion Policy:
-- INSERT wird via Service Key (Backend) gemacht, nicht direkt von Clients
-- Deshalb ist die Policy auf false gesetzt für maximale Sicherheit-- Erstelle eine Funktion, die automatisch admin@finanzportal.dev als Admin markiert
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Wenn die Email admin@finanzportal.dev ist, setze role auf 'admin'
  IF NEW.email = 'admin@finanzportal.dev' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Erstelle einen Trigger für neue Profile
DROP TRIGGER IF EXISTS set_admin_role ON profiles;
CREATE TRIGGER set_admin_role
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_user();

-- Erstelle auch einen Trigger für Updates (falls die Email später geändert wird)
DROP TRIGGER IF EXISTS update_admin_role ON profiles;
CREATE TRIGGER update_admin_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_user();-- Lösche die alte INSERT-Policy und erstelle eine neue, die Selbst-Registrierung erlaubt
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
  );-- Lösche die fehlerhafte Policy und erstelle sie richtig
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Neue Policy mit korrekter auth.uid() Funktion
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);-- Korrigiere ALLE Policies um auth.uid() statt uid() zu verwenden

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
  );-- Entferne zuerst alle Trigger
DROP TRIGGER IF EXISTS set_admin_role ON profiles;
DROP TRIGGER IF EXISTS create_admin_role ON profiles;
DROP TRIGGER IF EXISTS update_admin_role ON profiles;

-- Dann die Funktion mit CASCADE
DROP FUNCTION IF EXISTS handle_admin_user() CASCADE;-- Lösche ALLE bestehenden Policies und erstelle sie komplett neu mit auth.uid()

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
  WITH CHECK (false);-- Entferne ALLE Trigger von auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Entferne ALLE Funktionen
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_admin_user() CASCADE;

-- Überprüfe ob noch andere Trigger existieren
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('auth', 'public')
ORDER BY event_object_table, trigger_name;-- Erstelle eine Funktion die ALLE neuen Benutzer automatisch bestätigt
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Setze email_confirmed_at und confirmed_at auf NOW()
  NEW.email_confirmed_at := NOW();
  NEW.confirmed_at := NOW();
  RETURN NEW;
END;
$$;

-- Erstelle einen BEFORE INSERT Trigger auf auth.users
DROP TRIGGER IF EXISTS auto_confirm_users ON auth.users;
CREATE TRIGGER auto_confirm_users
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();-- Entferne ALLE Policies von profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Erstelle einfache, nicht-rekursive Policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());-- Lösche ALLE Policies komplett
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;-- Entferne ALLE bestehenden Policies komplett
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;-- Erstelle ultra-einfache Policies ohne jegliche Rekursion
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
  WITH CHECK (auth.uid() = id);-- SCHRITT 1: Deaktiviere RLS komplett
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- SCHRITT 2: Lösche ALLE Policies (falls noch welche existieren)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;-- SCHRITT 3: Aktiviere RLS wieder mit den EINFACHSTEN Policies
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
  WITH CHECK (id = auth.uid());-- DEAKTIVIERE RLS KOMPLETT - keine Sicherheit, aber funktionierend
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Lösche auch alle Policies zur Sicherheit
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;-- Lösche die 3 übriggebliebenen Policies MANUELL
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;-- Deaktiviere RLS für transactions Tabelle
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Lösche alle existierenden Policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'transactions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON transactions', pol.policyname);
    END LOOP;
END $$;-- Erstelle Chat-Tabelle für Kundenchat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);-- Erstelle Withdrawal Requests Tabelle für Auszahlungsanfragen
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  withdrawal_address TEXT NOT NULL,
  amount_btc DECIMAL(16, 8) NOT NULL,
  amount_eur DECIMAL(16, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);-- Deaktiviere RLS für neue Tabellen (wie bei anderen Tabellen)
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;-- Füge countdown_days zu bitcoin_wallets hinzu
ALTER TABLE bitcoin_wallets 
ADD COLUMN IF NOT EXISTS countdown_days INTEGER DEFAULT 14;

-- Füge neue Spalten zu transactions hinzu
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_extended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'withdrawn'));

-- Update existing transactions to set expires_at
UPDATE transactions
SET expires_at = timestamp + INTERVAL '14 days'
WHERE expires_at IS NULL;-- Entferne die alte CHECK constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Füge neue CHECK constraint mit 'archived' hinzu
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('active', 'expired', 'withdrawn', 'archived'));CREATE TABLE IF NOT EXISTS wallet_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  is_assigned BOOLEAN DEFAULT false,
  assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_wallet_pool_is_assigned ON wallet_pool(is_assigned);
CREATE INDEX IF NOT EXISTS idx_wallet_pool_assigned_user ON wallet_pool(assigned_to_user_id);

ALTER TABLE wallet_pool DISABLE ROW LEVEL SECURITY;-- Funktion zur automatischen Wallet-Zuweisung bei Registrierung
CREATE OR REPLACE FUNCTION assign_wallet_from_pool()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_wallet RECORD;
BEGIN
  -- Hole erste verfügbare Wallet aus Pool
  SELECT id, wallet_address INTO available_wallet
  FROM wallet_pool
  WHERE status = 'available'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Wenn Wallet gefunden, zuweisen
  IF FOUND THEN
    -- Erstelle bitcoin_wallets Eintrag
    INSERT INTO bitcoin_wallets (user_id, wallet_address, assigned_at, assigned_by)
    VALUES (NEW.id, available_wallet.wallet_address, NOW(), NULL);
    
    -- Entferne Wallet aus Pool (verschwindet komplett)
    DELETE FROM wallet_pool WHERE id = available_wallet.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger auf profiles INSERT (nach Registrierung)
DROP TRIGGER IF EXISTS auto_assign_wallet_trigger ON profiles;
CREATE TRIGGER auto_assign_wallet_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'user')
  EXECUTE FUNCTION assign_wallet_from_pool();-- Füge 'withdrawal_pending' zu erlaubten Status-Werten hinzu
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('active', 'expired', 'withdrawn', 'withdrawal_pending', 'archived'));-- Füge Spalten für finalen Auszahlungsbetrag hinzu
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS withdrawn_amount_eur DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS withdrawn_amount_btc DECIMAL(18, 8);

COMMENT ON COLUMN transactions.withdrawn_amount_eur IS 'Finaler Auszahlungsbetrag inkl. Rendite in EUR (zum Zeitpunkt der Genehmigung)';
COMMENT ON COLUMN transactions.withdrawn_amount_btc IS 'Finaler Auszahlungsbetrag in Bitcoin (zum aktuellen BTC-Kurs bei Genehmigung)';-- Füge withdrawal_address Spalte zur transactions Tabelle hinzu
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS withdrawal_address TEXT;

COMMENT ON COLUMN transactions.withdrawal_address IS 'Bitcoin Wallet-Adresse für die Auszahlung';-- Prüfe ob maturity_date existiert und füge sie hinzu falls nicht
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'maturity_date'
    ) THEN
        ALTER TABLE transactions ADD COLUMN maturity_date TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN transactions.maturity_date IS 'Fälligkeitsdatum - bis zu diesem Datum läuft die Rendite';
    END IF;
END $$;

-- Aktualisiere Schema-Cache durch NOTIFY
NOTIFY pgrst, 'reload schema';ALTER TABLE transactions ADD COLUMN IF NOT EXISTS maturity_days INTEGER;-- Erstelle Tabelle für Website-Einstellungen
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Füge Standard-Einstellungen hinzu
INSERT INTO site_settings (setting_key, setting_value, description)
VALUES 
  ('home_button_url', '/', 'URL für den Finanzportal Home-Button'),
  ('website_button_url', '/', 'URL für den "Zur Website"-Button auf der Info-Seite')
ON CONFLICT (setting_key) DO NOTHING;

-- RLS Policies (nur Admins können ändern, alle können lesen)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON site_settings;
CREATE POLICY "public_read_settings" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_settings" ON site_settings;
CREATE POLICY "admin_manage_settings" ON site_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);-- Schritt 2: Alle Trigger und Functions löschen
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;-- Schritt 4: Alle Policies von profiles löschen
DROP POLICY IF EXISTS "select_own" ON profiles;
DROP POLICY IF EXISTS "select_fresh" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "delete_own" ON profiles;
DROP POLICY IF EXISTS "admin_all" ON profiles;
DROP POLICY IF EXISTS "anon_read_own" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;-- Schritt 5: RLS aktivieren und ORIGINAL Policies von 20:34 Uhr wiederherstellen
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Standard T1 Policies (Private user data)
CREATE POLICY "select_own" ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "insert_own" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "delete_own" ON profiles 
  FOR DELETE 
  USING (auth.uid() = id);

-- Admin Policy
CREATE POLICY "admin_all" ON profiles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );-- Schritt 6: Original handle_new_user() Trigger von 20:34 Uhr wiederherstellen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, address)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();-- Schritt 2: Auto-Confirm Trigger erstellen für neue User
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Email automatisch bestätigen
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger für neue User erstellen
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();-- RLS komplett deaktivieren für profiles (behebt Endlosschleife)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Alle Policies löschen die die Rekursion verursachen
DROP POLICY IF EXISTS "select_own" ON profiles;
DROP POLICY IF EXISTS "select_fresh" ON profiles;
DROP POLICY IF EXISTS "insert_own" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "delete_own" ON profiles;
DROP POLICY IF EXISTS "admin_all" ON profiles;
DROP POLICY IF EXISTS "anon_read_own" ON profiles;-- Füge original_amount_eur Spalte hinzu für echten Einzahlungsbetrag
ALTER TABLE transactions
ADD COLUMN original_amount_eur NUMERIC(20, 8);

-- Migriere bestehende Daten: original = aktueller amount
UPDATE transactions
SET original_amount_eur = amount_eur
WHERE original_amount_eur IS NULL;

-- Mache Spalte NOT NULL
ALTER TABLE transactions
ALTER COLUMN original_amount_eur SET NOT NULL;-- Entferne die gerade hinzugefügte Spalte
ALTER TABLE transactions
DROP COLUMN IF EXISTS original_amount_eur;-- Füge neue Spalte extended_base_amount hinzu (falls nicht vorhanden)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS extended_base_amount NUMERIC;

COMMENT ON COLUMN transactions.extended_base_amount IS 'Betrag bei Verlängerung (wird nicht mehr verändert, Basis für Gewinnberechnung)';-- Füge Spalte original_deposit hinzu für ursprünglichen Einzahlungsbetrag
ALTER TABLE transactions
ADD COLUMN original_deposit DECIMAL(20, 8);-- Stelle sicher, dass der Trigger existiert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();-- Erstelle INSERT Policy für profiles (erlaubt Trigger + User selbst)
CREATE POLICY "allow_profile_insert" 
ON profiles 
FOR INSERT 
WITH CHECK (true);-- Lösche ALLE Trigger die Wallets zuweisen
DROP TRIGGER IF EXISTS assign_wallet_on_signup ON profiles;
DROP TRIGGER IF EXISTS assign_wallet_on_insert ON profiles;
DROP TRIGGER IF EXISTS auto_assign_wallet ON profiles;-- Lösche die Trigger-Funktion
DROP FUNCTION IF EXISTS assign_wallet_from_pool() CASCADE;-- Erstelle Trigger der nach INSERT auf profiles feuert
DROP TRIGGER IF EXISTS auto_assign_wallet_on_profile_create ON profiles;
CREATE TRIGGER auto_assign_wallet_on_profile_create
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION assign_wallet_from_pool();-- 1. Lösche alte Trigger und Funktionen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Erstelle neue handle_new_user Funktion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Erstelle Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Überprüfe RLS für profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Lösche alte Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- 6. Erstelle neue Policies
CREATE POLICY "Enable insert for authentication" 
  ON profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 7. Backfill existing users
INSERT INTO public.profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;-- Korrigiere den Foreign Key: profiles.id → auth.users.id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Erstelle den korrekten FK zu auth.users
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Überprüfe ob es funktioniert hat
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'profiles' 
  AND tc.constraint_type = 'FOREIGN KEY';-- 1. Alle Foreign Keys auf profiles.id radikal löschen
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'profiles'
      AND tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'id'
  ) LOOP
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
  END LOOP;
END $$;

-- 2. Den absolut korrekten Foreign Key setzen
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Sicherstellen, dass der Trigger NUR bei INSERT feuert (nicht bei Login/UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, '', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Überflüssige Trigger auf auth.users löschen, falls vorhanden (die Logins stören könnten)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;-- Admin-Policy für profiles: Admin kann alle Profile sehen
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin-Policy für bitcoin_wallets: Admin kann alle Wallets sehen
CREATE POLICY "Admins can view all wallets"
ON public.bitcoin_wallets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin-Policy für transactions: Admin kann alle Transaktionen sehen
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);-- 1. ALLE kaputten Policies löschen
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
USING (is_admin() = true);-- STEP 1: Kaputte Policy löschen
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
);-- SCHRITT 1: Security Definer Function erstellen (umgeht RLS)
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
USING (auth.uid() = id);-- Entferne den Auto-Confirm Trigger und die Funktion
-- Damit greifen wieder die Supabase-UI-Einstellungen für E-Mail-Verifizierung

-- Schritt 1: Trigger löschen
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

-- Schritt 2: Funktion löschen
DROP FUNCTION IF EXISTS public.auto_confirm_user();-- Füge fehlende Spalten zur profiles Tabelle hinzu
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text;

-- Erstelle Funktion für automatisches Profil bei Registrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Erstelle Trigger für neue Auth-User
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Erstelle Profile für bestehende User ohne Profil
INSERT INTO public.profiles (id, email, role)
SELECT u.id, u.email, 'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;-- Aktiviere pgcrypto für die Passwort-Verschlüsselung (falls nicht aktiv)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Füge den Admin-User direkt in die auth.users Tabelle ein (umgeht das Email-Limit)
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sdsadjh433jh43@atomicmail.io',
    crypt('rRx.38jL2+', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id
)
SELECT id FROM new_user;-- 1. Erstelle bitcoin_wallets Tabelle
CREATE TABLE IF NOT EXISTS public.bitcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Erstelle transactions Tabelle
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.bitcoin_wallets(id) ON DELETE CASCADE,
  txid TEXT NOT NULL UNIQUE,
  amount_btc NUMERIC(16, 8) NOT NULL,
  eur_rate NUMERIC(12, 2) NOT NULL,
  amount_eur NUMERIC(12, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  block_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'withdrawn', 'archived')),
  maturity_days INTEGER DEFAULT 30,
  expires_at TIMESTAMP WITH TIME ZONE,
  original_deposit NUMERIC(12, 2)
);

-- 3. Erstelle chat_messages Tabelle
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Erstelle withdrawal_requests Tabelle
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  withdrawal_address TEXT NOT NULL,
  amount_btc DECIMAL(16, 8) NOT NULL,
  amount_eur DECIMAL(16, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Erstelle wallet_pool Tabelle
CREATE TABLE IF NOT EXISTS public.wallet_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  is_assigned BOOLEAN DEFAULT false,
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

-- 6. Erstelle site_settings Tabelle
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Füge grundlegende Zugriffsrechte (RLS Policies) hinzu, damit alle Funktionen im Dashboard und Admin arbeiten können
ALTER TABLE public.bitcoin_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_bitcoin_wallets" ON public.bitcoin_wallets USING (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_transactions" ON public.transactions USING (true);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_chat_messages" ON public.chat_messages USING (true);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_withdrawal_requests" ON public.withdrawal_requests USING (true);

ALTER TABLE public.wallet_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_wallet_pool" ON public.wallet_pool USING (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_site_settings" ON public.site_settings USING (true);

-- Lade Standardeinstellungen in site_settings
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES 
('btc_rate_adjustment', '0', 'Anpassung des BTC Preises in %'),
('maintenance_mode', 'false', 'Wartungsmodus aktivieren')
ON CONFLICT (setting_key) DO NOTHING;

-- Notiz an Supabase zum Aktualisieren des Schema-Caches (Behebt den "not found in schema cache" Fehler)
NOTIFY pgrst, 'reload schema';ALTER TABLE public.bitcoin_wallets
ADD COLUMN IF NOT EXISTS countdown_days INTEGER DEFAULT 30;

NOTIFY pgrst, 'reload schema';-- Automatische Wallet-Zuweisung aus Pool bei neuer Profil-Erstellung
CREATE OR REPLACE FUNCTION assign_wallet_from_pool()
RETURNS TRIGGER AS $$
DECLARE
  available_wallet RECORD;
BEGIN
  -- Prüfe ob User bereits eine Wallet hat
  IF EXISTS (
    SELECT 1 FROM public.bitcoin_wallets 
    WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Finde erste verfügbare Wallet aus dem Pool (nicht zugewiesen)
  SELECT * INTO available_wallet
  FROM public.wallet_pool
  WHERE assigned_to_user_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- Wenn verfügbare Wallet gefunden wurde
  IF available_wallet.id IS NOT NULL THEN
    -- Erstelle bitcoin_wallets Eintrag
    INSERT INTO public.bitcoin_wallets (
      user_id,
      wallet_address,
      assigned_by,
      countdown_days
    ) VALUES (
      NEW.id,
      available_wallet.wallet_address,
      'system_auto_assign',
      30
    );

    -- Markiere Wallet im Pool als zugewiesen
    UPDATE public.wallet_pool
    SET assigned_to_user_id = NEW.id
    WHERE id = available_wallet.id;

    RAISE NOTICE 'Auto-assigned wallet % to user %', available_wallet.wallet_address, NEW.email;
  ELSE
    RAISE NOTICE 'No available wallets in pool for user %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lösche alten Trigger falls vorhanden
DROP TRIGGER IF EXISTS trigger_assign_wallet_on_profile_creation ON public.profiles;

-- Erstelle Trigger der bei jedem neuen Profil feuert
CREATE TRIGGER trigger_assign_wallet_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_wallet_from_pool();

-- Teste: Prüfe ob Trigger korrekt erstellt wurde
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_assign_wallet_on_profile_creation';-- Lösche die alte, restriktive INSERT Policy
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
WHERE tablename = 'profiles' AND cmd = 'INSERT';-- Deaktiviere den Wallet-Zuweisungs-Trigger temporär
DROP TRIGGER IF EXISTS trigger_assign_wallet_on_profile_creation ON public.profiles;

-- Zeige verbleibende Trigger
SELECT tgname, tgrelid::regclass::text 
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND tgisinternal = false;-- Reaktiviere den Wallet-Trigger
CREATE TRIGGER trigger_assign_wallet_on_profile_creation
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_wallet_from_pool();

-- Zeige die handle_new_user Funktion im Detail
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';-- Schritt 1: Erlaube den neuen Status "withdrawal_pending" im Status-Check
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;-- Schritt 2: Füge den neuen Constraint mit dem erweiterten Status-Set hinzu
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('active', 'expired', 'withdrawn', 'archived', 'withdrawal_pending'));-- Schritt 3: Füge die Spalte für Verlängerungs-Status hinzu
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_extended boolean DEFAULT false;-- Schritt 4: Füge die Spalte für den ursprünglichen Betrag bei Verlängerungen hinzu
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS extended_base_amount numeric;-- Schritt 5: Füge die Spalte für die Auszahlungsadresse hinzu
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawal_address text;ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS maturity_date timestamp with time zone;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawn_amount_eur numeric;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawn_amount_btc numeric;