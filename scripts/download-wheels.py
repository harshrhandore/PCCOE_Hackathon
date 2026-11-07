"""TLS-verified urllib fallback for a stalled native uv downloader.

Downloads only compatible locked wheels and verifies their lockfile SHA-256.
Never changes versions or disables certificate checks.
"""
import tomllib,pathlib,urllib.request,concurrent.futures,hashlib,time
from packaging.tags import sys_tags
from packaging.utils import parse_wheel_filename

root=pathlib.Path(__file__).resolve().parents[1]
lock=tomllib.loads((root/'uv.lock').read_text());tags=set(sys_tags());wheels=[]
for package in lock['package']:
    candidates=[]
    for wheel in package.get('wheels',[]):
        name=wheel['url'].split('/')[-1]
        if parse_wheel_filename(name)[3]&tags:candidates.append(wheel)
    if candidates:wheels.append(candidates[0])
directory=root/'data/raw/wheels';directory.mkdir(parents=True,exist_ok=True)
def part(url,start,end):
    cache=directory/'.parts'/url.split('/')[-1]/str(start)
    if cache.exists() and cache.stat().st_size==end-start+1:return cache.read_bytes()
    for attempt in range(5):
        try:
            request=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'})
            with urllib.request.urlopen(request,timeout=15) as response:
                data=response.read()
                if len(data)!=end-start+1:raise ValueError('Unexpected range length')
                cache.parent.mkdir(parents=True,exist_ok=True);cache.write_bytes(data)
                return data
        except Exception:
            if attempt==4:raise
            time.sleep(1)

def download(wheel):
    name=wheel['url'].split('/')[-1];path=directory/name;expected=wheel['hash'].split(':')[1]
    if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
        size=wheel['size'];chunks=[(i,min(size-1,i+65535)) for i in range(0,size,65536)]
        print('Downloading',name,'in resumable verified-source ranges',flush=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pieces:
            data=b''.join(pieces.map(lambda pair:part(wheel['url'],*pair),chunks))
        if hashlib.sha256(data).hexdigest()!=expected:raise ValueError('Wheel hash mismatch: '+name)
        path.write_bytes(data)
    print('Verified',name,flush=True)
priority=['thermofeel','pytest','pluggy','pygments','packaging','iniconfig','colorama','numpy','pandas','shapely','pyproj','pvlib','pythermalcomfort']
wheels.sort(key=lambda w:next((i for i,p in enumerate(priority) if w['url'].split('/')[-1].startswith(p+'-')),100))
errors=[]
for wheel in wheels:
    try:download(wheel)
    except Exception as exc:errors.append((wheel['url'].split('/')[-1],type(exc).__name__));print('Unavailable',errors[-1],flush=True)
if errors:raise SystemExit(str(errors))
