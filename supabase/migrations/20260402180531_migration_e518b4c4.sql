-- Erstelle Tabelle für Website-Einstellungen
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
);