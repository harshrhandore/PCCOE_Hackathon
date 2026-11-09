from fastapi import FastAPI
from fastapi.testclient import TestClient
from services.api.app.web import mount_local_web
import json
import hashlib,re
import pytest


def bootstrap_fixture(tmp_path):
    """Small transport fixture only, not published weather."""
    from services.api.app.web import snapshot_bootstrap
    data=tmp_path/'data';data.mkdir()
    def publish(snapshot,text):
        folder=data/'releases'/snapshot;folder.mkdir(parents=True)
        files={}
        for name in ['forecast.json','geography.json','methods.json']:
            raw=json.dumps({'transport_fixture':text}).encode()
            (folder/name).write_bytes(raw)
            files[name]={'url':f'releases/{snapshot}/{name}','sha256':hashlib.sha256(raw).hexdigest()}
        manifest={'snapshot_id':snapshot,'schema_version':'1.0.0','meta':{'dates':['2026-01-01']},'files':files}
        (data/'latest.json').write_text(json.dumps(manifest))
        return manifest
    return data,publish,snapshot_bootstrap


def test_inline_public_data_is_hash_verified_markup_safe_and_follows_refresh(tmp_path):
    data,publish,bootstrap=bootstrap_fixture(tmp_path)
    manifest=publish('transport-a','</script><script>fixture_not_executable</script>')
    html=bootstrap(data,{})
    assert html.count('<script')==1 and 'fixture_not_executable</script>' not in html
    payload=json.loads(re.search(r'>(.*)</script>',html).group(1))
    assert payload['manifest']['snapshot_id']=='transport-a'
    assert hashlib.sha256(payload['files']['forecast.json'].encode()).hexdigest()==manifest['files']['forecast.json']['sha256']
    publish('transport-b','second transport fixture')
    assert 'transport-b' in bootstrap(data,{}) and 'transport-a' not in bootstrap(data,{})
    (data/'releases/transport-b/forecast.json').write_text('tampered')
    assert bootstrap(data,{})==''


@pytest.mark.parametrize('url',['../.env','releases/../../.env','releases/transport-a/methods.json'])
def test_inline_data_cannot_read_private_or_mismatched_paths(tmp_path,url):
    data,publish,bootstrap=bootstrap_fixture(tmp_path)
    manifest=publish('transport-a','fixture')
    manifest['files']['forecast.json']['url']=url
    (data/'latest.json').write_text(json.dumps(manifest))
    (tmp_path/'.env').write_text('PRIVATE_TRANSPORT_FIXTURE=never-inline')
    assert bootstrap(data,{})==''


def test_inline_replay_never_uses_live_data_for_invalid_or_unknown_episode(tmp_path):
    data,publish,bootstrap=bootstrap_fixture(tmp_path)
    publish('transport-a','live fixture')
    assert bootstrap(data,{'mode':'replay'})==''
    assert bootstrap(data,{'mode':'replay','episode':'../private'})==''
    assert bootstrap(data,{'mode':'replay','episode':'unknown'})==''

def test_startup_hints_follow_live_refresh_and_replay_without_exposing_paths(tmp_path):
    web=tmp_path/'web';data=tmp_path/'public';web.mkdir();data.mkdir();(web/'assets').mkdir()
    (web/'index.html').write_text('<html>Transport fixture only</html>')
    def manifest(prefix):return {'files':{name:{'url':prefix+'/'+name} for name in ['forecast.json','geography.json','methods.json']}}
    (data/'latest.json').write_text(json.dumps(manifest('releases/live-a')))
    replay=data/'replay'/'transport-fixture';replay.mkdir(parents=True)
    (replay/'latest.json').write_text(json.dumps(manifest('replay/transport-fixture/releases/episode-a')))
    app=FastAPI();mount_local_web(app,web,data);client=TestClient(app)
    assert '/releases/live-a/forecast.json' in client.get('/').headers['link']
    (data/'latest.json').write_text(json.dumps(manifest('releases/live-b')))
    assert '/releases/live-b/forecast.json' in client.get('/').headers['link']
    selected=client.get('/?mode=replay&episode=transport-fixture').headers['link']
    assert '/replay/transport-fixture/releases/episode-a/' in selected and '/live-b/' not in selected
    malformed=manifest('releases/../../private');(data/'latest.json').write_text(json.dumps(malformed))
    assert 'link' not in client.get('/').headers
    assert 'link' not in client.get('/?mode=replay&episode=../private').headers

def test_local_static_requests_do_not_exhaust_api_budget():
    from services.api.app import main
    client=TestClient(main.app)
    main.rate_limits.clear()
    for _ in range(125):
        assert client.get('/assets/nonexistent-fixture.js').status_code==404
    assert client.get('/api/v1/methods').status_code==200
    for _ in range(119):
        assert client.get('/api/v1/methods').status_code==200
    assert client.get('/api/v1/methods').status_code==429
    main.rate_limits.clear()

def test_local_spa_deep_links_and_private_file_isolation(tmp_path):
    web=tmp_path/'web';data=tmp_path/'public';web.mkdir();data.mkdir();(web/'assets').mkdir()
    (web/'index.html').write_text('<html><title>Local fixture</title></html>')
    script='console.log("fixture");'*100
    (web/'assets/app.js').write_text(script)
    (data/'latest.json').write_text('{"fixture":true}')
    (tmp_path/'.env').write_text('PRIVATE_FIXTURE=never-serve')
    app=FastAPI();mount_local_web(app,web,data);client=TestClient(app)
    for path in ['/','/ward/fixture-ward','/authority','/authority/staff','/scenarios','/presenter','/subscribe']:
        response=client.get(path);assert response.status_code==200
        assert response.headers['cache-control']=='no-cache'
        assert "default-src 'self'" in response.headers['content-security-policy']
    assert client.get('/assets/app.js').headers['cache-control'].endswith('immutable')
    compressed=client.get('/assets/app.js',headers={'Accept-Encoding':'gzip'})
    assert compressed.headers['content-encoding']=='gzip'
    assert 'Accept-Encoding' in compressed.headers['vary']
    assert compressed.text==script
    latest=client.get('/data/latest.json')
    assert latest.json()=={'fixture':True}
    assert latest.headers['cache-control']=='no-cache'
    (data/'latest.json').write_text('{"fixture":"updated"}')
    updated=client.get('/data/latest.json',headers={'If-None-Match':latest.headers['etag']})
    assert updated.status_code==200 and updated.json()=={'fixture':'updated'}
    for path in ['/.env','/scripts/local.py','/api/v1/no-such-endpoint','/assets/missing.js','/data/no-such-file.json','/data/%2e%2e/.env']:
        response=client.get(path);assert response.status_code==404
        assert 'PRIVATE_FIXTURE' not in response.text
