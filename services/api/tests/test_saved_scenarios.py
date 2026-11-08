"""Real committed weather, with no raw cache or network dependency."""
import gzip,json,shutil
import pytest
from services.api.app import main
from services.api.app.contracts import WhatIf
from services.api.app.errors import AppError
from services.api.app.snapshots import load

@pytest.fixture
def saved_bundle(tmp_path,monkeypatch):
    manifest,file=load()
    snapshot=manifest['snapshot_id']
    source=main.ROOT/'data/processed/inputs'/f'{snapshot}.json.gz'
    target=tmp_path/'data/processed/inputs'/source.name
    target.parent.mkdir(parents=True);shutil.copy2(source,target)
    shutil.copy2(main.ROOT/'data/processed/climatology.json',tmp_path/'data/processed/climatology.json')
    monkeypatch.setattr(main,'ROOT',tmp_path)
    main.scenarios.clear()
    yield manifest,file,target
    main.scenarios.clear()

def test_saved_zero_delta_reproduces_every_daily_index_and_modifier(saved_bundle):
    manifest,file,_=saved_bundle
    ward=file('geography.json')['wards'][0]['id']
    result=main.compute_whatif(WhatIf(snapshot_id=manifest['snapshot_id'],ward_ids=[ward],temperature_delta_c=0,relative_humidity_delta_pp=0,wind_multiplier=1))
    assert result['meta']['is_simulation'] is True
    assert result['meta']['mode']=='whatif'
    for baseline,scenario in zip(result['data']['baseline'],result['data']['scenario'],strict=True):
        assert baseline['modifier_status']=='complete'
        for field,value in scenario.items():
            assert baseline[field]==value,(field,baseline['date'])
    # The first IST day retains both complete preceding days across UTC midnight.
    assert len(result['data']['scenario'])==5

def test_tampered_weather_bundle_is_rejected(saved_bundle):
    manifest,file,target=saved_bundle
    records=json.loads(gzip.decompress(target.read_bytes()))
    records[0]['raw']['hourly']['temperature_2m'][0]+=1
    target.write_bytes(gzip.compress(json.dumps(records).encode()))
    with pytest.raises(AppError) as exc:
        main.compute_whatif(WhatIf(snapshot_id=manifest['snapshot_id'],ward_ids=[file('geography.json')['wards'][0]['id']],temperature_delta_c=0,relative_humidity_delta_pp=0,wind_multiplier=1))
    assert exc.value.code=='SNAPSHOT_UNAVAILABLE'
