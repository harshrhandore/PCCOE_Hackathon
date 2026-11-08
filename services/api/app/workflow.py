"""Frozen templates, exact-revision independent approval, atomic audit/outbox."""
import datetime,uuid
from psycopg.types.json import Jsonb
from pipeline.io import canonical,digest,read_json,ROOT
from .contracts import Draft
from .errors import AppError
from .auth import recheck_member
from .storage import database,audit
from .snapshots import load

def now():return datetime.datetime.now(datetime.timezone.utc)
def iso(value):return value.isoformat().replace('+00:00','Z') if isinstance(value,datetime.datetime) else value
def safe_alert(row):return {k:iso(v) for k,v in row.items()}

def binding_digest(alert):
    bound={'content':alert['content'],'snapshot_id':alert['snapshot_id'],
           'ward_ids':sorted(alert['ward_ids']),'languages':alert['languages'],
           'expires_at':iso(alert['expires_at']),'revision':alert['revision'],
           'action_version':alert['action_version'],'risk_level':alert['risk_level'],
           'audience':alert['audience'],'cap_status':alert['cap_status'],
           'is_simulation':alert['is_simulation']}
    return digest(bound)

def verify_binding(alert):
    if binding_digest(alert)!=alert['content_sha256']:
        raise AppError('REVISION_CONFLICT',409,'authority.changed')

def freeze(payload:Draft,revision=1):
    manifest,file=load(payload.snapshot_id);meta=manifest['meta'];registry=file('geography.json');wards={w['id']:w for w in registry['wards']}
    if set(payload.ward_ids)-set(wards):raise AppError('INVALID_INPUT',422,'validation.ward')
    if payload.expires<=now():raise AppError('INVALID_INPUT',422,'validation.expired')
    if payload.languages!=['en']:raise AppError('INVALID_INPUT',422,'state.translation')
    date=payload.onset.astimezone(__import__('zoneinfo').ZoneInfo('Asia/Kolkata')).date().isoformat()
    selected=[r for r in file('forecast.json')['daily'] if r['ward_id'] in payload.ward_ids and r['date']==date]
    if len(selected)!=len(payload.ward_ids) or any(r['risk_level'] is None for r in selected):raise AppError('SNAPSHOT_UNAVAILABLE')
    if max(r['risk_level'] for r in selected)!=payload.risk_level:raise AppError('INVALID_INPUT',422,'validation.summary')
    actions=read_json(ROOT/'config/actions.v1.json');by_id={a['id']:a for a in actions['actions']}
    chosen=[]
    for action_id in payload.action_ids:
        a=by_id.get(action_id)
        if not a or not a['active'] or a['audience']!=payload.audience or payload.risk_level not in a['levels']:raise AppError('INVALID_INPUT',422,'validation.summary')
        chosen.append(a)
    prefix='SIMULATION — not a live forecast.' if meta['is_simulation'] else 'TEST — prototype advisory.'
    names='; '.join(wards[w]['name_en'] for w in sorted(payload.ward_ids))
    instructions=' '.join(a['text_en'] for a in chosen)
    text=f"{prefix}\nHeatGuard AI — Level {payload.risk_level}: {file('methods.json')['utci']['names'][payload.risk_level]}\nWhere: {names}. When: {iso(payload.onset)}–{iso(payload.expires)}.\nAudience: {payload.audience}.\nDo now: {instructions}\nSource: IMD Heat Wave FAQ pp.8,13–14; Open-Meteo; thermofeel. Issued {meta['issued_at']}.\nIndicative — not an official IMD declaration.\nStop: /stop deletes all Telegram subscriptions."
    content={'text':text,'instructions':instructions,'wards':[wards[w] for w in sorted(payload.ward_ids)],'onset':iso(payload.onset),'method_version':meta['method_version'],'snapshot_issued_at':meta['issued_at'],
      'hazards':{r['ward_id']:r['hazard_level'] for r in selected},'vulnerabilities':{r['ward_id']:r['vulnerability'] for r in selected},'actions':chosen,'draft_request':payload.model_dump(mode='json')}
    bound={'content':content,'snapshot_id':payload.snapshot_id,'ward_ids':sorted(payload.ward_ids),'languages':payload.languages,'expires_at':iso(payload.expires),'revision':revision,'action_version':actions['version'],'risk_level':payload.risk_level,'audience':payload.audience,'cap_status':'Exercise' if meta['is_simulation'] else 'Test','is_simulation':meta['is_simulation']}
    return content,binding_digest(bound),meta

def assert_approvable(alert,manifest):
    verify_binding(alert)
    if datetime.datetime.fromisoformat(iso(alert['expires_at']).replace('Z','+00:00'))<=now():raise AppError('STALE_SNAPSHOT',409,'authority.staleBlock')
    meta=manifest['meta']
    if meta['publication_health']!='complete':raise AppError('STALE_SNAPSHOT',409,'detail.incomplete')
    if not alert['is_simulation']:
        age=(now()-datetime.datetime.fromisoformat(meta['issued_at'].replace('Z','+00:00'))).total_seconds()
        latest,_=load(diagnostic=False)
        if age>21600 or latest['snapshot_id']!=alert['snapshot_id']:raise AppError('STALE_SNAPSHOT',409,'authority.staleBlock')
    if alert['languages']!=['en']:raise AppError('INVALID_INPUT',422,'state.translation')

def check_revision(alert,revision):
    if not alert:raise AppError('INVALID_INPUT',404,'state.noAlerts')
    if alert['revision']!=revision:raise AppError('REVISION_CONFLICT',409,'authority.changed')

def draft(payload,current,idempotency_key,request_id):
    content,sha,meta=freeze(payload)
    with database() as db:
        recheck_member(db,current,['officer','approver'])
        existing=db.execute('select * from public.alerts where idempotency_key=%s',(idempotency_key,)).fetchone()
        if existing:
            if str(existing['created_by'])!=current.user_id or existing['content_sha256']!=sha:raise AppError('REVISION_CONFLICT',409,'authority.changed')
            return safe_alert(existing)
        row=db.execute('insert into public.alerts(snapshot_id,ward_ids,risk_level,audience,languages,cap_status,content,content_sha256,action_version,created_by,expires_at,is_simulation,idempotency_key) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) returning *',
          (payload.snapshot_id,sorted(payload.ward_ids),payload.risk_level,payload.audience,payload.languages,'Exercise' if meta['is_simulation'] else 'Test',Jsonb(content),sha,'1.0.0',current.user_id,payload.expires,meta['is_simulation'],idempotency_key)).fetchone()
        for wid in sorted(payload.ward_ids):db.execute('insert into public.alert_wards(alert_id,ward_id) values(%s,%s)',(row['id'],wid))
        audit(db,current.user_id,'draft_created',row['id'],None,{'revision':1,'content_sha256':sha},request_id)
        return safe_alert(row)

def approve(alert_id,payload,current,request_id):
    with database() as db:
        recheck_member(db,current,['approver'])
        row=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone();check_revision(row,payload.expected_revision)
        if row['status']!='draft' or str(row['created_by'])==current.user_id:raise AppError('FORBIDDEN',403,'authority.independent')
        if row['content_sha256']!=payload.content_sha256:raise AppError('REVISION_CONFLICT',409,'authority.changed')
        manifest,_=load(row['snapshot_id']);assert_approvable(row,manifest)
        updated=db.execute("update public.alerts set status='approved',approved_by=%s,approved_at=now(),approval_revision=revision where id=%s returning *",(current.user_id,alert_id)).fetchone()
        audit(db,current.user_id,'approved',alert_id,{'status':'draft'},{'revision':row['revision'],'content_sha256':row['content_sha256']},request_id)
        return safe_alert(updated)

def cancel(alert_id,payload,current,request_id):
    with database() as db:
        live_role=recheck_member(db,current,['officer','approver']);row=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone();check_revision(row,payload.expected_revision)
        if row['status'] not in ['draft','approved'] or not (live_role=='approver' or (row['status']=='draft' and str(row['created_by'])==current.user_id)):raise AppError('FORBIDDEN',403,'state.forbidden')
        updated=db.execute("update public.alerts set status='cancelled',cancelled_at=now() where id=%s returning *",(alert_id,)).fetchone()
        audit(db,current.user_id,'cancelled',alert_id,{'status':row['status']},{'reason_code':payload.reason_code,'revision':row['revision']},request_id)
        return safe_alert(updated)

def patch(alert_id,payload,current,request_id):
    with database() as db:
        live_role=recheck_member(db,current,['officer','approver']);row=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone();check_revision(row,payload.expected_revision)
        if row['status']!='draft' or (live_role!='approver' and str(row['created_by'])!=current.user_id):raise AppError('FORBIDDEN',403,'state.forbidden')
        original=row['content']['draft_request'];changes=payload.model_dump(mode='json',exclude_none=True);changes.pop('expected_revision')
        original.update(changes);request=Draft.model_validate(original);content,sha,_=freeze(request,row['revision']+1)
        db.execute('delete from public.alert_wards where alert_id=%s',(alert_id,))
        updated=db.execute('update public.alerts set revision=revision+1,ward_ids=%s,languages=%s,content=%s,content_sha256=%s,expires_at=%s where id=%s returning *',(sorted(request.ward_ids),request.languages,Jsonb(content),sha,request.expires,alert_id)).fetchone()
        for wid in sorted(request.ward_ids):db.execute('insert into public.alert_wards values(%s,%s)',(alert_id,wid))
        audit(db,current.user_id,'draft_revised',alert_id,{'revision':row['revision']},{'revision':updated['revision'],'content_sha256':sha},request_id)
        return safe_alert(updated)

def delivery_summary(db, alert_id, revision):
    rows=db.execute('select status,count(*) as n from public.alert_deliveries where alert_id=%s and revision=%s group by status',(alert_id,revision)).fetchall()
    return {row['status']:row['n'] for row in rows}


def dispatch_allowed(alert, revision):
    check_revision(alert, revision)
    if alert['status']!='approved' or alert['approval_revision']!=revision:
        raise AppError('REVISION_CONFLICT',409,'authority.changed')
    manifest,_=load(alert['snapshot_id'])
    assert_approvable(alert,manifest)


async def send(alert_id,payload,current,idempotency_key,request_id):
    import os
    from .channels import Telegram
    from .security import decrypt_endpoint
    if not os.environ.get('TELEGRAM_BOT_TOKEN') or not os.environ.get('TELEGRAM_TEST_CHAT_IDS'):
        raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'telegram_test_allowlist'})
    channel=Telegram()
    with database() as db:
        recheck_member(db,current,['approver'])
        row=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone()
        check_revision(row,payload.expected_revision)
        if row['status']=='sent':
            return {'alert_id':str(alert_id),'status':'sent','deliveries':delivery_summary(db,alert_id,row['revision'])}
        dispatch_allowed(row,payload.expected_revision)
        recipients=db.execute("select distinct on (s.handle_hash) s.id,s.handle_hash,x.endpoint_ciphertext from public.subscriptions s join app_private.subscription_secrets x on x.subscription_id=s.id where s.channel='telegram' and s.confirmed_at is not null and s.ward_id=any(%s) and s.lang=any(%s) and s.audience=%s and s.consent_expires_at>now() order by s.handle_hash,s.id",(row['ward_ids'],row['languages'],row['audience'])).fetchall()
        eligible=False
        for recipient in recipients:
            endpoint=decrypt_endpoint(bytes(recipient['endpoint_ciphertext']))
            try:channel.validate_recipient(endpoint)
            except AppError:continue
            eligible=True
            # One delivery per consented chat, even when it subscribes to several wards.
            recipient_key=digest(str(alert_id)+':telegram:'+recipient['handle_hash'])
            db.execute("insert into public.alert_deliveries(alert_id,subscription_id,channel,recipient_key,revision,status) values(%s,%s,'telegram',%s,%s,'pending') on conflict do nothing",(alert_id,recipient['id'],recipient_key,row['revision']))
        if not eligible and not delivery_summary(db,alert_id,row['revision']):
            raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'confirmed_test_recipients'})
        jobs=db.execute("select id,subscription_id from public.alert_deliveries where alert_id=%s and revision=%s and status='pending' order by id",(alert_id,row['revision'])).fetchall()
        audit(db,current.user_id,'outbox_requested',alert_id,None,{'revision':row['revision'],'idempotency_key':idempotency_key},request_id)
    for job in jobs:
        # Persist the claim BEFORE network I/O. A crash after this point leaves
        # sending/unknown acceptance, which this endpoint never blindly retries.
        with database() as db:
            recheck_member(db,current,['approver'])
            locked=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone()
            dispatch_allowed(locked,payload.expected_revision)
            claimed=db.execute("update public.alert_deliveries set status='sending',attempts=attempts+1 where id=%s and status='pending' returning id",(job['id'],)).fetchone()
        if not claimed:continue
        with database() as db:
            recheck_member(db,current,['approver'])
            locked=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone()
            dispatch_allowed(locked,payload.expected_revision)
            recipient=db.execute('select x.endpoint_ciphertext from public.subscriptions s join app_private.subscription_secrets x on x.subscription_id=s.id where s.id=%s and s.confirmed_at is not null and s.consent_expires_at>now() and s.ward_id=any(%s) and s.lang=any(%s) and s.audience=%s for share of s,x',(job['subscription_id'],locked['ward_ids'],locked['languages'],locked['audience'])).fetchone()
            if not recipient:
                db.execute("update public.alert_deliveries set status='failed',error_code='CONSENT_REMOVED',completed_at=now() where id=%s",(job['id'],))
                continue
            # Bounded provider timeout; alert/subscription locks serialize cancel,
            # approved-content changes and deletion against this precise handoff.
            result=await channel.send(locked,decrypt_endpoint(bytes(recipient['endpoint_ciphertext'])),str(job['id']))
            db.execute('update public.alert_deliveries set status=%s,provider_message_id=%s,error_code=%s,completed_at=now() where id=%s',(result.status,result.provider_message_id,result.error_code,job['id']))
    with database() as db:
        recheck_member(db,current,['approver'])
        locked=db.execute('select * from public.alerts where id=%s for update',(alert_id,)).fetchone()
        summary=delivery_summary(db,alert_id,locked['revision'])
        status=locked['status']
        if status=='approved' and summary and set(summary)<= {'succeeded','simulated'}:
            db.execute("update public.alerts set status='sent',sent_at=now() where id=%s",(alert_id,))
            status='sent'
            audit(db,current.user_id,'delivery_completed',alert_id,None,{'revision':locked['revision'],'delivery_summary':summary},request_id)
        return {'alert_id':str(alert_id),'status':status,'deliveries':summary}
