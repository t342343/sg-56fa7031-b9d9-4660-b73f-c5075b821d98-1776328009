-- Admin-Policy für profiles: Admin kann alle Profile sehen
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin-Policy für bitcoin_wallets: Admin kann alle Wallets sehen
CREATE POLICY "Admins can view all wallets"
ON public.bitcoin_wallets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin-Policy für transactions: Admin kann alle Transaktionen sehen
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);