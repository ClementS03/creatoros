-- Add custom send domain configuration to creators
ALTER TABLE creators
ADD COLUMN resend_domain_id TEXT,
ADD COLUMN custom_send_domain TEXT,
ADD COLUMN send_domain_verified BOOLEAN DEFAULT false;
