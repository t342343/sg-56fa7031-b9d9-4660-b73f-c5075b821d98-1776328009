-- Füge 'withdrawal_pending' zu erlaubten Status-Werten hinzu
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('active', 'expired', 'withdrawn', 'withdrawal_pending', 'archived'));