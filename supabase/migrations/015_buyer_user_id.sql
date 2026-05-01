ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS orders_buyer_user_id_idx ON orders(buyer_user_id);
