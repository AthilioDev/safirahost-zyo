
-- Storage buckets for avatars and banners
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Banner images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Users can upload their own banner" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own banner" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own banner" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add card_template and profile_effect to profiles
ALTER TABLE public.profiles ADD COLUMN card_template text DEFAULT 'classic';
ALTER TABLE public.profiles ADD COLUMN profile_effect text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN show_discord boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN show_badges boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN show_spotify boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN show_views boolean DEFAULT true;

-- Badges table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  description text,
  color text DEFAULT '#8b5cf6',
  is_special boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User badges junction
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  equipped boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can update own badges" ON public.user_badges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Seed badges
INSERT INTO public.badges (name, icon, description, color, is_special) VALUES
  ('Early Adopter', 'rocket', 'Joined during the early days', '#f59e0b', false),
  ('OG', 'crown', 'Original gangster', '#eab308', true),
  ('Developer', 'code', 'Builds cool stuff', '#3b82f6', false),
  ('Designer', 'palette', 'Creates beautiful things', '#ec4899', false),
  ('Gamer', 'gamepad-2', 'Lives for gaming', '#8b5cf6', false),
  ('Streamer', 'video', 'Content creator', '#ef4444', false),
  ('Musician', 'music', 'Makes beats', '#06b6d4', false),
  ('Artist', 'brush', 'Digital artist', '#f97316', false),
  ('Verified', 'check-circle', 'Verified user', '#3b82f6', true),
  ('Staff', 'shield', 'Safira staff member', '#eab308', true),
  ('Partner', 'handshake', 'Official partner', '#10b981', true),
  ('Bug Hunter', 'bug', 'Found and reported bugs', '#a855f7', false),
  ('Supporter', 'heart', 'Supports the platform', '#ef4444', false),
  ('Night Owl', 'moon', 'Active late at night', '#6366f1', false),
  ('Collector', 'gem', 'Collects rare badges', '#14b8a6', false);
