-- Create creators table
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  brand_color TEXT DEFAULT '#000000',
  social_links JSONB DEFAULT '{}',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  freelanceos_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_auth_user FOREIGN KEY (email) REFERENCES auth.users(email) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own creator profile"
  ON creators FOR SELECT
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update own creator profile"
  ON creators FOR UPDATE
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Creator profiles are public"
  ON creators FOR SELECT
  USING (true);

-- Create trigger function to auto-create creator profile
CREATE OR REPLACE FUNCTION handle_new_creator()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  generated_username TEXT;
  counter INT := 1;
BEGIN
  -- Generate username from full_name or email
  base_username := LOWER(COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_-]', '', 'g');
  generated_username := base_username;

  -- Check for conflicts and append counter
  WHILE EXISTS (SELECT 1 FROM creators WHERE username = generated_username) LOOP
    generated_username := base_username || counter;
    counter := counter + 1;
  END LOOP;

  INSERT INTO creators (
    email,
    full_name,
    avatar_url,
    username
  ) VALUES (
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    generated_username
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_creator();
