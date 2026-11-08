"""Serve the built SPA and public snapshots locally, without exposing the repo."""
from pathlib import Path
import json,re
from fastapi import HTTPException,Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tiles.openfreemap.org; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"

def snapshot_preloads(data,query):
    """Hints only: the browser still validates the selected manifest and hashes."""
    candidate=data/'latest.json'
    if query.get('mode')=='replay':
        episode=query.get('episode','')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',episode):return ''
        candidate=data/'replay'/episode/'latest.json'
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
        known={'','authority','worker','scenarios','subscribe','methods','status'}
        if path not in known and not (path.startswith('ward/') and len(path.split('/'))==2 and '.' not in path):
            raise HTTPException(status_code=404)
        headers={
            'Cache-Control':'no-cache','Content-Security-Policy':CSP,
            'Referrer-Policy':'strict-origin-when-cross-origin',
            'Permissions-Policy':'geolocation=(self), camera=(), microphone=()'}
        preload=snapshot_preloads(data,request.query_params)
        if preload:headers['Link']=preload
        return FileResponse(web/'index.html',media_type='text/html',headers=headers)
