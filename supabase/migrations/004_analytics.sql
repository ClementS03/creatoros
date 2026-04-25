CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('storefront_view','product_view','checkout_started','purchase')),
  product_id UUID REFERENCES products(id),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_creator_read"
  ON analytics_events FOR SELECT
  USING (auth.uid() = creator_id);
