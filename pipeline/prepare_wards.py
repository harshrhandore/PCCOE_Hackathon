"""Acquire and validate a single licensed historical electoral geography."""
import urllib.request,datetime,subprocess
from pathlib import Path
from shapely.geometry import shape,mapping,MultiPolygon
from shapely.validation import make_valid
from shapely.ops import transform,unary_union
from pyproj import Transformer
from .io import ROOT,read_json,write_json,digest

SOURCE='https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Pune/pune-electoral-wards_2022.geojson'

def prepare():
    local=ROOT/'data/raw/municipal/Pune/pune-electoral-wards_2022.geojson'
    if not local.exists():
        local.parent.mkdir(parents=True,exist_ok=True)
        with urllib.request.urlopen(SOURCE,timeout=60) as r:local.write_bytes(r.read())
    source=read_json(local);features=[];wards=[];repairs=[]
    project=Transformer.from_crs(4326,32643,always_xy=True).transform
    inverse=Transformer.from_crs(32643,4326,always_xy=True).transform
    for f in source['features']:
        p=f['properties'];sid=str(p['wardnum']);g=shape(f['geometry'])
        if not g.is_valid:g=make_valid(g);repairs.append(sid)
        if g.geom_type=='Polygon':g=MultiPolygon([g])
        if g.geom_type!='MultiPolygon' or g.is_empty:raise ValueError(f'Invalid ward geometry {sid}')
        metric=transform(project,g);centroid=transform(inverse,metric.centroid)
        point=centroid if g.covers(centroid) else g.representative_point()
        name=p['Name2'];wid=f'pune-2022-{sid}'
        props={'id':wid,'source_ward_id':sid,'name_en':name,'name_mr':None,'boundary_version':'pune-electoral-2022','area_km2':metric.area/1e6,
          'centroid':[centroid.x,centroid.y],'weather_point':[point.x,point.y],'weather_point_method':'centroid' if point.equals(centroid) else 'representative_interior_point',
          'provenance':{'source_id':'datameet','url':SOURCE,'vintage':'2022','licence':'CC-BY-SA-2.5-IN; upstream MIT','is_proxy':True,'quality_flags':['HISTORICAL_ELECTORAL_GEOGRAPHY','MANUALLY_TRACED_PDF_BOUNDARIES'],'method_version':'1.0.0'}}
        features.append({'type':'Feature','id':wid,'properties':props,'geometry':mapping(g)});wards.append(props)
    features.sort(key=lambda f:int(f['properties']['source_ward_id']));wards.sort(key=lambda w:int(w['source_ward_id']))
    geometry={'type':'FeatureCollection','features':features}
    union=unary_union([shape(f['geometry']) for f in features]);center=union.centroid
    manifest={'boundary_version':'pune-electoral-2022','vintage':'2022','definition':'Historical electoral prabhags; not asserted current','ward_count':len(wards),'wards':wards,
       'bounds':list(union.bounds),'centre':[center.x,center.y],'source_url':SOURCE,'source_sha256':digest(local.read_bytes()),'geometry_sha256':digest(geometry),'repairs':repairs,
       'retrieved_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'licence':'CC-BY-SA-2.5-IN; upstream 2022 dataset MIT'}
    write_json(ROOT/'data/processed/wards.geojson',geometry);write_json(ROOT/'data/processed/ward-manifest.json',manifest)
    write_json(ROOT/'apps/web/public/data/geography.json',manifest);write_json(ROOT/'apps/web/public/data/wards.geojson',geometry)
    print(f'Validated {len(wards)} actual wards, {len(repairs)} geometry repairs; 2022 historical electoral boundaries')
    return manifest

if __name__=='__main__':prepare()
