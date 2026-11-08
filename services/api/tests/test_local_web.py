from fastapi import FastAPI
from fastapi.testclient import TestClient
from services.api.app.web import mount_local_web

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
    assert client.get('/data/latest.json').json()=={'fixture':True}
    for path in ['/.env','/scripts/local.py','/api/v1/no-such-endpoint','/assets/missing.js','/data/no-such-file.json','/data/%2e%2e/.env']:
        response=client.get(path);assert response.status_code==404
        assert 'PRIVATE_FIXTURE' not in response.text
