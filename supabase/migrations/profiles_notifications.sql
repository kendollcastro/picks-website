-- Add notifications JSON column to profiles for user preferences.
-- Run this in Supabase SQL Editor if the profiles table already exists.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{}'::jsonb;
