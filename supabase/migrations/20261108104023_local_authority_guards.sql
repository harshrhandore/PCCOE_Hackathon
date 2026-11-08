-- Current local Auth sessions are required even for protected Data API reads.
create or replace function app_private.current_authority_role() returns text
language sql stable security definer set search_path = '' as $$
  select m.role from app_private.authority_members m
  where m.user_id = (select auth.uid()) and m.active
    and exists (select 1 from auth.sessions s
      where s.user_id=m.user_id and s.id=nullif((select auth.jwt()->>'session_id'),'')::uuid
        and (s.not_after is null or s.not_after>now()));
$$;
revoke all on function app_private.current_authority_role() from public;
grant execute on function app_private.current_authority_role() to authenticated;

create or replace function app_private.alert_transition() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id<>old.id or new.created_by<>old.created_by or new.created_at<>old.created_at
    or new.snapshot_id<>old.snapshot_id or new.is_simulation<>old.is_simulation
    or new.cap_status<>old.cap_status or new.idempotency_key<>old.idempotency_key then
    raise exception 'immutable alert identity';
  end if;
  if old.status in ('sent','cancelled') then raise exception 'terminal alert'; end if;
  if old.status='approved' or new.status in ('approved','cancelled') then
    if new.content is distinct from old.content or new.content_sha256<>old.content_sha256
      or new.revision<>old.revision or new.ward_ids<>old.ward_ids
      or new.languages<>old.languages or new.expires_at<>old.expires_at
      or new.risk_level<>old.risk_level or new.audience<>old.audience
      or new.action_version<>old.action_version then
      raise exception 'approval binds exact content and revision';
    end if;
  end if;
  if old.status='approved' then
    if new.status not in ('sent','cancelled')
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at
      or new.approval_revision is distinct from old.approval_revision then
      raise exception 'approved alert is frozen';
    end if;
  elsif old.status='draft' then
    if new.status not in ('draft','approved','cancelled') then raise exception 'invalid transition'; end if;
    if new.status='draft' and new.revision<>old.revision+1 then raise exception 'draft revision must increment'; end if;
  end if;
  return new;
end $$;
