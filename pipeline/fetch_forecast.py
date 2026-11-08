from .io import ROOT,read_json,fetch_json,write_json,retrieval_time

VARIABLES=['temperature_2m','relative_humidity_2m','dew_point_2m','wind_speed_10m','shortwave_radiation_instant','direct_radiation_instant','diffuse_radiation_instant','direct_normal_irradiance_instant','cloud_cover','surface_pressure']

def fetch(wards=None):
    wards=wards or read_json(ROOT/'data/processed/ward-manifest.json')['wards']
    all_records=[]
    for start in range(0,len(wards),20):
        batch=wards[start:start+20]
        params={'latitude':','.join(str(round(w['weather_point'][1],6)) for w in batch),'longitude':','.join(str(round(w['weather_point'][0],6)) for w in batch),
          # Three UTC calendar days cover two COMPLETE preceding IST days even
          # after UTC midnight. Two UTC days omit the first five IST hour bins.
          'hourly':','.join(VARIABLES),'wind_speed_unit':'ms','temperature_unit':'celsius','timezone':'UTC','timeformat':'unixtime','past_days':3,'forecast_days':7,'models':'best_match'}
        data=fetch_json('https://api.open-meteo.com/v1/forecast',params)
        if isinstance(data,dict):data=[data]
        if len(data)!=len(batch):raise ValueError('Upstream batch/ward association mismatch')
        for w,d in zip(batch,data):
            validate(d);all_records.append({'ward_id':w['id'],'raw':d,'fetched_at':retrieval_time('https://api.open-meteo.com/v1/forecast',params)})
    write_json(ROOT/'data/raw/latest-forecast.json',all_records);return all_records

def validate(data):
    h=data['hourly'];time=h['time'];units=data['hourly_units']
    if time!=sorted(set(time)) or any(b-a!=3600 for a,b in zip(time,time[1:])):raise ValueError('Non-hourly, duplicate or unsorted time axis')
    expected={'temperature_2m':'°C','relative_humidity_2m':'%','dew_point_2m':'°C','wind_speed_10m':'m/s','surface_pressure':'hPa'}
    for key,unit in expected.items():
        if units.get(key)!=unit:raise ValueError(f'Unexpected units {key}')
    for key in VARIABLES:
        if len(h.get(key,[]))!=len(time) or any(v is None for v in h[key]):raise ValueError(f'Incomplete upstream field {key}')

if __name__=='__main__':fetch()
