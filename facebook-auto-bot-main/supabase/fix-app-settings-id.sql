-- Migration to fix app_settings table for multi-user support
-- Run this in Supabase SQL Editor

-- Drop the constraint that forces id = 1
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS single_row_per_user;

-- Drop the primary key constraint
ALTER TABLE app_settings DROP CONSTRAINT app_settings_pkey;

-- Remove default value before changing type
ALTER TABLE app_settings ALTER COLUMN id DROP DEFAULT;

-- Change id column from smallint to uuid
ALTER TABLE app_settings ALTER COLUMN id TYPE uuid USING gen_random_uuid();

-- Set primary key on the uuid column
ALTER TABLE app_settings ADD PRIMARY KEY (id);

-- Set default to gen_random_uuid for new inserts
ALTER TABLE app_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();
