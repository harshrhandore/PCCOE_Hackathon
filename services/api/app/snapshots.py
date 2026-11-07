import os,re
from pathlib import Path
from pipeline.io import ROOT,read_json
from pipeline.publish import validate_release
from .errors import AppError

def data_root():return Path(os.environ.get('HEATGUARD_STATIC_DATA_DIR',str(ROOT/'apps/web/public/data')))

def load(snapshot_id=None,diagnostic=True):
    root=data_root();manifest=None
    if snapshot_id:
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',snapshot_id):raise AppError('INVALID_INPUT',422,'validation.summary')
        path=root/'releases'/snapshot_id/'manifest.json'
        if path.exists():manifest=read_json(path)
    for name in ['latest.json','diagnostic.json'] if diagnostic else ['latest.json']:
        path=root/name
        if manifest is None and path.exists():
            candidate=read_json(path)
            if snapshot_id is None or candidate['snapshot_id']==snapshot_id:manifest=candidate
    if manifest is None:raise AppError('SNAPSHOT_UNAVAILABLE')
    try:validate_release(manifest,root)
    except (ValueError,FileNotFoundError):raise AppError('SNAPSHOT_UNAVAILABLE')
    def file(name):return read_json(root/manifest['files'][name]['url'])
    return manifest,file
