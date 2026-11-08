"""Rebuild saved episodes from their exact cached source periods, without rescoring."""
import datetime,os
from .io import ROOT,read_json,write_json,fetch_json,retrieval_time
from .fetch_forecast import VARIABLES
from .publish import assemble,utcnow,validate_release

def main():
    public=ROOT/'apps/web/public/data'
    catalog=read_json(public/'replay/catalog.json')
    wards=read_json(ROOT/'data/processed/ward-manifest.json')['wards']
    for episode in catalog:
        start=datetime.date.fromisoformat(episode['start']);records=[]
        for ward in wards:
            point=ward['weather_point']
            args={'latitude':point[1],'longitude':point[0],'start_date':(start-datetime.timedelta(days=3)).isoformat(),'end_date':(start+datetime.timedelta(days=6)).isoformat(),'hourly':','.join(VARIABLES),'wind_speed_unit':'ms','temperature_unit':'celsius','timezone':'UTC','timeformat':'unixtime','models':'era5'}
            raw=fetch_json('https://archive-api.open-meteo.com/v1/archive',args,cache_hours=None)
            records.append({'ward_id':ward['id'],'raw':raw,'fetched_at':retrieval_time('https://archive-api.open-meteo.com/v1/archive',args)})
        output=public/'replay'/episode['id']
        dates=[(start+datetime.timedelta(days=i)).isoformat() for i in range(5)]
        manifest=assemble(records,utcnow(),mode='replay',dates=dates,episode=episode,output_root=output,promote=False)
        if manifest['meta']['publication_health']!='complete':raise RuntimeError('Incomplete replay; old manifest retained')
        for entry in manifest['files'].values():entry['url']=f"replay/{episode['id']}/"+entry['url']
        validate_release(manifest,public)
        pending=output/'latest.pending.json';write_json(pending,manifest);os.replace(pending,output/'latest.json')
        print('Rebound replay inputs:',episode['id'],manifest['snapshot_id'],flush=True)

if __name__=='__main__':main()
