-- Erstelle Trigger der nach INSERT auf profiles feuert
DROP TRIGGER IF EXISTS auto_assign_wallet_on_profile_create ON profiles;
CREATE TRIGGER auto_assign_wallet_on_profile_create
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION assign_wallet_from_pool();