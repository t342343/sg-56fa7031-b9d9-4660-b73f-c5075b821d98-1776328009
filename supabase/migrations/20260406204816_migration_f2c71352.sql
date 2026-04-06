-- Schritt 2: Füge den neuen Constraint mit dem erweiterten Status-Set hinzu
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('active', 'expired', 'withdrawn', 'archived', 'withdrawal_pending'));