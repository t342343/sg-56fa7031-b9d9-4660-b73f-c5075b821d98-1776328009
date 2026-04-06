-- Deaktiviere den Wallet-Zuweisungs-Trigger temporär
DROP TRIGGER IF EXISTS trigger_assign_wallet_on_profile_creation ON public.profiles;

-- Zeige verbleibende Trigger
SELECT tgname, tgrelid::regclass::text 
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND tgisinternal = false;