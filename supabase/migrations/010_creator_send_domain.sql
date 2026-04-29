ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS resend_domain_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_send_domain TEXT,
  ADD COLUMN IF NOT EXISTS send_domain_verified BOOLEAN DEFAULT false;
