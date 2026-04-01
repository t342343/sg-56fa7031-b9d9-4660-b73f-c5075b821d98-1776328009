-- Funktion zur automatischen Wallet-Zuweisung bei Registrierung
CREATE OR REPLACE FUNCTION assign_wallet_from_pool()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available_wallet RECORD;
BEGIN
  -- Hole erste verfügbare Wallet aus Pool
  SELECT id, wallet_address INTO available_wallet
  FROM wallet_pool
  WHERE status = 'available'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Wenn Wallet gefunden, zuweisen
  IF FOUND THEN
    -- Erstelle bitcoin_wallets Eintrag
    INSERT INTO bitcoin_wallets (user_id, wallet_address, assigned_at, assigned_by)
    VALUES (NEW.id, available_wallet.wallet_address, NOW(), NULL);
    
    -- Entferne Wallet aus Pool (verschwindet komplett)
    DELETE FROM wallet_pool WHERE id = available_wallet.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger auf profiles INSERT (nach Registrierung)
DROP TRIGGER IF EXISTS auto_assign_wallet_trigger ON profiles;
CREATE TRIGGER auto_assign_wallet_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'user')
  EXECUTE FUNCTION assign_wallet_from_pool();