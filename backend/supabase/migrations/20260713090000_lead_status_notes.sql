-- ============================================================
-- Lead management: status + private notes + updated_at, and an
-- RLS policy so a site owner can update their own leads.
-- ============================================================

-- Follow-up status for each enquiry (defaults to 'new' on insert).
alter table wb_leads add column if not exists status text not null default 'new'
  check (status in ('new','contacted','in_progress','converted','closed'));

-- Private note the owner keeps about the lead (never shown to the visitor).
alter table wb_leads add column if not exists notes text;

-- Track when the row was last changed (status/notes edits).
alter table wb_leads add column if not exists updated_at timestamptz not null default now();

-- Reuse the existing touch function (created in the init migration).
drop trigger if exists trg_wb_leads_touch on wb_leads;
create trigger trg_wb_leads_touch before update on wb_leads
  for each row execute function wb_touch_updated_at();

-- Owner may update their own leads (status + notes). Insert stays public
-- (contact form), select stays owner-only — both from the earlier migration.
drop policy if exists wb_leads_update_owner on wb_leads;
create policy wb_leads_update_owner on wb_leads
  for update to authenticated
  using (exists (select 1 from wb_websites w where w.id = wb_leads.website_id and w.user_id = auth.uid()))
  with check (exists (select 1 from wb_websites w where w.id = wb_leads.website_id and w.user_id = auth.uid()));
