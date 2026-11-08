"""Serve the built SPA and public snapshots locally, without exposing the repo."""
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware

CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tiles.openfreemap.org; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"

class PublicFiles(StaticFiles):
    def __init__(self,*args,immutable=False,**kwargs):
        super().__init__(*args,**kwargs);self.immutable=immutable
    async def get_response(self,path,scope):
        response=await super().get_response(path,scope)
        response.headers['Cache-Control']='public,max-age=31536000,immutable' if self.immutable or path.startswith('releases/') or '/releases/' in path else 'public,max-age=60,must-revalidate'
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
    def spa(path:str):
        # Unknown API paths, source files, .env and missing assets are real 404s.
        known={'','authority','worker','scenarios','subscribe','methods','status'}
        if path not in known and not (path.startswith('ward/') and len(path.split('/'))==2 and '.' not in path):
            raise HTTPException(status_code=404)
        return FileResponse(web/'index.html',media_type='text/html',headers={
            'Cache-Control':'no-cache','Content-Security-Policy':CSP,
            'Referrer-Policy':'strict-origin-when-cross-origin',
            'Permissions-Policy':'geolocation=(self), camera=(), microphone=()'})
