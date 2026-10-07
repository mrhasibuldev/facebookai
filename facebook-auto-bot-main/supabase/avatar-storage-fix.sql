-- Avatar Storage Fix - Run this in Supabase SQL Editor
-- This script fixes the RLS policies for the avatars storage bucket
-- to match the application's path structure: {user_id}/avatar.webp

-- Step 1: Ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Step 2: Add avatar_url column if missing (for storing the public URL)
alter table app_settings add column if not exists avatar_url text;

-- Step 3: Drop any existing avatar policies one by one
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- Step 4: Create correct policies matching application path {user_id}/avatar.webp
-- The application uploads to: {user_id}/avatar.webp
-- Example: abc123-def456/avatar.webp

-- Public read access - anyone can view avatars (required for profile display)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload only to their own folder: {user_id}/avatar.webp
-- Policy checks that the first path segment matches auth.uid()
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[0]
  );

-- Users can update only their own avatar (for upsert operations)
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[0]
  );

-- Users can delete only their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (string_to_array(name, '/'))[0]
  );
