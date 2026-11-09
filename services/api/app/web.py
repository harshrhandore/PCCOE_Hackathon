"""Serve the built SPA and public snapshots locally, without exposing the repo."""
from pathlib import Path
import hashlib,json,re
from fastapi import HTTPException,Request
from fastapi.responses import FileResponse,HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tiles.openfreemap.org; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"

def asset_preloads(html):
    """Discover critical built assets from headers while inline data downloads."""
    links=[]
    for tag in re.findall(r'<(?:link|script)\b[^>]*>',html):
        url=re.search(r'(?:href|src)="(/assets/[A-Za-z0-9_.-]+\.(?:js|css|woff2))"',tag)
        if not url:continue
        path=url.group(1)
        if 'rel="modulepreload"' in tag or 'type="module"' in tag:
            links.append(f'<{path}>; rel=modulepreload; crossorigin=anonymous')
        elif 'rel="stylesheet"' in tag:
            links.append(f'<{path}>; rel=preload; as=style; crossorigin=anonymous')
        elif 'as="font"' in tag:
            links.append(f'<{path}>; rel=preload; as=font; crossorigin=anonymous')
    return ', '.join(dict.fromkeys(links))

def selected_manifest(data,query):
    candidate=data/'latest.json'
    if query.get('mode')=='replay':
        episode=query.get('episode','')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',episode):return None
        candidate=data/'replay'/episode/'latest.json'
    return candidate

def snapshot_bootstrap(data,query):
    """Public planning data only. Both server and browser verify original bytes."""
    candidate=selected_manifest(data,query)
    if candidate is None:return ''
    try:
        manifest=json.loads(candidate.read_text(encoding='utf-8'));texts={};size=0
        if manifest.get('schema_version')!='1.0.0' or not manifest.get('meta',{}).get('dates'):return ''
        for name in ['forecast.json','geography.json','methods.json']:
            entry=manifest['files'][name];url=entry['url']
            if not isinstance(url,str) or not re.fullmatch(r'(releases|replay)/[A-Za-z0-9_./-]+',url) or '..' in url or not url.endswith('/'+name):return ''
            target=(data/url).resolve();target.relative_to(data.resolve())
            raw=target.read_bytes();size+=len(raw)
            if size>2_000_000 or hashlib.sha256(raw).hexdigest()!=entry['sha256']:return ''
            texts[name]=raw.decode('utf-8')
        payload={'mode':'replay' if query.get('mode')=='replay' else 'live','episode':query.get('episode') if query.get('mode')=='replay' else None,'manifest':manifest,'files':texts}
        # Non-executable data block; escape markup so public names cannot close it.
        encoded=json.dumps(payload,ensure_ascii=True,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
        return '<script type="application/json" id="heatguard-bootstrap">'+encoded+'</script>'
    except (OSError,ValueError,KeyError,TypeError,UnicodeError):return ''

def snapshot_preloads(data,query):
    """Fallback hints: the browser validates the selected manifest and hashes."""
    candidate=selected_manifest(data,query)
    if candidate is None:return ''
    try:
        files=json.loads(candidate.read_text(encoding='utf-8'))['files'];links=[]
        for name in ['forecast.json','geography.json','methods.json']:
            url=files[name]['url']
            if not isinstance(url,str) or not re.fullmatch(r'(releases|replay)/[A-Za-z0-9_./-]+',url) or '..' in url:return ''
            links.append(f'</data/{url}>; rel=preload; as=fetch; crossorigin=anonymous')
        return ', '.join(links)
    except (OSError,ValueError,KeyError,TypeError):return ''

class PublicFiles(StaticFiles):
    def __init__(self,*args,immutable=False,**kwargs):
        super().__init__(*args,**kwargs);self.immutable=immutable
    async def get_response(self,path,scope):
        response=await super().get_response(path,scope)
        immutable=self.immutable or path.startswith('releases/') or '/releases/' in path
        manifest=path in ['latest.json','diagnostic.json'] or path.endswith('/latest.json')
        response.headers['Cache-Control']='public,max-age=31536000,immutable' if immutable else 'no-cache' if manifest else 'public,max-age=60,must-revalidate'
        response.headers['X-Content-Type-Options']='nosniff'
        return response

def mount_local_web(app,web_directory,data_directory):
    web=Path(web_directory).resolve();data=Path(data_directory).resolve()
    if not (web/'index.html').is_file() or not (web/'assets').is_dir():
        raise RuntimeError('Local web build is missing. Run npm start or npm run build first.')
    if not data.is_dir():raise RuntimeError('Public data directory is missing.')
    app.add_middleware(GZipMiddleware,minimum_size=1000,compresslevel=6)
    for folder in ['assets','icons','licences']:
        if (web/folder).is_dir():app.mount('/'+folder,PublicFiles(directory=web/folder,immutable=folder=='assets'),name='web-'+folder)
    app.mount('/data',PublicFiles(directory=data),name='public-snapshots')

    @app.get('/{path:path}',include_in_schema=False)
    def spa(path:str,request:Request):
        # Unknown API paths, source files, .env and missing assets are real 404s.
        known={'','authority','authority/staff','worker','scenarios','subscribe','methods','status','presenter'}
        if path not in known and not (path.startswith('ward/') and len(path.split('/'))==2 and '.' not in path):
            raise HTTPException(status_code=404)
        headers={
            'Cache-Control':'no-cache','Content-Security-Policy':CSP,
            'Referrer-Policy':'strict-origin-when-cross-origin',
            'Permissions-Policy':'geolocation=(self), camera=(), microphone=()'}
        html=(web/'index.html').read_text(encoding='utf-8')
        assets=asset_preloads(html)
        if '<!-- HEATGUARD_BOOTSTRAP -->' in html:
            bootstrap=snapshot_bootstrap(data,request.query_params)
            if bootstrap:
                if assets:headers['Link']=assets
                return HTMLResponse(html.replace('<!-- HEATGUARD_BOOTSTRAP -->',bootstrap),headers=headers)
        preload=snapshot_preloads(data,request.query_params)
        preload=', '.join(value for value in [assets,preload] if value)
        if preload:headers['Link']=preload
        return FileResponse(web/'index.html',media_type='text/html',headers=headers)
