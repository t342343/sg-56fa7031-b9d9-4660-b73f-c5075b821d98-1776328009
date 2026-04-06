-- Entferne den Auto-Confirm Trigger und die Funktion
-- Damit greifen wieder die Supabase-UI-Einstellungen für E-Mail-Verifizierung

-- Schritt 1: Trigger löschen
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

-- Schritt 2: Funktion löschen
DROP FUNCTION IF EXISTS public.auto_confirm_user();