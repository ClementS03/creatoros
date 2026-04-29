CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL CHECK (source IN ('lead_magnet', 'purchase', 'newsletter')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(creator_id, email)
);
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscribers_creator_select" ON subscribers FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "subscribers_creator_delete" ON subscribers FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "subscribers_public_insert" ON subscribers FOR INSERT WITH CHECK (true);
