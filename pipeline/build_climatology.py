"""Frozen 1991–2020 local-day normals and complete ten-bin night thresholds."""
import argparse,datetime,calendar
from collections import defaultdict
import numpy as np
from .fetch_forecast import VARIABLES
from .io import ROOT,read_json,write_json,fetch_json,digest
from .heatguard_core.hazard import local_time

def fit(raw):
    grouped=defaultdict(list)
    for t,v in zip(raw['hourly']['time'],raw['hourly']['temperature_2m']):
        instant=local_time(t);grouped[instant.date()].append((instant,v))
    daymax={};nights={}
    for day,values in grouped.items():
        if not 1991<=day.year<=2020 or (day.month,day.day)==(2,29):continue
        if len(values)==24 and len({x.hour for x,v in values})==24 and all(v is not None for x,v in values):daymax[day]=max(v for x,v in values)
        rows=[(x,v) for x,v in values if x.hour>=20]+[(x,v) for x,v in grouped.get(day+datetime.timedelta(days=1),[]) if x.hour<6]
        if len(rows)==10 and len({x.hour for x,v in rows})==10 and all(v is not None for x,v in rows):nights[day]=min(v for x,v in rows)
    thresholds={};normals={};coverage={}
    reference=datetime.date(2001,1,1)
    for offset in range(365):
        d=reference+datetime.timedelta(days=offset)
        monthdays={(d+datetime.timedelta(days=i)).strftime('%m-%d') for i in [-2,-1,0,1,2]}
        n=[v for date,v in nights.items() if date.strftime('%m-%d') in monthdays]
        m=[v for date,v in daymax.items() if date.strftime('%m-%d') in monthdays]
        key=d.strftime('%m-%d');coverage[key]=len(n)/150
        thresholds[key]=float(np.quantile(n,.9,method='linear')) if len(n)>=135 else None
        normals[key]=float(np.mean(m)) if len(m)>=135 else None
    for values in [thresholds,normals]:values['02-29']=None if any(values[k] is None for k in ['02-28','03-01']) else (values['02-28']+values['03-01'])/2
    return {'night_thresholds':thresholds,'tmax_normals':normals,'coverage':coverage,'baseline_years':[1991,2020],'quantile_method':'linear','source_model':'era5','is_proxy':True,'proxy':'Centroid-sampled ERA5 grid normal; not polygon-area aggregation','method_version':'1.0.0'}

def acquire():
    registry=read_json(ROOT/'data/processed/ward-manifest.json');wards=registry['wards']
    # One-day probe discovers actual upstream ERA5 cells; no guessed grid rounding.
    params={'latitude':','.join(str(w['weather_point'][1]) for w in wards),'longitude':','.join(str(w['weather_point'][0]) for w in wards),'start_date':'2020-01-01','end_date':'2020-01-02','hourly':'temperature_2m','models':'era5','timezone':'UTC','timeformat':'unixtime'}
    probes=fetch_json('https://archive-api.open-meteo.com/v1/archive',params,cache_hours=None)
    if not isinstance(probes,list) or len(probes)!=len(wards):raise ValueError('ERA5 cell mapping failed')
    cells={};association={}
    for ward,probe in zip(wards,probes):
        key=f"{probe['latitude']},{probe['longitude']}";cells[key]=probe;association[ward['id']]=key
    result={}
    for key,probe in cells.items():
        print('Acquiring 1991–2020 ERA5 baseline cell',key,flush=True)
        combined={}
        for year in range(1991,2021):
            args={'latitude':probe['latitude'],'longitude':probe['longitude'],'start_date':f'{year}-01-01','end_date':f'{year+1}-01-01','hourly':'temperature_2m','models':'era5','timezone':'UTC','timeformat':'unixtime'}
            part=fetch_json('https://archive-api.open-meteo.com/v1/archive',args,cache_hours=None)
            combined.update(zip(part['hourly']['time'],part['hourly']['temperature_2m']))
            print(key,year,flush=True)
        axis=sorted(combined)
        result[key]=fit({'hourly':{'time':axis,'temperature_2m':[combined[t] for t in axis]}})
    doc={'version':'1.0.0','cells':result,'ward_cells':association,'baseline_years':[1991,2020],'boundary_version':registry['boundary_version'],'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    write_json(ROOT/'data/processed/climatology.json',doc)
    return doc

if __name__=='__main__':acquire()
