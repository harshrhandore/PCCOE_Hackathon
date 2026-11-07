"""Validate the active release, or explicitly labelled first-run diagnostics."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from pipeline.io import ROOT,read_json
from pipeline.publish import validate_release
base=ROOT/'apps/web/public/data'
path=base/'latest.json'
if not path.exists():path=base/'diagnostic.json'
if not path.exists():raise SystemExit('No release is available; prepare geography and run pipeline.publish')
manifest=read_json(path);validate_release(manifest,base)
print('Validated',manifest['snapshot_id'],'health='+manifest['meta']['publication_health'])
