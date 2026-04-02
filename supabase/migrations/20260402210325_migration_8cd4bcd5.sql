-- Trigger mit ausführlichem Logging wieder hinzufügen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log Start
  RAISE LOG 'handle_new_user: Starting for user %', NEW.id;
  
  -- Profil erstellen
  INSERT INTO public.profiles (id, email, full_name, phone, address, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    'user'
  );
  
  -- Log Success
  RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log Error
    RAISE LOG 'handle_new_user: ERROR for user % - %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();