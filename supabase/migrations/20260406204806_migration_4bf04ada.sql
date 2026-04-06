-- Schritt 1: Erlaube den neuen Status "withdrawal_pending" im Status-Check
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;