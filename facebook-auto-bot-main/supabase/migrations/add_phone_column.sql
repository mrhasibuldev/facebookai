-- Migration: Add phone column to app_settings
-- This migration adds a phone number field for security notifications

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS phone text;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.phone IS 'User phone number for security notifications (E.164 format preferred)';
