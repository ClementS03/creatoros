CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(buyer_email, lesson_id)
);

CREATE TABLE IF NOT EXISTS lesson_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_email, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_own_progress" ON lesson_progress
  FOR ALL USING (buyer_email = auth.jwt()->>'email');

CREATE POLICY "buyer_read_unlocks" ON lesson_unlocks
  FOR SELECT USING (buyer_email = auth.jwt()->>'email');

CREATE POLICY "creator_manage_unlocks" ON lesson_unlocks
  FOR ALL USING (creator_id = auth.uid());
