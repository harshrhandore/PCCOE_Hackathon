"""Immutable releases, hash validation, manifest-last atomic promotion."""
import argparse,datetime,gzip,os,subprocess,shutil
from pathlib import Path
from .io import ROOT,read_json,write_json,canonical,digest
from .heatguard_core.config import methods
from .heatguard_core.thermal import compute
from .heatguard_core.hazard import daily_records,IST
from .heatguard_core.risk import adjusted_risk
from .prepare_features import prepare

def utcnow():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def gitsha():
    r=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,text=True)
    return r.stdout.strip() if r.returncode==0 else 'uncommitted-local-source'

def assemble(records, issued_at, mode='live', dates=None, episode=None, output_root=None, promote=True):
    registry=read_json(ROOT/'data/processed/ward-manifest.json')
    features=read_json(ROOT/'data/processed/features.json') if (ROOT/'data/processed/features.json').exists() else prepare()
    climate=read_json(ROOT/'data/processed/climatology.json') if (ROOT/'data/processed/climatology.json').exists() else {'ward_cells':{},'cells':{}}
    if {r['ward_id'] for r in records}!={w['id'] for w in registry['wards']}:raise ValueError('Incomplete ward join; refusing promotion')
    today=datetime.datetime.fromisoformat(issued_at.replace('Z','+00:00')).astimezone(IST).date()
    dates=dates or [(today+datetime.timedelta(days=i)).isoformat() for i in range(5)]
    wardmap={w['id']:w for w in registry['wards']};vmap={w['ward_id']:w for w in features['wards']}
    daily=[];hourlies={}
    for record in records:
        wid=record['ward_id'];w=wardmap[wid];point=w['weather_point'];raw=record['raw']
        hourly=compute(raw,point[1],point[0]);hourlies[wid]=hourly
        cell=climate['cells'].get(climate['ward_cells'].get(wid),{})
        for d in daily_records(hourly,dates,cell.get('night_thresholds'),cell.get('tmax_normals')):
            v=vmap[wid];risk=adjusted_risk(d['hazard_level'],v['vulnerability'],v['top_quintile'])
            daily.append({**d,**risk,'ward_id':wid,'vulnerability':v['vulnerability'],'top_quintile':v['top_quintile'],'vulnerability_coverage':v['vulnerability_coverage'],
                'quality_flags':(['APPROXIMATE_INDICES','SURFACE_AND_LONGWAVE_PROXY'] if hourly['is_proxy'] else ['RADIATION_GATE_UNAVAILABLE'])+(['VULNERABILITY_UNAVAILABLE'] if v['vulnerability'] is None else [])+(['MODIFIER_CONTEXT_UNKNOWN'] if d['modifier_status']=='unknown' else []),
                'sources':['open-meteo','thermofeel'],'radiation_method':hourly['radiation_method'],'indices_quality':hourly['indices_quality'],
                'source_grid':{'latitude':raw['latitude'],'longitude':raw['longitude'],'elevation':raw.get('elevation')},'model_run':None})
    fetched_at=issued_at
    if mode=='live':
        retrievals=[read_json(p)['retrieved_at'] for p in (ROOT/'data/raw/weather').glob('*.request.json') if read_json(p)['url'].endswith('/forecast')]
        if retrievals:fetched_at=max(retrievals)
    record_times=[r['fetched_at'] for r in records if r.get('fetched_at')]
    if record_times:fetched_at=max(record_times)
    meta={'issued_at':issued_at,'fetched_at':fetched_at,'model_run':None,'model_id':'era5' if mode=='replay' else 'best_match','data_vintage':{'weather':mode,'boundaries':'2022','climatology':'1991–2020' if climate['cells'] else 'unavailable','demographics':'unavailable'},
        'git_sha':gitsha(),'data_git_sha':os.environ.get('DATA_GIT_SHA','local-uncommitted-data'),'schema_version':'1.0.0','method_version':'1.0.0','boundary_version':registry['boundary_version'],
        'is_simulation':mode!='live','mode':mode,'timezone':'Asia/Kolkata','quality_flags':['NEAR_REAL_TIME_MODEL_BASED','BOUNDARIES_HISTORICAL_2022','ML_NOT_TRAINED'],
        'dates':dates,'ward_count':len(registry['wards']),'episode':episode,'source_input_sha256':digest(records),'publication_health':'complete' if all(d['completeness']['hourly'] and d['modifier_status']=='complete' for d in daily) else 'incomplete'}
    forecast={'daily':daily,'dates':dates,'ward_count':len(registry['wards'])}
    payloads={'forecast.json':forecast,'wards.geojson':read_json(ROOT/'data/processed/wards.geojson'),'methods.json':methods(),'meta.json':meta,'features.json':features,'geography.json':registry}
    bulletins=[]
    for day in dates:
        rows=[r for r in daily if r['date']==day];counts=[sum(r['risk_level']==i for r in rows) for i in range(5)]
        bulletins.append({'date':day,'counts_by_level':counts,'unknown_count':sum(r['risk_level'] is None for r in rows),'highest_level':max((r['risk_level'] for r in rows if r['risk_level'] is not None),default=None)})
    payloads['bulletin.json']=bulletins
    for wid,h in hourlies.items():payloads[f'hourly/{wid}.json']=h
    snapshot_id=datetime.datetime.fromisoformat(issued_at.replace('Z','+00:00')).strftime('%Y%m%dT%H%M%SZ')+'-'+digest(payloads)[:12]
    meta['snapshot_id']=snapshot_id
    write_json(ROOT/'data/raw/snapshots'/f'{snapshot_id}.json',records)
    # Small redistribution-safe weather inputs make saved what-if reproducible
    # locally. This bundle has no recipient/authentication data.
    bundle=ROOT/'data/processed/inputs'/f'{snapshot_id}.json.gz'
    bundle.parent.mkdir(parents=True,exist_ok=True)
    bundle.write_bytes(gzip.compress(canonical(records),mtime=0))
    output_root=Path(output_root or ROOT/'apps/web/public/data')
    relative=f'releases/{snapshot_id}';release=output_root/relative
    files={}
    for name,value in payloads.items():
        body=canonical(value);write_json(release/name,value);files[name]={'url':f'{relative}/{name}','sha256':digest(body),'bytes':len(body),'gzip_bytes':len(gzip.compress(body))}
    manifest={'snapshot_id':snapshot_id,'schema_version':'1.0.0','method_version':'1.0.0','meta':meta,'files':files}
    validate_release(manifest,output_root)
    write_json(release/'manifest.json',manifest)
    if not promote:return manifest
    # Complete operational publication cannot be replaced by an incomplete candidate.
    latest=output_root/'latest.json'
    if meta['publication_health']!='complete':
        write_json(output_root/'diagnostic.json',manifest)
        if latest.exists():raise ValueError('Incomplete candidate retained as diagnostic; last complete release unchanged')
        print('Incomplete first candidate saved as diagnostic; not promoted as an operational forecast',flush=True)
    else:
        temp=output_root/'latest.pending.json';write_json(temp,manifest);os.replace(temp,latest)
    return manifest

def validate_release(manifest,base):
    for name,entry in manifest['files'].items():
        path=(Path(base)/entry['url']).resolve()
        if not path.is_relative_to(Path(base).resolve()):raise ValueError('Manifest path outside data root')
        if digest(path.read_bytes())!=entry['sha256']:raise ValueError('Release hash mismatch')
    forecast=read_json(Path(base)/manifest['files']['forecast.json']['url'])
    registry=read_json(Path(base)/manifest['files']['geography.json']['url'])
    ids={w['id'] for w in registry['wards']}
    for date in forecast['dates']:
        rows=[r for r in forecast['daily'] if r['date']==date]
        if len(rows)!=len(ids) or {r['ward_id'] for r in rows}!=ids:raise ValueError('Daily ward join mismatch')
        for row in rows:
            if row['risk_level'] is not None and (row['hazard_level'] is None or row['risk_level']<row['hazard_level']):raise ValueError('Risk/hazard invariant failed')
            if 'SYNTHETIC_CONTRACT_EXAMPLE' in row.get('quality_flags',[]):raise ValueError('Fixture rejected from publication')
    if manifest['files']['forecast.json']['gzip_bytes']>300000:raise ValueError('Overview snapshot exceeds gzip budget')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--fetch',action='store_true');parser.add_argument('--issued-at');args=parser.parse_args()
    start=utcnow()
    try:
        if args.fetch:
            from .fetch_forecast import fetch
            records=fetch()
        else:records=read_json(ROOT/'data/raw/latest-forecast.json')
        result=assemble(records,args.issued_at or utcnow())
        report={'started_at':start,'ended_at':utcnow(),'status':result['meta']['publication_health'],'snapshot_id':result['snapshot_id'],'ward_count':result['meta']['ward_count'],'warnings':[] if result['meta']['publication_health']=='complete' else ['Incomplete candidate; see diagnostic.json'],'source_health':'reachable'}
        print(result['snapshot_id'],report['status'],flush=True)
    except Exception as e:
        report={'started_at':start,'ended_at':utcnow(),'status':'failed','failure_stage':'fetch_compute_validate_publish','error_type':type(e).__name__,'message':str(e)[:300]};write_json(ROOT/'reports/run_report.json',report);raise
    write_json(ROOT/'reports/run_report.json',report);write_json(ROOT/'apps/web/public/data/run_report.json',report)

if __name__=='__main__':main()
