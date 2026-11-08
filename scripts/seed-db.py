"""Mirror validated public geography and snapshot metadata, never private users."""
import argparse,json,os,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import psycopg
from psycopg.types.json import Jsonb
from pipeline.io import ROOT,read_json
from scripts.local import load_env
from services.api.app.snapshots import load,data_root

def seed(db,snapshot_id=None):
    manifest,file=load(snapshot_id)
    registry=file('geography.json')
    geometries={f['properties']['id']:f for f in file('wards.geojson')['features']}
    if set(geometries)!={w['id'] for w in registry['wards']}:raise ValueError('Geography IDs disagree; no positional joins are allowed.')
    for ward in registry['wards']:
        feature=geometries[ward['id']]
        db.execute('insert into public.wards(id,boundary_version,source_ward_id,name_en,name_mr,geom,centroid,weather_point,weather_point_method,area_km2,provenance) values(%s,%s,%s,%s,%s,extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson(%s),4326)),extensions.st_setsrid(extensions.st_makepoint(%s,%s),4326),extensions.st_setsrid(extensions.st_makepoint(%s,%s),4326),%s,%s,%s) on conflict(id) do nothing',
          (ward['id'],ward['boundary_version'],ward['source_ward_id'],ward['name_en'],ward.get('name_mr'),json.dumps(feature['geometry']),*ward['centroid'],*ward['weather_point'],ward['weather_point_method'],ward['area_km2'],Jsonb(ward['provenance'])))
    existing=db.execute('select manifest from public.snapshots where id=%s',(manifest['snapshot_id'],)).fetchone()
    if existing:
        stored=existing['manifest'] if isinstance(existing,dict) else existing[0]
        if stored!=manifest:raise ValueError('A stored immutable snapshot has different content.')
    else:
        m=manifest['meta']
        db.execute('insert into public.snapshots(id,issued_at,fetched_at,model_run,model_id,data_vintage,git_sha,schema_version,method_version,boundary_version,is_simulation,mode,manifest) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
          (manifest['snapshot_id'],m['issued_at'],m['fetched_at'],m['model_run'],m['model_id'],Jsonb(m['data_vintage']),m['git_sha'],m['schema_version'],m['method_version'],m['boundary_version'],m['is_simulation'],m['mode'],Jsonb(manifest)))
    return manifest['snapshot_id']

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--snapshot-id');args=parser.parse_args()
    load_env(ROOT/'.env')
    with psycopg.connect(os.environ['DATABASE_URL']) as db:
        ids=[seed(db,args.snapshot_id)]
        if args.snapshot_id is None:
            for path in sorted((data_root()/'replay').glob('*/latest.json')):
                ids.append(seed(db,read_json(path)['snapshot_id']))
    print('Mirrored validated geography and '+str(len(ids))+' public snapshot manifests. No staff accounts were seeded.')

if __name__=='__main__':main()
