"""Security policy checks; these do not replace real Postgres/RLS replay."""
import copy
import datetime
from uuid import uuid4
import pytest
from services.api.app import workflow
from services.api.app.contracts import Draft
from services.api.app.errors import AppError
from services.api.app.snapshots import load

@pytest.fixture
def frozen(monkeypatch):
    manifest,file=load()
    clock=datetime.datetime.fromisoformat(manifest['meta']['issued_at'].replace('Z','+00:00'))+datetime.timedelta(hours=1)
    monkeypatch.setattr(workflow,'now',lambda:clock)
    row=next(r for r in file('forecast.json')['daily'] if r['risk_level'] is not None)
    request=Draft(snapshot_id=manifest['snapshot_id'],ward_ids=[row['ward_id']],risk_level=row['risk_level'],audience='citizen',languages=['en'],action_ids=['citizen_water'],onset=row['date']+'T00:00:00+05:30',expires=clock+datetime.timedelta(hours=24))
    content,sha,meta=workflow.freeze(request)
    alert={'id':str(uuid4()),'snapshot_id':manifest['snapshot_id'],'ward_ids':request.ward_ids,'risk_level':request.risk_level,'audience':request.audience,'languages':['en'],'content':content,'content_sha256':sha,'action_version':'1.0.0','revision':1,'expires_at':request.expires,'cap_status':'Test','is_simulation':False,'status':'approved','approval_revision':1}
    return alert,manifest

def test_frozen_content_survives_json_roundtrip(frozen):
    alert,_=frozen
    workflow.verify_binding(alert)
    # Database timestamptz and JSON responses use equivalent ISO serializations.
    alert['expires_at']=workflow.iso(alert['expires_at'])
    workflow.verify_binding(alert)

@pytest.mark.parametrize('field,value',[
    ('ward_ids',['fixture-unselected-ward']),('languages',['mr']),('risk_level',4),
    ('audience','authority'),('cap_status','Exercise'),('is_simulation',True),
    ('revision',2),('snapshot_id','fixture-other-snapshot'),('action_version','9.0.0')
])
def test_approval_binds_fields(frozen,field,value):
    alert,_=frozen
    if alert[field]==value:value=0 if field=='risk_level' else 'changed'
    alert[field]=value
    with pytest.raises(AppError) as exc:workflow.verify_binding(alert)
    assert exc.value.code=='REVISION_CONFLICT'

def test_approval_binds_text_and_expiry(frozen):
    alert,_=frozen
    changed=copy.deepcopy(alert);changed['content']['text']+=' changed'
    with pytest.raises(AppError):workflow.verify_binding(changed)
    changed=copy.deepcopy(alert);changed['expires_at']+=datetime.timedelta(minutes=1)
    with pytest.raises(AppError):workflow.verify_binding(changed)

@pytest.mark.parametrize('status',['draft','sent','cancelled'])
def test_only_approved_revision_may_dispatch(frozen,status):
    alert,_=frozen;alert['status']=status
    with pytest.raises(AppError):workflow.dispatch_allowed(alert,1)

def test_approval_revision_and_expiry_rechecked(frozen):
    alert,manifest=frozen
    workflow.dispatch_allowed(alert,1)
    alert['approval_revision']=2
    with pytest.raises(AppError):workflow.dispatch_allowed(alert,1)
    alert['approval_revision']=1
    alert['expires_at']=workflow.now()-datetime.timedelta(seconds=1)
    alert['content_sha256']=workflow.binding_digest(alert)
    with pytest.raises(AppError) as exc:workflow.assert_approvable(alert,manifest)
    assert exc.value.code=='STALE_SNAPSHOT'

def test_incomplete_and_superseded_snapshot_block(frozen,monkeypatch):
    alert,manifest=frozen
    incomplete=copy.deepcopy(manifest);incomplete['meta']['publication_health']='incomplete'
    with pytest.raises(AppError):workflow.assert_approvable(alert,incomplete)
    monkeypatch.setattr(workflow,'load',lambda *args,**kwargs:({'snapshot_id':'fixture-newer'},None))
    with pytest.raises(AppError):workflow.assert_approvable(alert,manifest)
