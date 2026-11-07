"""Explicitly mirror small public snapshots; no authority accounts are invented."""
import sys,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import psycopg
from psycopg.types.json import Jsonb
from pipeline.io import ROOT,read_json
from services.api.app.snapshots import load
manifest,file=load();registry=file('geography.json');geometry=file('wards.geojson')
with psycopg.connect(os.environ['DATABASE_URL']) as db:
    for ward,feature in zip(registry['wards'],geometry['features']):
        db.execute('insert into public.wards(id,boundary_version,source_ward_id,name_en,geom,centroid,weather_point,weather_point_method,area_km2,provenance) values(%s,%s,%s,%s,extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson(%s),4326)),extensions.st_setsrid(extensions.st_makepoint(%s,%s),4326),extensions.st_setsrid(extensions.st_makepoint(%s,%s),4326),%s,%s,%s) on conflict(id) do nothing',(ward['id'],ward['boundary_version'],ward['source_ward_id'],ward['name_en'],__import__('json').dumps(feature['geometry']),*ward['centroid'],*ward['weather_point'],ward['weather_point_method'],ward['area_km2'],Jsonb(ward['provenance'])))
    m=manifest['meta']
    db.execute('insert into public.snapshots(id,issued_at,fetched_at,model_run,model_id,data_vintage,git_sha,schema_version,method_version,boundary_version,is_simulation,mode,manifest) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) on conflict(id) do nothing',(manifest['snapshot_id'],m['issued_at'],m['fetched_at'],m['model_run'],m['model_id'],Jsonb(m['data_vintage']),m['git_sha'],m['schema_version'],m['method_version'],m['boundary_version'],m['is_simulation'],m['mode'],Jsonb(manifest)))
print('Mirrored geography and snapshot metadata. Staff provisioning remains an out-of-band administrator operation.')
