-- ============================================================
-- Multi-domain addresses + subdomain availability + site lifecycle
--
-- Three things land here:
--   1. A site now lives at <subdomain>.<domain>, not just <subdomain>.
--      KDK will own a POOL of domains and the user picks one, so the
--      uniqueness rule moves from `subdomain` alone to (domain, subdomain).
--      "sharma" must be free to exist on two different domains.
--   2. wb_subdomain_available() — the browser cannot check this itself.
--      RLS only exposes rows that are published or owned by the caller, so a
--      client-side lookup reports "available" for another user's DRAFT and the
--      publish then fails with a silent 403. A SECURITY DEFINER function sees
--      every row but returns only a verdict, never another user's data.
--   3. A delete policy. There was none, so deletes were blocked outright.
-- ============================================================

-- ---------- 1. The domain a site is published under ----------
alter table wb_websites
  add column if not exists domain text not null default 'kdksites.in';

comment on column wb_websites.domain is
  'Which KDK-owned domain this site sits under. The full address is <subdomain>.<domain>.';

-- `subdomain text unique` created an inline single-column constraint. It is
-- wrong now: it would stop two users taking "sharma" on two different domains.
alter table wb_websites drop constraint if exists wb_websites_subdomain_key;

-- Uniqueness is the PAIR. Partial, so many drafts can sit at NULL.
create unique index if not exists uq_wb_websites_domain_subdomain
  on wb_websites (domain, subdomain)
  where subdomain is not null;

create index if not exists idx_wb_websites_subdomain on wb_websites (subdomain);

-- ---------- 2. Availability ----------
-- Names that must never be handed out: they collide with routing, mail, or the
-- brand itself. `s` is in here because published sites are served at /s/<sub>.
create or replace function wb_subdomain_reserved(p_subdomain text)
returns boolean language sql immutable as $$
  select lower(coalesce(p_subdomain,'')) = any (array[
    'www','api','app','admin','administrator','root','mail','email','smtp','imap',
    'ftp','ns1','ns2','dns','mx','webmail','cpanel','whm','blog','shop','store',
    'support','help','helpdesk','status','docs','doc','dev','test','staging','demo',
    'static','assets','cdn','img','images','media','files','download','downloads',
    'account','accounts','billing','pay','payment','payments','checkout','invoice',
    'login','signin','signup','register','auth','oauth','sso','password','reset',
    'kdk','kdksites','kdksoftware','sites','site','website','builder','portal',
    'my','me','user','users','client','clients','partner','partners','team',
    's','sitemap','robots','security','abuse','postmaster','hostmaster','noc','null'
  ]);
$$;

-- Returns a verdict, not data. SECURITY DEFINER so it can see rows RLS hides,
-- but the only thing that ever leaves is {available, reason} — no ids, no
-- owners, no config. A name the CALLER already owns counts as available, so
-- re-publishing your own site does not report itself as taken.
create or replace function wb_subdomain_available(p_domain text, p_subdomain text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sub    text := lower(trim(coalesce(p_subdomain,'')));
  v_domain text := lower(trim(coalesce(p_domain,'')));
  v_taken  boolean;
begin
  if v_domain = '' then
    return jsonb_build_object('available', false, 'reason', 'invalid_domain');
  end if;
  if v_sub = '' then
    return jsonb_build_object('available', false, 'reason', 'empty');
  end if;
  if length(v_sub) < 3 then
    return jsonb_build_object('available', false, 'reason', 'too_short');
  end if;
  if length(v_sub) > 30 then
    return jsonb_build_object('available', false, 'reason', 'too_long');
  end if;
  -- letters, digits and inner hyphens only; no leading/trailing hyphen, no doubles
  if v_sub !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    return jsonb_build_object('available', false, 'reason', 'invalid_format');
  end if;
  if wb_subdomain_reserved(v_sub) then
    return jsonb_build_object('available', false, 'reason', 'reserved');
  end if;

  -- Any surviving row holds the name, including an 'unpublished' one: taking a
  -- site offline is meant to be reversible, so the owner keeps their address.
  -- Deletes are hard, so a deleted site's row is gone and its name frees itself.
  select exists (
    select 1 from wb_websites w
     where w.subdomain = v_sub
       and lower(w.domain) = v_domain
       and (auth.uid() is null or w.user_id is distinct from auth.uid())
  ) into v_taken;

  if v_taken then
    return jsonb_build_object('available', false, 'reason', 'taken');
  end if;
  return jsonb_build_object('available', true, 'reason', 'ok');
end;
$$;

revoke all on function wb_subdomain_available(text, text) from public;
grant execute on function wb_subdomain_available(text, text) to anon, authenticated;
grant execute on function wb_subdomain_reserved(text) to anon, authenticated;

-- ---------- 3. Lifecycle ----------
-- 'unpublished' was already allowed by the original check constraint; the app
-- simply never set it. Nothing to change there.
--
-- Delete had NO policy at all, which under RLS means every delete was refused.
-- Hard delete cascades into wb_leads (wb_leads.website_id ... on delete cascade),
-- so the UI must state plainly that enquiries go with the site. That warning is
-- the safeguard; the database intentionally does not soften it.
drop policy if exists wb_websites_delete_own on wb_websites;
create policy wb_websites_delete_own on wb_websites
  for delete to authenticated
  using (auth.uid() = user_id);
