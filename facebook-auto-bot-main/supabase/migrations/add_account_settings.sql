-- Migration: Add account settings columns for profile management
-- This migration adds columns for account profile and user preferences
-- Safe to run on existing databases - uses IF NOT EXISTS

-- Account profile settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS website text;

-- User preferences
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS theme text not null default 'system';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS email_notifications boolean not null default true;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS push_notifications boolean not null default false;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS weekly_reports boolean not null default true;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS two_factor_enabled boolean not null default false;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.display_name IS 'User display name';
COMMENT ON COLUMN app_settings.username IS 'Username handle';
COMMENT ON COLUMN app_settings.bio IS 'User bio/description';
COMMENT ON COLUMN app_settings.website IS 'User website URL';
COMMENT ON COLUMN app_settings.theme IS 'UI theme preference: system, light, or dark';
COMMENT ON COLUMN app_settings.email_notifications IS 'Email notification preference';
COMMENT ON COLUMN app_settings.push_notifications IS 'Push notification preference';
COMMENT ON COLUMN app_settings.weekly_reports IS 'Weekly report subscription preference';
COMMENT ON COLUMN app_settings.two_factor_enabled IS 'Two-factor authentication status';
