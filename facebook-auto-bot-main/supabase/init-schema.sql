-- Facebook Auto Bot — Initial Schema
-- Run this to create all tables from scratch

create extension if not exists "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS pages_cache CASCADE;

-- Create app_settings table (without foreign key first)
create table app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  facebook_app_id text,
  facebook_app_secret text,
  facebook_config_id text,
  facebook_user_token text,
  facebook_token_expires_at timestamptz,
  facebook_user_name text,
  default_page_id text,
  default_page_name text,
  default_page_token text,
  image_source text not null default 'ai',
  utm_suffix text default '',
  auto_post_enabled boolean not null default false,
  posts_per_day smallint not null default 3,
  posting_hours int[] not null default '{9,13,18}',
  timezone text not null default 'Asia/Karachi',
  last_auto_post_at timestamptz,
  topic_source text not null default 'mine',
  updated_at timestamptz not null default now()
);

create unique index app_settings_user_id_idx on app_settings (user_id);

-- Create posts table (without foreign key first)
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  topic text not null,
  title text not null,
  description text not null,
  hashtags text[] not null default '{}',
  image_url text not null,
  image_source text not null,
  link_url text,
  page_id text,
  page_name text,
  status text not null default 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  facebook_post_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index posts_status_scheduled_idx on posts (status, scheduled_at);
create index posts_created_idx on posts (created_at desc);

-- Create pages_cache table
create table pages_cache (
  page_id text primary key,
  name text not null,
  category text,
  fetched_at timestamptz not null default now()
);

-- Create topics table (without foreign key first)
create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  text text not null,
  enabled boolean not null default true,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index topics_text_lower_idx on topics (lower(text));
create index topics_rotation_idx on topics (enabled, last_used_at nulls first);

-- Add foreign key constraints after tables are created
DO $$
BEGIN
    -- Add foreign key to app_settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'app_settings' AND constraint_name = 'app_settings_user_id_fkey'
    ) THEN
        ALTER TABLE app_settings
        ADD CONSTRAINT app_settings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to posts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'posts' AND constraint_name = 'posts_user_id_fkey'
    ) THEN
        ALTER TABLE posts
        ADD CONSTRAINT posts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key to topics
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'topics' AND constraint_name = 'topics_user_id_fkey'
    ) THEN
        ALTER TABLE topics
        ADD CONSTRAINT topics_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Enable RLS
alter table app_settings enable row level security;
alter table posts enable row level security;
alter table topics enable row level security;

-- RLS policies for app_settings
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
