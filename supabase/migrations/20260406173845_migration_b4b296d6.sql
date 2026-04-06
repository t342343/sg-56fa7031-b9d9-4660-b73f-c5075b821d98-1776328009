-- Automatische Wallet-Zuweisung aus Pool bei neuer Profil-Erstellung
CREATE OR REPLACE FUNCTION assign_wallet_from_pool()
RETURNS TRIGGER AS $$
DECLARE
  available_wallet RECORD;
BEGIN
  -- Prüfe ob User bereits eine Wallet hat
  IF EXISTS (
    SELECT 1 FROM public.bitcoin_wallets 
    WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Finde erste verfügbare Wallet aus dem Pool (nicht zugewiesen)
  SELECT * INTO available_wallet
  FROM public.wallet_pool
  WHERE assigned_to_user_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- Wenn verfügbare Wallet gefunden wurde
  IF available_wallet.id IS NOT NULL THEN
    -- Erstelle bitcoin_wallets Eintrag
    INSERT INTO public.bitcoin_wallets (
      user_id,
      wallet_address,
      assigned_by,
      countdown_days
    ) VALUES (
      NEW.id,
      available_wallet.wallet_address,
      'system_auto_assign',
      30
    );

    -- Markiere Wallet im Pool als zugewiesen
    UPDATE public.wallet_pool
    SET assigned_to_user_id = NEW.id
    WHERE id = available_wallet.id;

    RAISE NOTICE 'Auto-assigned wallet % to user %', available_wallet.wallet_address, NEW.email;
  ELSE
    RAISE NOTICE 'No available wallets in pool for user %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lösche alten Trigger falls vorhanden
DROP TRIGGER IF EXISTS trigger_assign_wallet_on_profile_creation ON public.profiles;

-- Erstelle Trigger der bei jedem neuen Profil feuert
CREATE TRIGGER trigger_assign_wallet_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_wallet_from_pool();

-- Teste: Prüfe ob Trigger korrekt erstellt wurde
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_assign_wallet_on_profile_creation';