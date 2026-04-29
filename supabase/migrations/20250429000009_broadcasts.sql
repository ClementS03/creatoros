-- Create email broadcast system
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  segment TEXT NOT NULL CHECK (segment IN ('all', 'lead_magnet', 'purchase', 'newsletter')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  recipient_count INTEGER,
  sent_at TIMESTAMPTZ
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY broadcasts_creator ON broadcasts
  FOR ALL
  USING (auth.uid() = creator_id);
