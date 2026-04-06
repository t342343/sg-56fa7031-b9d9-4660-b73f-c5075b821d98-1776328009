-- Reaktiviere den Wallet-Trigger
CREATE TRIGGER trigger_assign_wallet_on_profile_creation
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_wallet_from_pool();

-- Zeige die handle_new_user Funktion im Detail
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';