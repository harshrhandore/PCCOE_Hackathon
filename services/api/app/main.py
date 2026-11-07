from __future__ import annotations
import asyncio,base64,datetime,hashlib,hmac,json,os,secrets,time,uuid
from collections import OrderedDict,defaultdict,deque
from pathlib import Path
from typing import Annotated
import httpx
from fastapi import FastAPI,Request,Depends,Query,Header
from fastapi.responses import JSONResponse,Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException
from pipeline.io import ROOT,canonical,digest,read_json
from pipeline.heatguard_core.config import methods
from pipeline.heatguard_core.thermal import transform,compute
from pipeline.heatguard_core.hazard import daily_records
from pipeline.heatguard_core.risk import adjusted_risk
from pipeline.heatguard_core.units import json_safe
from .contracts import WhatIf,Login,Subscription,Draft,Approval,Send,Cancel,PatchDraft
from .errors import AppError
from .auth import member,Member
from .storage import database
from .snapshots import load,data_root
from . import workflow,cap
from .security import encrypt_endpoint,keyed_hash,key

app=FastAPI(title='HeatGuard AI prototype',version='1.0.0',description='Static-first model-based research prototype. Test/Exercise alerts only.')
origins=[x.strip() for x in os.environ.get('API_ALLOWED_ORIGINS','http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173').split(',') if x.strip()]
app.add_middleware(CORSMiddleware,allow_origins=origins,allow_credentials=False,allow_methods=['GET','POST','PATCH','DELETE'],allow_headers=['Authorization','Content-Type','Idempotency-Key','X-Request-ID','X-Telegram-Bot-Api-Secret-Token'],expose_headers=['X-Request-ID','ETag'])
rate_limits=defaultdict(deque);scenarios=OrderedDict()

def metadata(meta=None):
    return meta or {'snapshot_id':None,'issued_at':None,'model_run':None,'data_vintage':{},'git_sha':None,'is_simulation':False,'mode':'live','schema_version':'1.0.0','method_version':'1.0.0','timezone':'Asia/Kolkata','quality_flags':[]}
def envelope(data,meta=None):return {'data':json_safe(data),'meta':metadata(meta)}
def error_response(error,request):
    body=envelope(None);body['error']={'code':error.code,'message_key':error.message_key,'details':error.details,'retryable':error.retryable,'request_id':getattr(request.state,'request_id',str(uuid.uuid4()))}
    return JSONResponse(body,status_code=error.status,headers={'Cache-Control':'no-store',**({'Retry-After':'60'} if error.status==429 else {})})

@app.middleware('http')
async def safeguards(request:Request,call_next):
    request.state.request_id=str(uuid.uuid4())
    key_ip=request.client.host if request.client else 'unknown';timestamp=time.monotonic();bucket=rate_limits[key_ip]
    while bucket and timestamp-bucket[0]>60:bucket.popleft()
    if len(bucket)>=120:return error_response(AppError('RATE_LIMITED',429,'validation.tooMany',{'seconds':60},True),request)
    bucket.append(timestamp)
    # Bound keys as well as per-IP event queues; do not retain IPs indefinitely.
    if len(rate_limits)>10000:
        for k in list(rate_limits)[:5000]:
            if not rate_limits[k] or timestamp-rate_limits[k][-1]>60:rate_limits.pop(k,None)
    if request.method in ['POST','PATCH','DELETE']:
        if int(request.headers.get('content-length','0') or '0')>65536:return error_response(AppError('INVALID_INPUT',413,'validation.summary'),request)
        if len(await request.body())>65536:return error_response(AppError('INVALID_INPUT',413,'validation.summary'),request)
    try:response=await call_next(request)
    except Exception:return error_response(AppError('DEPENDENCY_UNAVAILABLE'),request)
    response.headers['X-Request-ID']=request.state.request_id
    response.headers['X-Content-Type-Options']='nosniff'
    if any(x in request.url.path for x in ['/alerts','/subscriptions','/session','/auth','/integrations']):response.headers['Cache-Control']='no-store'
    elif request.method=='GET' and response.status_code==200:
        response.headers.setdefault('Cache-Control','public,max-age=60,must-revalidate')
    return response

@app.exception_handler(AppError)
async def app_error(request,error):return error_response(error,request)
@app.exception_handler(RequestValidationError)
async def validation_error(request,error):
    # Do not echo Pydantic input values: they may contain passwords or tokens.
    return error_response(AppError('INVALID_INPUT',422,'validation.summary',{'fields':['.'.join(str(x) for x in e['loc']) for e in error.errors()]}),request)
@app.exception_handler(HTTPException)
async def http_error(request,error):return error_response(AppError('WARD_NOT_FOUND' if error.status_code==404 else 'INVALID_INPUT',error.status_code,'state.notFound' if error.status_code==404 else 'validation.summary'),request)

def idempotency(value:str|None):
    if value is None or not 8<=len(value)<=128:raise AppError('INVALID_INPUT',422,'validation.summary')
    return value

@app.get('/health')
@app.get('/api/v1/health')
def health(readiness:bool=False):
    db='not_configured' if not os.environ.get('DATABASE_URL') else 'not_checked'
    if readiness and os.environ.get('DATABASE_URL'):
        try:
            with database() as connection:connection.execute('select 1').fetchone();db='ready'
        except AppError:db='unavailable'
    age=None;pipeline='unavailable'
    try:
        m,_=load();age=(datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(m['meta']['issued_at'].replace('Z','+00:00'))).total_seconds();pipeline=m['meta']['publication_health']
    except AppError:pass
    configured=all(os.environ.get(k) for k in ['DATABASE_URL','SUPABASE_JWKS_URL','SUPABASE_JWT_ISSUER','HANDLE_HMAC_KEY','HANDLE_ENCRYPTION_KEY','DELETION_TOKEN_HMAC_KEY'])
    return envelope({'status':'ok' if configured and pipeline=='complete' and db in ['ready','not_checked'] else 'degraded','api':'ready','db':db,'pipeline':pipeline,'snapshot_age_seconds':age,'mutations':'enabled' if configured else 'disabled_missing_configuration','sources':{'weather':'last_snapshot_only','model_run':'unavailable'}})

@app.get('/api/v1/methods')
def get_methods(version:str|None=None):
    result=methods()
    if version and version!=result['version']:raise AppError('INVALID_INPUT',404,'state.notFound')
    return JSONResponse(envelope(result),headers={'ETag':'"'+digest(result)+'"'})

@app.get('/api/v1/wards')
def wards(limit:int=Query(50,ge=1,le=200),cursor:str|None=None,include_geometry:bool=False,boundary_version:str|None=None):
    manifest,file=load();registry=file('geography.json')
    if boundary_version and boundary_version!=registry['boundary_version']:raise AppError('INVALID_INPUT',422,'validation.summary')
    offset=0
    if cursor:
        try:offset=int(base64.urlsafe_b64decode(cursor).decode())
        except Exception:raise AppError('INVALID_INPUT',422,'validation.summary')
        if offset<0:raise AppError('INVALID_INPUT',422,'validation.summary')
    items=registry['wards'][offset:offset+limit];next_offset=offset+limit
    result={'items':items,'total':registry['ward_count'],'next_cursor':base64.urlsafe_b64encode(str(next_offset).encode()).decode() if next_offset<registry['ward_count'] else None}
    if include_geometry:result['geometry']=file('wards.geojson')
    return envelope(result,manifest['meta'])

@app.get('/api/v1/wards/{ward_id}')
def ward_detail(ward_id:str,snapshot_id:str|None=None,date:datetime.date|None=None,t:int=Query(14,ge=0,le=23)):
    manifest,file=load(snapshot_id);ward=next((w for w in file('geography.json')['wards'] if w['id']==ward_id),None)
    if ward is None:raise AppError('WARD_NOT_FOUND',404,'state.notFound')
    daily=[r for r in file('forecast.json')['daily'] if r['ward_id']==ward_id and (date is None or r['date']==date.isoformat())]
    return envelope({'ward':ward,'daily':daily,'hourly':file(f'hourly/{ward_id}.json'),'vulnerability_components':next((r for r in file('features.json')['wards'] if r['ward_id']==ward_id),None),'refuges':[],'actions':read_json(ROOT/'config/actions.v1.json')['actions'],'provenance':ward['provenance']},manifest['meta'])

@app.get('/api/v1/forecast')
def forecast(date:datetime.date,snapshot_id:str|None=None,ward_id:str|None=None):
    manifest,file=load(snapshot_id)
    if date.isoformat() not in manifest['meta']['dates']:raise AppError('INVALID_INPUT',422,'validation.date')
    all_rows=file('forecast.json')['daily'];rows=[r for r in all_rows if r['date']==date.isoformat() and (ward_id is None or r['ward_id']==ward_id)]
    if ward_id and not rows:raise AppError('WARD_NOT_FOUND',404,'state.notFound')
    return envelope({'date':date.isoformat(),'wards':rows,'counts_by_level':[sum(r['risk_level']==i for r in rows) for i in range(5)],'unknown_count':sum(r['risk_level'] is None for r in rows)},manifest['meta'])

@app.get('/api/v1/bulletin/latest')
def bulletin(snapshot_id:str|None=None,lang:str='en'):
    if lang not in ['en','hi','mr']:raise AppError('INVALID_INPUT',422,'validation.summary')
    manifest,file=load(snapshot_id);return envelope(file('bulletin.json'),manifest['meta'])

@app.get('/api/v1/replay/{episode_id}')
def replay(episode_id:str):
    if not __import__('re').fullmatch(r'[A-Za-z0-9_-]{1,100}',episode_id):raise AppError('INVALID_INPUT',422,'validation.summary')
    path=data_root()/'replay'/episode_id/'episode.json'
    if not path.exists():raise AppError('SNAPSHOT_UNAVAILABLE')
    value=read_json(path);return envelope(value,{**metadata(),'mode':'replay','is_simulation':True})

@app.post('/api/v1/whatif')
def whatif(payload:WhatIf):
    manifest,file=load(payload.snapshot_id);registry=file('geography.json');ids={w['id'] for w in registry['wards']}
    if set(payload.ward_ids)-ids:raise AppError('INVALID_INPUT',422,'validation.ward')
    if payload.weights_mode=='equal':raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'complete_vulnerability_cohort'})
    key_scenario=digest(payload.model_dump());timestamp=time.time()
    for k in list(scenarios):
        if scenarios[k][0]<timestamp:scenarios.pop(k)
    if key_scenario in scenarios:return scenarios[key_scenario][1]
    source=ROOT/'data/raw/latest-forecast.json'
    if not source.exists() or payload.snapshot_id!=load()[0]['snapshot_id']:raise AppError('SNAPSHOT_UNAVAILABLE')
    raw_by_id={r['ward_id']:r['raw'] for r in read_json(source)}
    if any(w not in raw_by_id for w in payload.ward_ids):raise AppError('SNAPSHOT_UNAVAILABLE')
    baseline=[r for r in file('forecast.json')['daily'] if r['ward_id'] in payload.ward_ids];scenario=[];clamps=0
    climate=read_json(ROOT/'data/processed/climatology.json') if (ROOT/'data/processed/climatology.json').exists() else {'cells':{},'ward_cells':{}}
    for w in registry['wards']:
        if w['id'] not in payload.ward_ids:continue
        changed,count=transform(raw_by_id[w['id']],payload.temperature_delta_c,payload.relative_humidity_delta_pp,payload.wind_multiplier);clamps+=count['rh']
        hourly=compute(changed,w['weather_point'][1],w['weather_point'][0]);cell=climate['cells'].get(climate['ward_cells'].get(w['id']),{})
        for r in daily_records(hourly,manifest['meta']['dates'],cell.get('night_thresholds'),cell.get('tmax_normals')):
            original=next(x for x in baseline if x['ward_id']==w['id'] and x['date']==r['date']);scenario.append({**r,**adjusted_risk(r['hazard_level'],original['vulnerability'],original['top_quintile']),'ward_id':w['id'],'vulnerability':original['vulnerability']})
    result={'scenario_id':key_scenario,'source_snapshot_id':payload.snapshot_id,'applied_deltas':payload.model_dump(),'clamp_counts':{'rh':clamps},'baseline':baseline,'scenario':scenario,'comparison':{'baseline_severe_days':sum(r['risk_level'] is not None and r['risk_level']>=3 for r in baseline),'scenario_severe_days':sum(r['risk_level'] is not None and r['risk_level']>=3 for r in scenario)},'expires_at':datetime.datetime.fromtimestamp(timestamp+3600,datetime.timezone.utc).isoformat(),'content_sha256':digest(scenario)}
    response=envelope(result,{**manifest['meta'],'mode':'whatif','is_simulation':True});scenarios[key_scenario]=(timestamp+3600,response)
    while len(scenarios)>100:scenarios.popitem(last=False)
    return response

@app.post('/api/v1/auth/login')
async def login(payload:Login):
    url=os.environ.get('SUPABASE_URL');publishable=os.environ.get('SUPABASE_PUBLISHABLE_KEY')
    if not url or not publishable:raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'auth_configuration'})
    async with httpx.AsyncClient(timeout=10) as client:r=await client.post(url.rstrip('/')+'/auth/v1/token?grant_type=password',headers={'apikey':publishable},json=payload.model_dump())
    if not r.is_success:raise AppError('UNAUTHENTICATED',401,'validation.signIn')
    value=r.json();return envelope({'access_token':value['access_token'],'expires_in':value['expires_in']})

@app.get('/api/v1/session')
def session(current:Member=Depends(member)):return envelope({'role':current.role})

@app.post('/api/v1/alerts/draft',status_code=201)
def draft(payload:Draft,request:Request,current:Member=Depends(member),idempotency_key:str|None=Header(None)):
    result=workflow.draft(payload,current,idempotency(idempotency_key),request.state.request_id);return envelope({'alert':result,'channel_previews':{'telegram':result['content']['text'],'sms_simulator':'SIMULATOR ONLY\n'+result['content']['text']},'cap_preview_url':f"/api/v1/alerts/{result['id']}/cap.xml"})

@app.get('/api/v1/alerts')
def alerts(current:Member=Depends(member),limit:int=Query(50,ge=1,le=200),status:str|None=None):
    if status and status not in ['draft','approved','sent','cancelled']:raise AppError('INVALID_INPUT',422,'validation.summary')
    with database() as db:
        rows=db.execute('select id,status,revision,ward_ids,risk_level,audience,languages,created_at,approved_at,sent_at,is_simulation,cap_status,expires_at from public.alerts where (%s::text is null or status=%s) order by created_at desc limit %s',(status,status,limit)).fetchall()
        return envelope({'items':[workflow.safe_alert(r) for r in rows],'next_cursor':None})

@app.patch('/api/v1/alerts/{alert_id}')
def edit(alert_id:uuid.UUID,payload:PatchDraft,request:Request,current:Member=Depends(member)):return envelope({'alert':workflow.patch(alert_id,payload,current,request.state.request_id)})
@app.post('/api/v1/alerts/{alert_id}/approve')
def approve(alert_id:uuid.UUID,payload:Approval,request:Request,current:Member=Depends(member)):return envelope({'alert':workflow.approve(alert_id,payload,current,request.state.request_id)})
@app.post('/api/v1/alerts/{alert_id}/cancel')
def cancel(alert_id:uuid.UUID,payload:Cancel,request:Request,current:Member=Depends(member)):return envelope({'alert':workflow.cancel(alert_id,payload,current,request.state.request_id)})
@app.post('/api/v1/alerts/{alert_id}/send',status_code=202)
async def send(alert_id:uuid.UUID,payload:Send,request:Request,current:Member=Depends(member),idempotency_key:str|None=Header(None)):return envelope(await workflow.send(alert_id,payload,current,idempotency(idempotency_key),request.state.request_id))

@app.get('/api/v1/alerts/{alert_id}/cap.xml')
def get_cap(alert_id:uuid.UUID,current:Member=Depends(member),download:bool=True):
    with database() as db:row=db.execute('select * from public.alerts where id=%s',(alert_id,)).fetchone()
    if not row:raise AppError('INVALID_INPUT',404,'state.noAlerts')
    xml=cap.generate(workflow.safe_alert(row));cap.validate(xml)
    return Response(xml,media_type='application/cap+xml',headers={'Content-Disposition':f'attachment; filename="heatguard-{alert_id}-r{row["revision"]}.xml"','X-HeatGuard-Snapshot-ID':row['snapshot_id'],'X-HeatGuard-Is-Simulation':str(row['is_simulation']).lower(),'X-HeatGuard-Issued-At':row['content']['snapshot_issued_at']})

@app.get('/api/v1/alerts/{alert_id}/audit')
def audit_rows(alert_id:uuid.UUID,current:Member=Depends(member)):
    with database() as db:
        rows=db.execute('select event,created_at,after_state from public.audit_log where entity_id=%s order by id',(str(alert_id),)).fetchall()
    return envelope({'items':[workflow.safe_alert(r) for r in rows]})

@app.post('/api/v1/subscriptions',status_code=202)
def subscribe(payload:Subscription):
    if payload.channel!='telegram':raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':payload.channel})
    username=os.environ.get('TELEGRAM_BOT_USERNAME');secret=os.environ.get('TELEGRAM_WEBHOOK_SECRET')
    if not username or not secret:raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'telegram_configuration'})
    key('HANDLE_ENCRYPTION_KEY');token=secrets.token_urlsafe(32);token_hash=keyed_hash(token)
    _,file=load()
    if payload.ward_id not in {w['id'] for w in file('geography.json')['wards']}:raise AppError('WARD_NOT_FOUND',404,'validation.ward')
    expires=datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(minutes=30)
    with database() as db:row=db.execute('insert into app_private.pending_registrations(token_hash,ward_id,lang,audience,consent_version,expires_at) values(%s,%s,%s,%s,%s,%s) returning id',(token_hash,payload.ward_id,payload.lang,payload.audience,payload.consent_version,expires)).fetchone()
    return envelope({'subscription_id':str(row['id']),'status':'pending_confirmation','confirmation':{'type':'telegram_start','url':f'https://t.me/{username}?start={token}','expires_at':expires.isoformat()}})

@app.post('/api/v1/integrations/telegram/webhook')
async def telegram_webhook(request:Request,x_telegram_bot_api_secret_token:str|None=Header(None)):
    expected=os.environ.get('TELEGRAM_WEBHOOK_SECRET')
    if not expected or not hmac.compare_digest(x_telegram_bot_api_secret_token or '',expected):raise AppError('FORBIDDEN',403,'state.forbidden')
    update=await request.json();update_id=update.get('update_id');message=update.get('message',{});chat=message.get('chat',{});text=message.get('text','')
    if not isinstance(update_id,int) or chat.get('type')!='private' or not isinstance(chat.get('id'),int) or not isinstance(text,str):return envelope({'accepted':True})
    handle=str(chat['id']);handle_hash=keyed_hash(handle)
    with database() as db:
        dedup=db.execute('insert into app_private.telegram_updates(update_id) values(%s) on conflict do nothing returning update_id',(update_id,)).fetchone()
        if not dedup:return envelope({'accepted':True,'duplicate':True})
        if text.strip()=='/stop':
            ids=db.execute("select id from public.subscriptions where channel='telegram' and handle_hash=%s for update",(handle_hash,)).fetchall()
            for row in ids:
                db.execute("update public.alert_deliveries set subscription_id=null,status=case when status in ('pending','sending') then 'failed' else status end,error_code=case when status in ('pending','sending') then 'CONSENT_REMOVED' else error_code end where subscription_id=%s",(row['id'],))
            db.execute("delete from public.subscriptions where channel='telegram' and handle_hash=%s",(handle_hash,));return envelope({'accepted':True,'deleted':True})
        if text.startswith('/start '):
            token=text.split(' ',1)[1].strip()
            if len(token)>128:return envelope({'accepted':True})
            registration=db.execute('delete from app_private.pending_registrations where token_hash=%s and expires_at>now() returning *',(keyed_hash(token),)).fetchone()
            if registration:
                subscription_id=uuid.uuid4();deletion_token=secrets.token_urlsafe(32)
                row=db.execute("insert into public.subscriptions(id,channel,handle_hash,ward_id,lang,audience,consent_at,consent_version,consent_expires_at,confirmed_at) values(%s,'telegram',%s,%s,%s,%s,%s,%s,now()+interval '12 months',now()) on conflict(channel,handle_hash,ward_id,lang,audience) do update set consent_at=excluded.consent_at,consent_expires_at=excluded.consent_expires_at,confirmed_at=now() returning id",(subscription_id,handle_hash,registration['ward_id'],registration['lang'],registration['audience'],registration['consent_at'],registration['consent_version'])).fetchone()
                db.execute('insert into app_private.subscription_secrets(subscription_id,endpoint_ciphertext,encryption_key_version,deletion_token_hash) values(%s,%s,%s,%s) on conflict(subscription_id) do update set endpoint_ciphertext=excluded.endpoint_ciphertext,deletion_token_hash=excluded.deletion_token_hash',(row['id'],encrypt_endpoint(handle),'1',keyed_hash(deletion_token,'DELETION_TOKEN_HMAC_KEY')))
                # /stop is the active deletion path. Browser token delivery awaits a
                # once-only private confirmation UI; never leak it in webhook output.
    return envelope({'accepted':True})

@app.delete('/api/v1/subscriptions/{subscription_id}')
def delete_subscription(subscription_id:uuid.UUID,authorization:str|None=Header(None)):
    if not authorization or not authorization.startswith('Bearer '):raise AppError('UNAUTHENTICATED',401,'state.unauthorized')
    token=authorization[7:]
    with database() as db:
        row=db.execute('select subscription_id from app_private.subscription_secrets where subscription_id=%s and deletion_token_hash=%s for update',(subscription_id,keyed_hash(token,'DELETION_TOKEN_HMAC_KEY'))).fetchone()
        if not row:raise AppError('FORBIDDEN',403,'state.forbidden')
        db.execute("update public.alert_deliveries set subscription_id=null,status=case when status in ('pending','sending') then 'failed' else status end where subscription_id=%s",(subscription_id,))
        db.execute('delete from public.subscriptions where id=%s',(subscription_id,))
    return envelope({'deleted':True})
