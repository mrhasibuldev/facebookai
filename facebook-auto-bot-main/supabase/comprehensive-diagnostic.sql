-- COMPREHENSIVE SUPABASE DIAGNOSTIC SQL
-- READ ONLY - NO DESTRUCTIVE OPERATIONS
-- Run this in Supabase SQL Editor to verify the current database state
-- This will help identify any schema drift or missing components

-- =========================================================================
-- SECTION 1: STORAGE RLS POLICIES (AVATAR UPLOAD ISSUE)
-- =========================================================================

-- Check current avatar storage policies
SELECT 
  'SECTION 1: AVATAR STORAGE POLICIES' as section,
  policyname,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual ILIKE '%avatars%'
    OR with_check ILIKE '%avatars%'
    OR policyname ILIKE '%avatar%'
  )
ORDER BY policyname;

-- Check avatars bucket configuration
SELECT 
  'SECTION 1: AVATARS BUCKET CONFIG' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- =========================================================================
-- SECTION 2: DATABASE TABLES
-- =========================================================================

-- Check all required tables exist
SELECT 
  'SECTION 2: TABLE EXISTENCE' as section,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('app_settings', 'posts', 'topics', 'social_connections', 'pages_cache')
ORDER BY table_name;

-- =========================================================================
-- SECTION 3: APP_SETTINGS COLUMNS (Instagram Integration)
-- =========================================================================

-- Check if Instagram columns exist in app_settings
SELECT 
  'SECTION 3: INSTAGRAM COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'app_settings'
  AND table_schema = 'public'
  AND column_name IN ('instagram_app_id', 'instagram_app_secret', 'instagram_redirect_uri')
ORDER BY column_name;

-- Check if account settings columns exist
SELECT 
  'SECTION 3: ACCOUNT SETTINGS COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'app_settings'
  AND table_schema = 'public'
  AND column_name IN ('display_name', 'username', 'bio', 'website', 'avatar_url', 'theme', 'email_notifications', 'push_notifications', 'weekly_reports', 'two_factor_enabled', 'phone')
ORDER BY column_name;

-- =========================================================================
-- SECTION 4: POSTS COLUMNS (Multi-destination Publishing)
-- =========================================================================

-- Check if multi-destination columns exist in posts
SELECT 
  'SECTION 4: POSTS MULTI-DESTINATION COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND table_schema = 'public'
  AND column_name IN ('publish_destinations', 'facebook_publish_status', 'instagram_publish_status', 'facebook_error_message', 'instagram_error_message', 'instagram_post_id')
ORDER BY column_name;

-- =========================================================================
-- SECTION 5: SOCIAL_CONNECTIONS TABLE
-- =========================================================================

-- Check social_connections table structure
SELECT 
  'SECTION 5: SOCIAL_CONNECTIONS TABLE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'social_connections'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================================================================
-- SECTION 6: RLS POLICY STATUS
-- =========================================================================

-- Check RLS status on all user tables
SELECT 
  'SECTION 6: RLS STATUS' as section,
  table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname IN ('app_settings', 'posts', 'topics', 'social_connections')
  AND relnamespace = 'public'::regnamespace
ORDER BY table_name;

-- =========================================================================
-- SECTION 7: INDEXES
-- =========================================================================

-- Check important indexes exist
SELECT 
  'SECTION 7: INDEXES' as section,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'app_settings_user_id_idx',
    'posts_status_scheduled_idx',
    'posts_created_idx',
    'topics_text_lower_idx',
    'topics_rotation_idx',
    'social_connections_user_platform_idx',
    'posts_destinations_idx'
  )
ORDER BY tablename, indexname;

-- =========================================================================
-- SECTION 8: CONSTRAINTS
-- =========================================================================

-- Check important constraints
SELECT 
  'SECTION 8: CONSTRAINTS' as section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('app_settings', 'social_connections')
)
ORDER BY conrelid::regclass::text, conname;

-- =========================================================================
-- SECTION 9: STORAGE BUCKETS
-- =========================================================================

-- Check all storage buckets
SELECT 
  'SECTION 9: STORAGE BUCKETS' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- =========================================================================
-- SECTION 10: ROW COUNTS (For Data Verification)
-- =========================================================================

-- Check row counts in main tables
SELECT 
  'SECTION 10: ROW COUNTS' as section,
  'app_settings' as table_name,
  (SELECT COUNT(*) FROM app_settings) as row_count
UNION ALL
SELECT 
  'SECTION 10: ROW COUNTS' as section,
  'posts' as table_name,
  (SELECT COUNT(*) FROM posts) as row_count
UNION ALL
SELECT 
  'SECTION 10: ROW COUNTS' as section,
  'topics' as table_name,
  (SELECT COUNT(*) FROM topics) as row_count
UNION ALL
SELECT 
  'SECTION 10: ROW COUNTS' as section,
  'social_connections' as table_name,
  (SELECT COUNT(*) FROM social_connections) as row_count;
