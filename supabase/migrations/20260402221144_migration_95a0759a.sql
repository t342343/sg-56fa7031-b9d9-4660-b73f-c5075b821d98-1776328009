-- Schritt 2: Alle Trigger und Functions löschen
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;