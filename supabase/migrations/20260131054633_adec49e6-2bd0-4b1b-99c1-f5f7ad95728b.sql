-- Add has_completed_tutorial column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_tutorial boolean NOT NULL DEFAULT false;