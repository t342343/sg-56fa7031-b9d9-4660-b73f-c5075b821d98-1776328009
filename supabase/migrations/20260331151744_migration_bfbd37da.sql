-- Erstelle eine Funktion, die automatisch admin@finanzportal.dev als Admin markiert
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
  EXECUTE FUNCTION handle_admin_user();