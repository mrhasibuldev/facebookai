-- FeedWren — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Safe to run again at any time. Every statement only creates what is missing,
-- so re-running this file is also how an existing install is upgraded after
-- pulling a newer version of the app — see the "Upgrades" section at the end.

create extension if not exists "pgcrypto";

-- Singleton settings row (id is always 1). Holds the Facebook tokens, the
-- selected Page, and generation preferences. Multi-user app with user_id.
create table if not exists app_settings (
  id smallint primary key default 1,
  user_id uuid references auth.users(id) on delete cascade,
  -- Meta app credentials. Kept here rather than in env vars so that installing
  -- this app is a paste into Settings, not a redeploy. Never leaves the server.
  facebook_app_id text,
  facebook_app_secret text,
  -- Facebook Login for Business configuration id, when the Meta app uses it.
  facebook_config_id text,
  -- Long-lived user token (~60 days), used only to list Pages and to mint
  -- Page tokens. Posting never uses it directly.
  facebook_user_token text,
  facebook_token_expires_at timestamptz,
  facebook_user_name text,
  -- Page tokens derived from a long-lived user token do not expire, so this is
  -- what the app actually posts with.
  default_page_id text,
  default_page_name text,
  default_page_token text,
  image_source text not null default 'ai',        -- 'ai' | 'stock' | 'mixed'
  utm_suffix text default '',
  auto_post_enabled boolean not null default false,
  posts_per_day smallint not null default 3,
  posting_hours int[] not null default '{9,13,18}', -- local hours (0-23) the queue is allowed to fire
  timezone text not null default 'Asia/Karachi',
  last_auto_post_at timestamptz, -- prevents the autopilot firing twice in one posting-hour slot
  topic_source text not null default 'mine',       -- 'mine' | 'trending' | 'mixed'
  updated_at timestamptz not null default now(),
  constraint single_row_per_user check (id = 1)
);

-- Ensure each user has exactly one settings row
create unique index if not exists app_settings_user_id_idx on app_settings (user_id);

-- One row per generated/queued/published post. Facebook takes a single
-- `message`, but title/description/hashtags stay separate here so the editor
-- can keep them apart; they are composed at publish time.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic text not null,
  title text not null,
  description text not null,
  hashtags text[] not null default '{}',
  image_url text not null,          -- final image used (Supabase Storage URL)
  image_source text not null,       -- 'ai' | 'stock'
  link_url text,                    -- optional link included in the post
  page_id text,
  page_name text,
  status text not null default 'draft', -- 'draft' | 'scheduled' | 'posted' | 'failed'
  scheduled_at timestamptz,
  posted_at timestamptz,
  facebook_post_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists posts_status_scheduled_idx on posts (status, scheduled_at);
create index if not exists posts_created_idx on posts (created_at desc);

-- Cached list of the Pages this account can post to (refreshed on demand).
create table if not exists pages_cache (
  page_id text primary key,
  name text not null,
  category text,
  fetched_at timestamptz not null default now()
);

-- The owner's own topics and keywords. Autopilot writes about these, taking
-- the least recently used enabled one each time, so the whole list is covered
-- before anything repeats.
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  text text not null,
  enabled boolean not null default true,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness, so pasting the same list twice adds nothing.
create unique index if not exists topics_text_lower_idx on topics (lower(text));
create index if not exists topics_rotation_idx on topics (enabled, last_used_at nulls first);

-- Public bucket every generated/sourced image is re-hosted into, so a post's
-- image keeps working even if the free provider it came from goes down later.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Public bucket for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Upgrades
--
-- `create table if not exists` leaves an existing table exactly as it was, so
-- columns added to app_settings after the first public release have to be
-- added explicitly for installs that already have the table. Each line is a
-- no-op when the column is already there.
-- ---------------------------------------------------------------------------

alter table app_settings add column if not exists facebook_app_id text;
alter table app_settings add column if not exists facebook_app_secret text;
alter table app_settings add column if not exists facebook_config_id text;
alter table app_settings add column if not exists topic_source text not null default 'mine';

-- Account settings for profile management
alter table app_settings add column if not exists display_name text;
alter table app_settings add column if not exists username text;
alter table app_settings add column if not exists bio text;
alter table app_settings add column if not exists website text;
alter table app_settings add column if not exists avatar_url text;
alter table app_settings add column if not exists theme text not null default 'system';
alter table app_settings add column if not exists email_notifications boolean not null default true;
alter table app_settings add column if not exists push_notifications boolean not null default false;
alter table app_settings add column if not exists weekly_reports boolean not null default true;
alter table app_settings add column if not exists two_factor_enabled boolean not null default false;
alter table app_settings add column if not exists phone text;

-- Migration: add user_id to existing tables for multi-user support
-- This must be done BEFORE enabling RLS and creating policies
DO $$
BEGIN
    -- Add user_id to app_settings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'app_settings' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE app_settings ADD COLUMN user_id uuid references auth.users(id) on delete cascade;
    END IF;

    -- Add user_id to posts if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE posts ADD COLUMN user_id uuid references auth.users(id) on delete cascade;
    END IF;

    -- Add user_id to topics if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'topics' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE topics ADD COLUMN user_id uuid references auth.users(id) on delete cascade;
    END IF;
END $$;

-- Migration: update constraint for multi-user
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'app_settings' AND constraint_name = 'single_row'
    ) THEN
        ALTER TABLE app_settings DROP CONSTRAINT single_row;
    END IF;

    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'app_settings' AND constraint_name = 'single_row_per_user'
    ) THEN
        ALTER TABLE app_settings ADD CONSTRAINT single_row_per_user check (id = 1);
    END IF;
END $$;

-- Migration: add unique index for user_id in app_settings
create unique index if not exists app_settings_user_id_idx on app_settings (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
-- Enable RLS on all user-specific tables
alter table app_settings enable row level security;
alter table posts enable row level security;
alter table topics enable row level security;

-- RLS policies for app_settings
-- Drop existing policies if they exist (PostgreSQL doesn't support IF NOT EXISTS for policies)
drop policy if exists "Users can view their own settings" on app_settings;
drop policy if exists "Users can insert their own settings" on app_settings;
drop policy if exists "Users can update their own settings" on app_settings;

create policy "Users can view their own settings"
  on app_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on app_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on app_settings for update
  using (auth.uid() = user_id);

-- RLS policies for posts
drop policy if exists "Users can view their own posts" on posts;
drop policy if exists "Users can insert their own posts" on posts;
drop policy if exists "Users can update their own posts" on posts;
drop policy if exists "Users can delete their own posts" on posts;

create policy "Users can view their own posts"
  on posts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- RLS policies for topics
drop policy if exists "Users can view their own topics" on topics;
drop policy if exists "Users can insert their own topics" on topics;
drop policy if exists "Users can update their own topics" on topics;
drop policy if exists "Users can delete their own topics" on topics;

create policy "Users can view their own topics"
  on topics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own topics"
  on topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own topics"
  on topics for update
  using (auth.uid() = user_id);

create policy "Users can delete their own topics"
  on topics for delete
  using (auth.uid() = user_id);

-- RLS policies for avatars storage bucket
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can view their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Public read access" on storage.objects;

-- Public read access for avatars
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS policies for post-images storage bucket
drop policy if exists "Public read access for post-images" on storage.objects;
drop policy if exists "Users can upload their own post-images" on storage.objects;
drop policy if exists "Users can delete their own post-images" on storage.objects;

-- Public read access for post-images
create policy "Public read access for post-images"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Users can upload post-images (via server-side operations with service role)
-- No direct client upload policy - all uploads go through server API
create policy "Server upload for post-images"
  on storage.objects for insert
  with check (bucket_id = 'post-images');

-- Users can delete their own post-images (via server API)
create policy "Server delete for post-images"
  on storage.objects for delete
  using (bucket_id = 'post-images');
