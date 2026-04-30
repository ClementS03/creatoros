ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(bundle_id, product_id)
);

ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundle_items_creator"
  ON bundle_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = bundle_items.bundle_id
        AND p.creator_id = auth.uid()
    )
  );
