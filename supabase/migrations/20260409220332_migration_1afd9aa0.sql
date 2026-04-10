CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Rückwirkend alle Auth-User in die Profiles-Tabelle eintragen, die vielleicht beim Testen verloren gingen
INSERT INTO public.profiles (id, email) 
SELECT u.id, u.email FROM auth.users u 
LEFT JOIN public.profiles p ON p.id = u.id 
WHERE p.id IS NULL;