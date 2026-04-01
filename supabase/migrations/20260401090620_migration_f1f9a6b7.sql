-- Entferne die alte CHECK constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Füge neue CHECK constraint mit 'archived' hinzu
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('active', 'expired', 'withdrawn', 'archived'));