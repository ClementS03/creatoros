CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  segment TEXT CHECK (segment IN ('all', 'lead_magnet', 'purchase', 'newsletter')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broadcasts_creator" ON broadcasts FOR ALL USING (auth.uid() = creator_id);
