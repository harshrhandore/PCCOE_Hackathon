import base64,os
import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.app.contracts import WhatIf
from services.api.app.security import encrypt_endpoint,decrypt_endpoint,keyed_hash
from services.api.app.cap import generate,validate
from services.api.app.workflow import check_revision
from services.api.app.errors import AppError

client=TestClient(app)

def test_health_is_honest_without_credentials(monkeypatch):
    monkeypatch.delenv('DATABASE_URL',raising=False)
    r=client.get('/api/v1/health');assert r.status_code==200
    assert r.json()['data']['db']=='not_configured'
    assert r.json()['data']['status']=='degraded'

@pytest.mark.parametrize('path',['/api/v1/alerts','/api/v1/session'])
def test_privileged_reads_require_auth(path):
    response=client.get(path);assert response.status_code==401
    assert response.json()['error']['code']=='UNAUTHENTICATED'
    assert response.headers['cache-control']=='no-store'

def test_errors_are_enveloped_and_do_not_echo_passwords():
    r=client.post('/api/v1/auth/login',json={'email':'a','password':'sensitive-example','unexpected':'bad'})
    assert r.status_code==422
    assert r.json()['data'] is None
    assert 'sensitive-example' not in r.text

def test_body_limit_and_bad_cors():
    r=client.post('/api/v1/whatif',content=b'x'*65537);assert r.status_code==413
    response=client.options('/api/v1/alerts',headers={'Origin':'https://untrusted.invalid','Access-Control-Request-Method':'POST'})
    assert 'access-control-allow-origin' not in response.headers

@pytest.mark.parametrize('field,value',[('temperature_delta_c',7),('temperature_delta_c',float('nan')),('relative_humidity_delta_pp',31),('wind_multiplier',-1)])
def test_whatif_limits(field,value):
    body={'snapshot_id':'fixture-contract-only','ward_ids':['fixture-ward-a'],'temperature_delta_c':0,'relative_humidity_delta_pp':0,'wind_multiplier':1,field:value}
    with pytest.raises(ValueError):WhatIf.model_validate(body)

def test_jwks_missing_fails_closed(monkeypatch):
    monkeypatch.delenv('SUPABASE_JWKS_URL',raising=False)
    r=client.get('/api/v1/session',headers={'Authorization':'Bearer forged'});assert r.status_code==503

def test_unconfigured_subscription_does_not_claim_success(monkeypatch):
    monkeypatch.delenv('TELEGRAM_BOT_USERNAME',raising=False)
    r=client.post('/api/v1/subscriptions',json={'ward_id':'fixture-ward-a','channel':'telegram','consent':True,'consent_version':'1.0.0'})
    assert r.status_code==503

def test_webhook_secret_required(monkeypatch):
    monkeypatch.setenv('TELEGRAM_WEBHOOK_SECRET','test-secret-not-a-real-provider-secret')
    r=client.post('/api/v1/integrations/telegram/webhook',json={'update_id':1})
    assert r.status_code==403

def test_endpoint_crypto_authentication_and_keyed_lookup(monkeypatch):
    for name in ['HANDLE_HMAC_KEY','HANDLE_ENCRYPTION_KEY','DELETION_TOKEN_HMAC_KEY']:monkeypatch.setenv(name,base64.b64encode(os.urandom(32)).decode())
    encrypted=encrypt_endpoint('fixture-endpoint-only');assert b'fixture-endpoint-only' not in encrypted
    assert decrypt_endpoint(encrypted)=='fixture-endpoint-only'
    assert keyed_hash('fixture-endpoint-only')!=keyed_hash('fixture-endpoint-only','DELETION_TOKEN_HMAC_KEY')
    tampered=encrypted[:-1]+bytes([encrypted[-1]^1])
    with pytest.raises(Exception):decrypt_endpoint(tampered)

def test_stale_revision_conflict():
    with pytest.raises(AppError) as exc:check_revision({'revision':2},1)
    assert exc.value.code=='REVISION_CONFLICT'

def fixture_alert():
    return {'id':'fixture-contract-only','revision':1,'snapshot_id':'fixture-contract-only','created_at':'2026-11-07T10:00:00Z','expires_at':'2026-11-08T10:00:00Z','cap_status':'Exercise','is_simulation':True,'risk_level':3,'audience':'citizen','content':{'text':'SIMULATION — A & B <test>','instructions':'Fixture instruction, not advice.','onset':'2026-11-07T10:00:00Z','method_version':'1.0.0','hazards':{'fixture-ward-a':3},'vulnerabilities':{'fixture-ward-a':None},'wards':[{'id':'fixture-ward-a','name_en':'Fixture & example','boundary_version':'fixture-only'}]}}

def test_cap_xsd_escaping_status_geocodes():
    alert=fixture_alert();xml=generate(alert)
    assert validate(xml)
    assert b'A &amp; B &lt;test&gt;' in xml
    assert b'<status>Exercise</status>' in xml
    assert b'<scope>Restricted</scope>' in xml
    assert b'<polygon>' not in xml

def test_actual_and_simulation_test_rejected():
    a=fixture_alert();a['cap_status']='Actual'
    with pytest.raises(ValueError):generate(a)
    a['cap_status']='Test'
    with pytest.raises(ValueError):generate(a)
