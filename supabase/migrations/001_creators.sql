CREATE TABLE public.creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
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
  freelanceos_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creator profile" ON public.creators FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own creator profile" ON public.creators FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Creator profiles are public" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Trigger can insert creator profile" ON public.creators FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.creators (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_creator();
