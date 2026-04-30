CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value INTEGER NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, code)
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discount_codes_creator"
  ON discount_codes FOR ALL
  USING (auth.uid() = creator_id);

CREATE OR REPLACE FUNCTION increment_discount_usage(code_id UUID)
RETURNS void AS $$
  UPDATE discount_codes SET used_count = used_count + 1 WHERE id = code_id;
$$ LANGUAGE sql SECURITY DEFINER;
