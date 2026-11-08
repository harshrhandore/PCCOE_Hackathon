"""Select a real five-day ERA5 episode from the declared complete-year scan."""
import argparse,datetime
from collections import defaultdict
import numpy as np
from .io import ROOT,read_json,write_json,fetch_json,digest,retrieval_time
from .fetch_forecast import VARIABLES
from .heatguard_core.thermal import compute
from .heatguard_core.hazard import local_time,category
from .publish import assemble,utcnow,validate_release

def consecutive(values):
    best=run=0
    for v in values:
        run=run+1 if v else 0;best=max(best,run)
    return best

def score_windows(dates,median_utci,median_wbgt):
    scores=[]
    for i in range(len(dates)-4):
        span=dates[i:i+5]
        if any(datetime.date.fromisoformat(span[j+1])-datetime.date.fromisoformat(span[j])!=datetime.timedelta(days=1) for j in range(4)):continue
        u=median_utci[i:i+5];w=median_wbgt[i:i+5]
        if any(v is None or not np.isfinite(v) for v in [*u,*w]):continue
        scores.append({'start':span[0],'end':span[-1],'consecutive_base_ge_2':consecutive([category(v)>=2 for v in u]),'utci_exceedance_sum':sum(max(0,v-32) for v in u),'maximum_city_median_wbgt':max(w)})
    return sorted(scores,key=lambda r:(-r['consecutive_base_ge_2'],-r['utci_exceedance_sum'],-r['maximum_city_median_wbgt'],r['start']))

def acquire(build_year):
    registry=read_json(ROOT/'data/processed/ward-manifest.json');climate=read_json(ROOT/'data/processed/climatology.json')
    years=list(range(build_year-5,build_year));raw_by_cell={};peaks=defaultdict(dict)
    cells=set(climate['ward_cells'].values())
    # Download each actual ERA5 grid cell once, preserving source ward mapping.
    for cell in sorted(cells):
        lat,lon=map(float,cell.split(','));combined={};template=None
        for year in years:
            print('Replay source',cell,year,flush=True)
            args={'latitude':lat,'longitude':lon,'start_date':f'{year}-01-01','end_date':f'{year}-12-31','hourly':','.join(VARIABLES),'wind_speed_unit':'ms','temperature_unit':'celsius','timezone':'UTC','timeformat':'unixtime','models':'era5'}
            part=fetch_json('https://archive-api.open-meteo.com/v1/archive',args,cache_hours=None);template=part
            for i,t in enumerate(part['hourly']['time']):combined[t]={k:part['hourly'][k][i] for k in VARIABLES}
        times=sorted(combined);raw={k:v for k,v in template.items() if k!='hourly'};raw['hourly']={'time':times,**{k:[combined[t][k] for t in times] for k in VARIABLES}};raw_by_cell[cell]=raw
    for ward in registry['wards']:
        print('Computing replay search indices',ward['id'],flush=True)
        raw=raw_by_cell[climate['ward_cells'][ward['id']]];point=ward['weather_point'];h=compute(raw,point[1],point[0])
        by_day=defaultdict(list)
        for i,t in enumerate(h['time']):by_day[local_time(t).date().isoformat()].append(i)
        for date,indices in by_day.items():
            if len(indices)!=24 or len({local_time(h['time'][i]).hour for i in indices})!=24:continue
            if any(h['utci'][i] is None or h['wbgt'][i] is None for i in indices):continue
            peaks[date][ward['id']]=(max(h['utci'][i] for i in indices),max(h['wbgt'][i] for i in indices))
    dates=sorted(d for d,ward_peaks in peaks.items() if len(ward_peaks)==registry['ward_count'])
    u=[float(np.median([x[0] for x in peaks[d].values()])) for d in dates];w=[float(np.median([x[1] for x in peaks[d].values()])) for d in dates]
    scores=score_windows(dates,u,w)
    if not scores:raise RuntimeError('No complete real window; replay remains unavailable')
    chosen=scores[0];start=datetime.date.fromisoformat(chosen['start']);display=[(start+datetime.timedelta(days=i)).isoformat() for i in range(5)]
    episode_id='era5-'+chosen['start'];episode={**chosen,'id':episode_id,'baseline_years':years,'selection_method':'Lexicographic city-median UTCI: longest base>=2 run, sum exceedance >32, maximum median WBGT, earliest date','qualification':'three_day_spell' if chosen['consecutive_base_ge_2']>=3 else 'Highest-scoring available window; no three-day qualifying spell','source_model':'era5','method_version':'1.0.0','boundary_version':registry['boundary_version'],'is_simulation':True,'mode':'replay'}
    # Fetch exact contextual period including preceding days and following morning.
    records=[]
    for ward in registry['wards']:
        point=ward['weather_point'];args={'latitude':point[1],'longitude':point[0],'start_date':(start-datetime.timedelta(days=3)).isoformat(),'end_date':(start+datetime.timedelta(days=6)).isoformat(),'hourly':','.join(VARIABLES),'wind_speed_unit':'ms','temperature_unit':'celsius','timezone':'UTC','timeformat':'unixtime','models':'era5'}
        raw=fetch_json('https://archive-api.open-meteo.com/v1/archive',args,cache_hours=None)
        records.append({'ward_id':ward['id'],'raw':raw,'fetched_at':retrieval_time('https://archive-api.open-meteo.com/v1/archive',args)})
    output=ROOT/'apps/web/public/data/replay'/episode_id
    manifest=assemble(records,utcnow(),mode='replay',dates=display,episode=episode,output_root=output,promote=False)
    if manifest['meta']['publication_health']!='complete':raise RuntimeError('Incomplete replay candidate; prior replay remains unchanged')
    write_json(ROOT/f'data/replay/{episode_id}/manifest.json',episode);write_json(ROOT/f'data/replay/{episode_id}/candidate-scores.json',{'coverage_years':years,'scores':scores,'daily_medians':[{'date':d,'utci':a,'wbgt':b} for d,a,b in zip(dates,u,w)]})
    # Rewrite nested release URLs relative to the shared public data root.
    for f in manifest['files'].values():f['url']=f'replay/{episode_id}/'+f['url']
    validate_release(manifest,ROOT/'apps/web/public/data')
    import os
    pending=output/'latest.pending.json';write_json(pending,manifest);os.replace(pending,output/'latest.json')
    write_json(output/'episode.json',episode)
    write_json(ROOT/'apps/web/public/data/replay/catalog.json',[episode])
    write_json(ROOT/f'data/replay/{episode_id}/raw-reference.json',{'content_sha256':digest(records),'source_raw_cache':'data/raw/weather','record_count':len(records)})
    return episode

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--acquire',action='store_true');p.add_argument('--build-year',type=int,default=datetime.datetime.now().year);a=p.parse_args()
    if not a.acquire:p.error('Use --acquire to request the declared real-data scan; no fixture fallback exists')
    print(acquire(a.build_year))
