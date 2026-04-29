CREATE TABLE product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_mime TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_files_creator"
  ON product_files FOR ALL
  USING (product_id IN (SELECT id FROM products WHERE creator_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT id FROM products WHERE creator_id = auth.uid()));

CREATE POLICY "product_files_public"
  ON product_files FOR SELECT
  USING (product_id IN (SELECT id FROM products WHERE is_published = true AND is_active = true));
