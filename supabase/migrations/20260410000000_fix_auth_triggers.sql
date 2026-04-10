-- Sicherstellen, dass das Profil-Skript Fehler ignoriert und den User durchlässt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ignoriere jegliche Fehler (z.B. fehlende Spalten) und erlaube den Login!
  RETURN NEW;
END;
$$;

-- Sicherstellen, dass die Wallet-Zuweisung Fehler ignoriert und den User durchlässt
CREATE OR REPLACE FUNCTION public.assign_wallet_from_pool()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  available_wallet RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM public.bitcoin_wallets WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  SELECT * INTO available_wallet 
  FROM public.wallet_pool 
  WHERE assigned_to_user_id IS NULL 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF available_wallet.id IS NOT NULL THEN
    INSERT INTO public.bitcoin_wallets (user_id, wallet_address, assigned_by, countdown_days)
    VALUES (NEW.id, available_wallet.wallet_address, NULL, 30);
    
    UPDATE public.wallet_pool 
    SET assigned_to_user_id = NEW.id 
    WHERE id = available_wallet.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ignoriere Fehler bei der Wallet-Vergabe und erlaube den Login!
  RETURN NEW;
END;
$$;
