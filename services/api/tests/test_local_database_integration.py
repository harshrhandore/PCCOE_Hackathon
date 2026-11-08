"""Opt-in tests against actual loopback Supabase Auth and PostGIS, no providers."""
import datetime,json,os,re,secrets,subprocess,uuid
from pathlib import Path
import httpx,jwt,psycopg,pytest
from psycopg import sql
from psycopg.rows import dict_row
from fastapi.testclient import TestClient
from scripts.local import load_env
from scripts.local_db import ROOT,local_url,wsl,WSL_DISTRO
from scripts.staff import auth_admin,create
from services.api.app import main,workflow,cap
from services.api.app.snapshots import load,data_root

pytestmark=pytest.mark.skipif(os.environ.get('HEATGUARD_RUN_DB_TESTS')!='1',reason='Explicit local Auth/PostGIS integration opt-in required')

class Context:
    def __repr__(self):return '<LocalIntegrationContext: credentials redacted>'
    def admin(self):return psycopg.connect(os.environ['HEATGUARD_LOCAL_ADMIN_DATABASE_URL'],row_factory=dict_row)
    def login(self,role):
        response=self.client.post('/api/v1/auth/login',json=self.accounts[role]['login'])
        assert response.status_code==200,response.text
        token=response.json()['data']['access_token']
        return token,{'Authorization':'Bearer '+token}
    def payload(self):
        manifest,file=load(self.snapshot)
        row=next(r for r in file('forecast.json')['daily'] if r['risk_level'] is not None and r['risk_level']>=1)
        expires=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=1)).astimezone(datetime.timezone(datetime.timedelta(hours=5,minutes=30)))
        return {'snapshot_id':self.snapshot,'ward_ids':[row['ward_id']],'risk_level':row['risk_level'],'audience':'citizen','languages':['en'],'action_ids':['citizen_water'],'onset':row['date']+'T00:00:00+05:30','expires':expires.isoformat()}
    def draft(self):
        _,headers=self.login('officer');key=str(uuid.uuid4());payload=self.payload()
        response=self.client.post('/api/v1/alerts/draft',headers={**headers,'Idempotency-Key':key},json=payload)
        assert response.status_code==201,response.text
        return response.json()['data']['alert'],headers,key,payload

@pytest.fixture(scope='module')
def context():
    load_env(ROOT/'.env')
    local_url(os.environ['SUPABASE_URL'],54321);local_url(os.environ['HEATGUARD_LOCAL_ADMIN_DATABASE_URL'],54322)
    ctx=Context();ctx.client=TestClient(main.app);ctx.accounts={}
    manifest=json.loads(next((data_root()/'replay').glob('*/latest.json')).read_text())
    ctx.snapshot=manifest['snapshot_id']
    main.rate_limits.clear()
    try:
        for role in ['officer','approver','viewer','outsider']:
            email=f'integration-{uuid.uuid4().hex}-{role}@heatguard.test';password=secrets.token_urlsafe(24)
            user=create(email,password,role) if role!='outsider' else auth_admin('POST','users',{'email':email,'password':password,'email_confirm':True,'app_metadata':{'local_test_account':True}})
            ctx.accounts[role]={'id':user['id'],'login':{'email':email,'password':password}}
        yield ctx
    finally:
        with ctx.admin() as db:
            for account in ctx.accounts.values():
                db.execute('update app_private.authority_members set active=false where user_id=%s',(account['id'],))
                db.execute('delete from auth.sessions where user_id=%s',(account['id'],))
        ctx.client.close();main.rate_limits.clear()

def test_real_password_sign_in_signature_checks_and_session_revocation(context):
    token,headers=context.login('officer')
    session=context.client.get('/api/v1/session',headers=headers)
    assert session.status_code==200 and session.json()['data']['role']=='officer'
    claims=jwt.decode(token,options={'verify_signature':False})
    forged=jwt.encode({**claims,'role':'service_role'},'explicit-test-key-not-an-actual-secret',algorithm='HS256')
    assert context.client.get('/api/v1/session',headers={'Authorization':'Bearer '+forged}).status_code==401
    assert context.client.post('/api/v1/auth/logout',headers=headers).status_code==200
    assert context.client.get('/api/v1/session',headers=headers).status_code in [401,403]

def test_no_public_signup_and_no_membership_means_no_staff_access(context):
    _,headers=context.login('outsider')
    assert context.client.get('/api/v1/session',headers=headers).status_code==403
    assert context.client.get('/api/v1/alerts',headers=headers).status_code==403
    response=httpx.post(os.environ['SUPABASE_URL']+'/auth/v1/signup',headers={'apikey':os.environ['SUPABASE_PUBLISHABLE_KEY']},json={'email':'disabled-signup@heatguard.test','password':secrets.token_urlsafe(24)},timeout=10)
    assert response.status_code in [400,403,422]

def test_independent_exact_revision_approval_cap_and_cancellation(context):
    alert,officer,key,payload=context.draft();alert_id=alert['id']
    duplicate=context.client.post('/api/v1/alerts/draft',headers={**officer,'Idempotency-Key':key},json=payload)
    assert duplicate.status_code==201 and duplicate.json()['data']['alert']['id']==alert_id
    _,reviewer=context.login('approver')
    approval={'expected_revision':1,'content_sha256':alert['content_sha256']}
    # Creator temporarily has a real approver role: self-approval must still fail.
    with context.admin() as db:db.execute("update app_private.authority_members set role='approver' where user_id=%s",(context.accounts['officer']['id'],))
    try:
        assert context.client.post(f'/api/v1/alerts/{alert_id}/approve',headers=officer,json=approval).status_code==403
    finally:
        with context.admin() as db:db.execute("update app_private.authority_members set role='officer' where user_id=%s",(context.accounts['officer']['id'],))
    changed=context.client.patch(f'/api/v1/alerts/{alert_id}',headers=officer,json={'expected_revision':1,'expires':(datetime.datetime.fromisoformat(payload['expires'])+datetime.timedelta(minutes=1)).isoformat()})
    assert changed.status_code==200,changed.text
    revised=changed.json()['data']['alert'];assert revised['revision']==2
    assert context.client.post(f'/api/v1/alerts/{alert_id}/approve',headers=reviewer,json=approval).status_code==409
    approved=context.client.post(f'/api/v1/alerts/{alert_id}/approve',headers=reviewer,json={'expected_revision':2,'content_sha256':revised['content_sha256']})
    assert approved.status_code==200,approved.text
    assert approved.json()['data']['alert']['status']=='approved'
    xml=context.client.get(f'/api/v1/alerts/{alert_id}/cap.xml',headers=reviewer)
    assert xml.status_code==200 and cap.validate(xml.content)
    assert b'<status>Exercise</status>' in xml.content and b'<scope>Restricted</scope>' in xml.content
    assert xml.headers['x-heatguard-is-simulation']=='true'
    assert context.client.patch(f'/api/v1/alerts/{alert_id}',headers=officer,json={'expected_revision':2,'languages':['en']}).status_code==403
    with context.admin() as db:
        with db.transaction(force_rollback=True):
            with pytest.raises(psycopg.errors.RaiseException):
                db.execute('update public.alerts set risk_level=%s where id=%s',((payload['risk_level']+1)%5,alert_id))
    cancelled=context.client.post(f'/api/v1/alerts/{alert_id}/cancel',headers=reviewer,json={'expected_revision':2,'reason_code':'withdrawn'})
    assert cancelled.status_code==200,cancelled.text
    events=context.client.get(f'/api/v1/alerts/{alert_id}/audit',headers=officer).json()['data']['items']
    assert [e['event'] for e in events]==['draft_created','draft_revised','approved','cancelled']

def test_viewer_cannot_draft_or_approve(context):
    alert,_,_,_=context.draft();_,viewer=context.login('viewer')
    assert context.client.get('/api/v1/alerts',headers=viewer).status_code==200
    assert context.client.post('/api/v1/alerts/draft',headers={**viewer,'Idempotency-Key':str(uuid.uuid4())},json=context.payload()).status_code==403
    assert context.client.post(f"/api/v1/alerts/{alert['id']}/approve",headers=viewer,json={'expected_revision':1,'content_sha256':alert['content_sha256']}).status_code==403

def test_direct_data_api_rls_obeys_membership_and_revoked_sessions(context):
    context.draft();token,headers=context.login('officer');outside,_=context.login('outsider')
    def records(bearer):
        return httpx.get(os.environ['SUPABASE_URL']+'/rest/v1/alerts?select=id',headers={'apikey':os.environ['SUPABASE_PUBLISHABLE_KEY'],'Authorization':'Bearer '+bearer},timeout=10)
    staff=records(token);assert staff.status_code==200 and len(staff.json())>0
    outsider=records(outside);assert outsider.status_code==200 and outsider.json()==[]
    with context.admin() as db:db.execute('update app_private.authority_members set active=false where user_id=%s',(context.accounts['officer']['id'],))
    try:
        assert context.client.get('/api/v1/alerts',headers=headers).status_code==403
        removed=records(token);assert removed.status_code==200 and removed.json()==[]
    finally:
        with context.admin() as db:db.execute('update app_private.authority_members set active=true where user_id=%s',(context.accounts['officer']['id'],))
    assert context.client.post('/api/v1/auth/logout',headers=headers).status_code==200
    revoked=records(token);assert revoked.status_code==200 and revoked.json()==[]

def test_database_grants_and_private_schema_do_not_expose_secrets(context):
    for role in ['anon','authenticated']:
        for table in ['app_private.authority_members','app_private.subscription_secrets','public.subscriptions']:
            with context.admin() as db:
                with db.transaction(force_rollback=True):
                    db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                    with pytest.raises(psycopg.errors.InsufficientPrivilege):db.execute(sql.SQL('select * from {} limit 1').format(sql.Identifier(*table.split('.'))))
        with context.admin() as db:
            with db.transaction(force_rollback=True):
                db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                assert db.execute('select count(*) as n from public.wards').fetchone()['n']>0
                with pytest.raises(psycopg.errors.InsufficientPrivilege):db.execute('update public.alerts set risk_level=0')
    with psycopg.connect(os.environ['DATABASE_URL'],row_factory=dict_row) as db:
        role=db.execute('select rolsuper,rolcreaterole,rolcreatedb from pg_roles where rolname=current_user').fetchone()
        assert not any(role.values())

def test_ward_set_constraint_and_immutable_audit(context):
    alert,_,_,_=context.draft()
    with context.admin() as db:
        with db.transaction(force_rollback=True):
            db.execute('delete from public.alert_wards where alert_id=%s',(alert['id'],))
            with pytest.raises(psycopg.errors.RaiseException):db.execute('set constraints all immediate')
    with context.admin() as db:
        with db.transaction(force_rollback=True):
            with pytest.raises(psycopg.errors.RaiseException):db.execute('update public.audit_log set event=event where entity_id=%s',(alert['id'],))

def test_complete_migrations_replay_in_a_fresh_disposable_database(context):
    name='heatguard_migration_test_'+uuid.uuid4().hex
    assert re.fullmatch(r'heatguard_migration_test_[0-9a-f]{32}',name)
    docker=['wsl','-d',WSL_DISTRO,'-u','root','--exec','docker'] if os.name=='nt' else ['docker']
    dump=subprocess.run([*docker,'exec','-u','postgres','supabase_db_heatguard-local','pg_dump','-U','postgres','--schema-only','--schema=auth','--no-owner','--no-privileges','postgres'],check=True,capture_output=True,text=True).stdout
    with psycopg.connect(os.environ['HEATGUARD_LOCAL_ADMIN_DATABASE_URL'],autocommit=True) as admin:
        admin.execute(sql.SQL('create database {}').format(sql.Identifier(name)))
        try:
            subprocess.run([*docker,'exec','-i','-u','postgres','supabase_db_heatguard-local','psql','-U','postgres','-v','ON_ERROR_STOP=1','-d',name],input=dump,check=True,capture_output=True,text=True)
            with psycopg.connect(os.environ['HEATGUARD_LOCAL_ADMIN_DATABASE_URL'],dbname=name) as fresh:
                for migration in sorted((ROOT/'supabase/migrations').glob('*.sql')):fresh.execute(migration.read_text(encoding='utf-8'))
                assert fresh.execute("select extversion from pg_extension where extname='postgis'").fetchone()[0]
                tables=fresh.execute("select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','app_private') and c.relkind='r'").fetchall()
                assert {'alerts','audit_log','authority_members','subscription_secrets'}<={t[0] for t in tables}
                assert all(t[1] for t in tables)
        finally:
            admin.execute(sql.SQL('drop database {}').format(sql.Identifier(name)))
