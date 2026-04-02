-- Schritt 5: RLS aktivieren und ORIGINAL Policies von 20:34 Uhr wiederherstellen
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
  );