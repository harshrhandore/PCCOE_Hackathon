from fastapi import FastAPI
from fastapi.testclient import TestClient
from services.api.app.web import mount_local_web
import json

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
    for path in ['/','/ward/fixture-ward','/authority','/scenarios']:
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
