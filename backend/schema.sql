-- ════════════════════════════════════════════════════
--  Discord Server Builder Pro — Supabase Schema
--
--  Paste this entire file into:
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════

create table if not exists users (
  id                     uuid        default gen_random_uuid() primary key,
  email                  text        unique not null,
  username               text        not null default 'User',
  password_hash          text        not null,
  plan                   text        not null default 'basic'
                                     check (plan in ('basic', 'developer', 'professional')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Auto-update updated_at on any row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on users;
create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

-- Index for fast email lookups
create index if not exists users_email_idx on users (email);

-- Index for looking up users by Stripe subscription ID (used by webhook)
create index if not exists users_subscription_idx on users (stripe_subscription_id);

-- ════════════════════════════════════════════════════
--  MIGRATION v2: Deploy tracking + password reset
--  Run this if the users table already exists
-- ════════════════════════════════════════════════════
alter table users add column if not exists deploy_count   integer default 0;
alter table users add column if not exists reset_code     text;
alter table users add column if not exists reset_expires  bigint;
