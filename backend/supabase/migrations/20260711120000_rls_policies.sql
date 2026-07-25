-- RLS policies for publishing sites.
-- A logged-in user may create/update their own website rows; a site row is
-- readable when it is published (public sites) or owned by the requester.
-- The render Edge Function uses the service_role key, which bypasses RLS.

drop policy if exists wb_websites_insert_own on wb_websites;
create policy wb_websites_insert_own on wb_websites
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists wb_websites_update_own on wb_websites;
create policy wb_websites_update_own on wb_websites
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists wb_websites_select on wb_websites;
create policy wb_websites_select on wb_websites
  for select
  using (status = 'published' or auth.uid() = user_id);

-- Leads: allow public inserts (contact form on a published site), owner reads.
drop policy if exists wb_leads_insert_any on wb_leads;
create policy wb_leads_insert_any on wb_leads
  for insert to anon, authenticated
  with check (true);

drop policy if exists wb_leads_select_owner on wb_leads;
create policy wb_leads_select_owner on wb_leads
  for select to authenticated
  using (exists (select 1 from wb_websites w where w.id = wb_leads.website_id and w.user_id = auth.uid()));
