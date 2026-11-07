-- Prepared from specification; execution requires local PostGIS/Supabase.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;

create table app_private.authority_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer','officer','approver')),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table app_private.authority_members enable row level security;
grant select, insert, update, delete on app_private.authority_members to service_role;

-- Use SECURITY DEFINER only for this narrowly scoped private membership lookup.
-- Check the caller via auth.uid(); accept no caller-supplied identity or role.
create function app_private.current_authority_role() returns text
language sql stable security definer set search_path = '' as $$
  select m.role from app_private.authority_members m
  where m.user_id = (select auth.uid()) and m.active;
$$;
revoke all on function app_private.current_authority_role() from public;
grant execute on function app_private.current_authority_role() to authenticated;

create table public.wards (
  id text primary key,
  boundary_version text not null,
  source_ward_id text not null,
  name_en text not null,
  name_mr text,
  geom extensions.geometry(MultiPolygon,4326) not null,
  centroid extensions.geometry(Point,4326) not null,
  weather_point extensions.geometry(Point,4326) not null,
  weather_point_method text not null,
  area_km2 double precision not null check (area_km2 > 0),
  admin_ward_office text,
  provenance jsonb not null,
  unique(boundary_version,source_ward_id),
  check (extensions.st_isvalid(geom))
);
create index wards_geom_gix on public.wards using gist(geom);

create table public.ward_features (
  ward_id text not null references public.wards(id),
  feature_version text not null,
  component text not null,
  raw_value double precision,
  unit text not null,
  percentile double precision check (percentile between 0 and 1),
  data_vintage text not null,
  source text not null,
  is_proxy boolean not null,
  weight double precision not null check (weight >= 0),
  cohort_id text not null,
  provenance jsonb not null,
  primary key(ward_id,feature_version,component)
);

create table public.snapshots (
  id text primary key,
  issued_at timestamptz not null,
  fetched_at timestamptz not null,
  model_run timestamptz,
  model_id text not null,
  data_vintage jsonb not null,
  git_sha text not null,
  schema_version text not null,
  method_version text not null,
  boundary_version text not null,
  is_simulation boolean not null,
  mode text not null check(mode in ('live','replay','whatif')),
  source_snapshot_id text references public.snapshots(id),
  manifest jsonb not null,
  check (is_simulation = (mode <> 'live'))
);

create table public.forecast_hourly (
  snapshot_id text not null references public.snapshots(id) on delete cascade,
  ward_id text not null references public.wards(id),
  valid_time timestamptz not null,
  issue_time timestamptz not null,
  model_run timestamptz,
  t2m double precision,
  rh double precision check(rh between 0 and 100),
  dew_point double precision,
  wind double precision check(wind >= 0),
  mrt double precision,
  utci double precision,
  wbgt double precision,
  heat_index double precision,
  supporting_fields jsonb not null default '{}'::jsonb,
  quality_flags jsonb not null default '[]'::jsonb,
  provenance jsonb not null,
  primary key(snapshot_id,ward_id,valid_time)
);
create index forecast_time_idx on public.forecast_hourly(ward_id,valid_time);

create table public.ward_daily (
  snapshot_id text not null references public.snapshots(id) on delete cascade,
  ward_id text not null references public.wards(id),
  date date not null,
  lead_days smallint not null,
  base_level smallint check(base_level between 0 and 4),
  hazard_level smallint check(hazard_level between 0 and 4),
  hazard_rule_fired jsonb not null,
  vulnerability double precision check(vulnerability between 0 and 1),
  vulnerability_percentile double precision check(vulnerability_percentile between 0 and 1),
  vulnerability_coverage double precision check(vulnerability_coverage between 0 and 1),
  top_quintile boolean,
  risk_level smallint check(risk_level between 0 and 4),
  risk_basis text not null check(risk_basis in ('hazard_only','vulnerability_adjusted','unavailable')),
  priority_score double precision check(priority_score between 0 and 100),
  peak_utci double precision,
  peak_wbgt double precision,
  tmax double precision,
  night_min_t double precision,
  night_threshold double precision,
  imd_flag text not null check(imd_flag in ('no','heat_wave','severe_heat_wave','unknown_departure')),
  p_ge_3 double precision check(p_ge_3 between 0 and 1),
  probability_method text,
  drivers jsonb not null default '[]'::jsonb,
  completeness jsonb not null,
  primary key(snapshot_id,ward_id,date),
  check (risk_level is null or hazard_level is not null),
  check (risk_level is null or risk_level >= hazard_level)
);
create index ward_daily_rank_idx on public.ward_daily(snapshot_id,date,risk_level desc,priority_score desc);

create table public.actions (
  id text not null,
  version text not null,
  risk_level smallint not null check(risk_level between 0 and 4),
  audience text not null check(audience in ('authority','citizen','outdoor_worker','school_anganwadi','care_home')),
  context jsonb not null default '{}'::jsonb,
  text_en text not null,
  text_hi text,
  text_mr text,
  translation_status text not null default 'needs_native_review',
  source jsonb not null,
  active boolean not null default true,
  primary key(id,version,risk_level,audience)
);

create table public.refuges (
  id text primary key,
  osm_type text not null,
  osm_id bigint not null,
  name text,
  category text not null,
  point extensions.geometry(Point,4326) not null,
  access_status text not null default 'unknown',
  opening_hours text,
  verified_cooling_centre boolean not null default false,
  provenance jsonb not null,
  unique(osm_type,osm_id)
);
create index refuge_point_gix on public.refuges using gist(point);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  snapshot_id text not null references public.snapshots(id),
  ward_ids text[] not null check(cardinality(ward_ids)>0),
  risk_level smallint not null check(risk_level between 0 and 4),
  audience text not null check(audience in ('authority','citizen','outdoor_worker','school_anganwadi','care_home')),
  languages text[] not null,
  status text not null default 'draft' check(status in ('draft','approved','sent','cancelled')),
  cap_status text not null check(cap_status in ('Test','Exercise')),
  revision integer not null default 1 check(revision>0),
  content jsonb not null,
  content_sha256 text not null,
  cap_xml text,
  action_version text not null,
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approval_revision integer,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz not null,
  is_simulation boolean not null,
  idempotency_key text not null unique,
  check (expires_at>created_at),
  check (approved_by is null or approved_by<>created_by),
  check (status not in ('approved','sent') or
    (approved_by is not null and approved_at is not null and approval_revision=revision)),
  check (status<>'sent' or sent_at is not null)
);
create index alerts_status_idx on public.alerts(status,created_at desc);
create table public.alert_wards (
  alert_id uuid not null references public.alerts(id) on delete cascade,
  ward_id text not null references public.wards(id),
  primary key(alert_id,ward_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  channel text not null check(channel in ('telegram','web_push','email')),
  handle_hash text not null,
  ward_id text not null references public.wards(id),
  lang text not null check(lang in ('en','hi','mr')),
  audience text not null check(audience in ('citizen','outdoor_worker','school_anganwadi','care_home')),
  consent_at timestamptz not null,
  consent_version text not null,
  consent_expires_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(channel,handle_hash,ward_id,lang,audience)
);
create table app_private.subscription_secrets (
  subscription_id uuid primary key references public.subscriptions(id) on delete cascade,
  endpoint_ciphertext bytea not null,
  encryption_key_version text not null,
  deletion_token_hash text not null unique
);
alter table app_private.subscription_secrets enable row level security;
grant select,insert,update,delete on app_private.subscription_secrets to service_role;

create table public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  channel text not null check(channel in ('telegram','web_push','email','sms_simulator')),
  recipient_key text not null,
  revision integer not null,
  status text not null check(status in ('pending','sending','succeeded','failed','unknown','simulated')),
  attempts smallint not null default 0,
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(alert_id,channel,recipient_key,revision)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event text not null,
  entity_type text not null,
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  request_id uuid not null,
  created_at timestamptz not null default now()
);
create index audit_entity_idx on public.audit_log(entity_type,entity_id,created_at);

-- Enable RLS on every exposed table. Avoid broad authenticated write grants.
do $$ declare n text; begin
  foreach n in array array['wards','ward_features','snapshots','forecast_hourly',
    'ward_daily','actions','refuges','alerts','alert_wards','subscriptions',
    'alert_deliveries','audit_log'] loop
    execute format('alter table public.%I enable row level security',n);
    execute format('revoke all on public.%I from anon, authenticated',n);
  end loop;
  foreach n in array array['wards','ward_features','snapshots','forecast_hourly',
    'ward_daily','actions','refuges'] loop
    execute format('grant select on public.%I to anon, authenticated',n);
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)',n);
  end loop;
  foreach n in array array['alerts','alert_wards','alert_deliveries','audit_log'] loop
    execute format('grant select on public.%I to authenticated',n);
    execute format('create policy staff_read on public.%I for select to authenticated using ((select app_private.current_authority_role()) in (''viewer'',''officer'',''approver''))',n);
  end loop;
end $$;

grant select,insert,update,delete on public.wards,public.ward_features,
  public.snapshots,public.forecast_hourly,public.ward_daily,public.actions,
  public.refuges,public.alerts,public.alert_wards,public.subscriptions,
  public.alert_deliveries to service_role;
grant select,insert on public.audit_log to service_role;
grant usage,select on sequence public.audit_log_id_seq to service_role;
revoke update,delete,truncate on public.audit_log from service_role;
