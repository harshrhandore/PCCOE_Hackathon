import hashlib,json,time,random,os
from pathlib import Path
import httpx
from .heatguard_core.units import json_safe

ROOT=Path(__file__).resolve().parents[1]

def canonical(value):return json.dumps(json_safe(value),sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode('utf8')
def digest(value):return hashlib.sha256(value if isinstance(value,bytes) else canonical(value)).hexdigest()
def write_json(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(canonical(value))
def read_json(path):return json.loads(Path(path).read_text(encoding='utf8'))

def retrieval_time(url,params):
    path=ROOT/'data/raw/weather'/f'{digest({"url":url,"params":params})}.request.json'
    return read_json(path)['retrieved_at'] if path.exists() else None

def fetch_json(url, params, cache_hours=3):
    if url not in ['https://api.open-meteo.com/v1/forecast','https://archive-api.open-meteo.com/v1/archive']:
        raise ValueError('Untrusted upstream endpoint')
    key=digest({'url':url,'params':params});path=ROOT/'data/raw/weather'/f'{key}.json'
    if path.exists() and (cache_hours is None or time.time()-path.stat().st_mtime<cache_hours*3600):return read_json(path)
    from .quota import reserve
    reserve(params)
    for attempt in range(5):
        try:
            with httpx.Client(timeout=httpx.Timeout(60,connect=10),follow_redirects=False,trust_env=True) as client:r=client.get(url,params=params)
            if r.status_code==429 or r.status_code>=500:
                if attempt==4:r.raise_for_status()
                wait=min(float(r.headers.get('Retry-After',2**(attempt+1))),60);time.sleep(wait+random.random());continue
            r.raise_for_status();data=r.json()
            if isinstance(data,dict) and data.get('error'):raise ValueError('Upstream rejected parameters')
            write_json(path,data);write_json(path.with_suffix('.request.json'),{'url':url,'params':params,'sha256':digest(data),'retrieved_at':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()})
            return data
        except (httpx.TimeoutException,httpx.NetworkError):
            if attempt==4:raise
            time.sleep(2**(attempt+1)+random.random())
    raise RuntimeError('Weather source unavailable')
