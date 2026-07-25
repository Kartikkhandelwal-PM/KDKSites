-- ============================================================
-- KDK Website Builder — Postgres schema (Supabase)
-- Prototype. Stores each firm's website config as JSONB (matches the
-- flexible builder output) plus leads captured from published sites.
-- ============================================================

-- Each website a professional builds
create table if not exists wb_websites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,                                   -- FK to auth.users / KDK user (nullable for now)
  subdomain     text unique,                            -- e.g. "sharma-associates"
  status        text not null default 'draft'
                  check (status in ('draft','published','unpublished')),
  profession    text not null default 'ca'
                  check (profession in ('ca','advocate','tax_consultant','gst_practitioner','company_secretary','cost_accountant')),
  template      text not null default 'apex'
                  check (template in ('apex','nova','heritage','zenith')),
  primary_color text,
  accent_color  text,
  config        jsonb not null default '{}'::jsonb,     -- the full builder config (collectConfig output)
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_wb_websites_user   on wb_websites (user_id);
create index if not exists idx_wb_websites_status on wb_websites (status);

-- Leads submitted via the contact form on a published site
create table if not exists wb_leads (
  id          uuid primary key default gen_random_uuid(),
  website_id  uuid references wb_websites(id) on delete cascade,
  name        text,
  email       text,
  phone       text,
  message     text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_wb_leads_website on wb_leads (website_id);

-- keep updated_at fresh
create or replace function wb_touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_wb_websites_touch on wb_websites;
create trigger trg_wb_websites_touch before update on wb_websites
  for each row execute function wb_touch_updated_at();

-- Row Level Security: enabled now; add policies when auth is wired.
-- Until policies exist, only the service_role key can read/write these tables
-- (the anon key used by the browser cannot) — a safe default for the prototype.
alter table wb_websites enable row level security;
alter table wb_leads    enable row level security;
