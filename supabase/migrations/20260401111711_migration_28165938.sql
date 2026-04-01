CREATE TABLE IF NOT EXISTS wallet_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  is_assigned BOOLEAN DEFAULT false,
  assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_wallet_pool_is_assigned ON wallet_pool(is_assigned);
CREATE INDEX IF NOT EXISTS idx_wallet_pool_assigned_user ON wallet_pool(assigned_to_user_id);

ALTER TABLE wallet_pool DISABLE ROW LEVEL SECURITY;