-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  type TEXT DEFAULT 'digital' CHECK (type = 'digital'),
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_mime TEXT,
  download_limit INTEGER,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Creators can manage own products"
  ON products FOR ALL
  USING (creator_id = (SELECT id FROM creators WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Published products are public"
  ON products FOR SELECT
  USING (is_published AND is_active);
