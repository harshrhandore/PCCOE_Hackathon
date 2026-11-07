-- Prepared migration. Verify against a local Supabase/PostGIS stack before use.
create function app_private.reject_audit_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception 'audit rows are immutable'; end $$;
create trigger immutable_audit before update or delete on public.audit_log
for each row execute function app_private.reject_audit_mutation();
create trigger immutable_audit_truncate before truncate on public.audit_log
for each statement execute function app_private.reject_audit_mutation();

create function app_private.alert_transition() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.created_by<>old.created_by or new.created_at<>old.created_at or new.snapshot_id<>old.snapshot_id
    or new.is_simulation<>old.is_simulation or new.cap_status<>old.cap_status then
    raise exception 'immutable alert identity';
  end if;
  if old.status in ('sent','cancelled') then raise exception 'terminal alert'; end if;
  if old.status='approved' then
    if new.status not in ('sent','cancelled') or new.content is distinct from old.content
      or new.content_sha256<>old.content_sha256 or new.revision<>old.revision
      or new.ward_ids<>old.ward_ids or new.languages<>old.languages or new.expires_at<>old.expires_at then
      raise exception 'approved alert is frozen';
    end if;
  elsif old.status='draft' then
    if new.status not in ('draft','approved','cancelled') then raise exception 'invalid transition'; end if;
    if new.status='draft' and new.revision<>old.revision+1 then raise exception 'draft revision must increment'; end if;
    if new.status in ('approved','cancelled') and (new.content is distinct from old.content or new.content_sha256<>old.content_sha256 or new.revision<>old.revision) then
      raise exception 'approval binds exact content and revision';
    end if;
  end if;
  return new;
end $$;
create trigger enforce_alert_transition before update on public.alerts
for each row execute function app_private.alert_transition();

create function app_private.check_alert_wards() returns trigger
language plpgsql set search_path = '' as $$
declare target uuid; declared text[]; actual text[];
begin
  if TG_TABLE_NAME='alerts' then target=coalesce(new.id,old.id); else target=coalesce(new.alert_id,old.alert_id); end if;
  select array_agg(distinct x order by x) into declared from public.alerts a,unnest(a.ward_ids) x where a.id=target;
  if declared is null then return null; end if;
  select array_agg(ward_id order by ward_id) into actual from public.alert_wards where alert_id=target;
  if declared is distinct from actual then raise exception 'alert ward sets disagree'; end if;
  return null;
end $$;
create constraint trigger alert_set_check after insert or update on public.alerts
deferrable initially deferred for each row execute function app_private.check_alert_wards();
create constraint trigger alert_ward_set_check after insert or update or delete on public.alert_wards
deferrable initially deferred for each row execute function app_private.check_alert_wards();

create table app_private.pending_registrations (
  id uuid primary key default gen_random_uuid(),token_hash text not null unique,
  ward_id text not null references public.wards(id),lang text not null check(lang in ('en','hi','mr')),
  audience text not null,consent_version text not null,consent_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create table app_private.telegram_updates(update_id bigint primary key,created_at timestamptz not null default now());
alter table app_private.pending_registrations enable row level security;
alter table app_private.telegram_updates enable row level security;
revoke all on app_private.pending_registrations,app_private.telegram_updates from public,anon,authenticated;
grant select,insert,update,delete on app_private.pending_registrations,app_private.telegram_updates to service_role;

create function app_private.distinct_wards(values_in text[]) returns boolean
language sql immutable set search_path='' as $$ select cardinality(values_in)=(select count(distinct x) from unnest(values_in) x); $$;
alter table public.alerts add constraint unique_selected_wards check(app_private.distinct_wards(ward_ids));
alter table public.alerts add constraint correct_cap_mode check((is_simulation and cap_status='Exercise') or (not is_simulation and cap_status='Test'));
