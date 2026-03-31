-- Entferne ALLE Trigger von auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Entferne ALLE Funktionen
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_admin_user() CASCADE;

-- Überprüfe ob noch andere Trigger existieren
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('auth', 'public')
ORDER BY event_object_table, trigger_name;