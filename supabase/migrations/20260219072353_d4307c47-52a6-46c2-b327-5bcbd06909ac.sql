
-- Add background and music fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS background_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS background_video_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS song_url text;
