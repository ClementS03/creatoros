CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  drip_days INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators_manage_sections" ON course_sections
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE creator_id = auth.uid())
  );

CREATE POLICY "creators_manage_lessons" ON course_lessons
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE creator_id = auth.uid())
  );

CREATE POLICY "public_read_sections" ON course_sections
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE is_published = true AND is_active = true)
  );

CREATE POLICY "public_read_lessons" ON course_lessons
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE is_published = true AND is_active = true)
  );
