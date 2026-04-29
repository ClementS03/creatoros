-- Add lead magnet feature to products
ALTER TABLE products
ADD COLUMN is_lead_magnet BOOLEAN DEFAULT false,
ADD COLUMN welcome_email JSONB;
