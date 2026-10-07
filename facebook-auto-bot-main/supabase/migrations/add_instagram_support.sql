-- Instagram Integration Migration
-- Run this in Supabase SQL Editor
-- This adds support for Instagram connection and multi-destination publishing

-- Social connections table for multiple platform support
create table if not exists social_connections (
  id serial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null, -- 'facebook', 'instagram'
  platform_account_id text,
  platform_account_name text,
  platform_username text,
  status text not null default 'disconnected', -- 'connected', 'disconnected', 'error'
  access_token_reference text, -- reference to where token is stored (e.g., 'app_settings.facebook_user_token')
  token_expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint single_connection_per_platform check (platform = 'facebook' or platform = 'instagram'),
  unique(user_id, platform)
);

-- RLS: Users can only see their own social connections
alter table social_connections enable row level security;

create policy "Users can view own social connections"
  on social_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own social connections"
  on social_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own social connections"
  on social_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own social connections"
  on social_connections for delete
  using (auth.uid() = user_id);

-- Extend posts table for multi-destination publishing
alter table posts
  add column if not exists publish_destinations text[] default '{facebook}';

alter table posts
  add column if not exists facebook_publish_status text default 'pending';

alter table posts
  add column if not exists instagram_publish_status text default 'pending';

alter table posts
  add column if not exists facebook_error_message text;

alter table posts
  add column if not exists instagram_error_message text;

alter table posts
  add column if not exists instagram_post_id text;

-- Extend app_settings for Autopilot destination configuration
alter table app_settings
  add column if not exists autopilot_destinations text[] default '{facebook}';

-- Index for social connections
create index if not exists social_connections_user_platform_idx on social_connections(user_id, platform);

-- Index for posts by destination
create index if not exists posts_destinations_idx on posts using gin(publish_destinations);
