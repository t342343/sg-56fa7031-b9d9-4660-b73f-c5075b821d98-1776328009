-- Erstelle eine Funktion die ALLE neuen Benutzer automatisch bestätigt
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
  EXECUTE FUNCTION public.auto_confirm_user();