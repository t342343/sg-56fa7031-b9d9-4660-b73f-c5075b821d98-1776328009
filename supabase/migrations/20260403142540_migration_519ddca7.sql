-- Lösche ALLE Trigger die Wallets zuweisen
DROP TRIGGER IF EXISTS assign_wallet_on_signup ON profiles;
DROP TRIGGER IF EXISTS assign_wallet_on_insert ON profiles;
DROP TRIGGER IF EXISTS auto_assign_wallet ON profiles;