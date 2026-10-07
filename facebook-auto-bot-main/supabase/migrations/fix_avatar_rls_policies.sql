-- Fix Avatar Storage RLS Policies
-- Run this in Supabase SQL Editor to fix the profile photo upload error
-- This changes the array index from [1] to [0] to correctly extract user_id from the path

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Recreate policies with correct array index [0]
-- Path format: {user_id}/avatar.webp
-- Example: abc123-def456/avatar.webp
-- string_to_array(name, '/')[0] extracts: abc123-def456 (the user_id folder)

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[0]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[0]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[0]
  );
