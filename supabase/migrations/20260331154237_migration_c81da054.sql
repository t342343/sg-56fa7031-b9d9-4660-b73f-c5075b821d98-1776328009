-- Entferne zuerst alle Trigger
DROP TRIGGER IF EXISTS set_admin_role ON profiles;
DROP TRIGGER IF EXISTS create_admin_role ON profiles;
DROP TRIGGER IF EXISTS update_admin_role ON profiles;

-- Dann die Funktion mit CASCADE
DROP FUNCTION IF EXISTS handle_admin_user() CASCADE;