-- Email-Bestätigung für alle neuen Benutzer automatisch aktivieren
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Setze email_confirmed_at auf jetzt, wenn noch nicht gesetzt
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  
  -- Setze confirmation_token auf NULL (bereits bestätigt)
  NEW.confirmation_token := NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger für neue Benutzer erstellen
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- Bestehende unbestätigte Benutzer auch bestätigen
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_token = NULL
WHERE email_confirmed_at IS NULL;