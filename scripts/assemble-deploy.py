"""Combine a tested source build and an independently published data revision."""
import argparse,pathlib,shutil,sys,json
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from pipeline.publish import validate_release
from pipeline.io import read_json,write_json,ROOT
p=argparse.ArgumentParser();p.add_argument('--data',type=pathlib.Path,default=ROOT/'apps/web/public/data');p.add_argument('--build',type=pathlib.Path,default=ROOT/'apps/web/dist');p.add_argument('--out',type=pathlib.Path,default=ROOT/'dist');p.add_argument('--allow-diagnostic',action='store_true');a=p.parse_args()
root=ROOT.resolve();target=a.out.resolve()
if not target.is_relative_to(root) or target==root:raise SystemExit('Output must be a child of the repository')
manifest=a.data/'latest.json'
if not manifest.exists() and a.allow_diagnostic:manifest=a.data/'diagnostic.json'
if not manifest.exists():raise SystemExit('No complete validated snapshot; operational deploy blocked. --allow-diagnostic explicitly packages an incomplete review artifact.')
value=read_json(manifest);validate_release(value,a.data)
if not (a.build/'index.html').exists():raise SystemExit('Build the frontend first')
target.mkdir(parents=True,exist_ok=True)
shutil.copytree(a.build,target,dirs_exist_ok=True);shutil.copytree(a.data,target/'data',dirs_exist_ok=True)
write_json(target/'build-info.json',{'source_sha':__import__('subprocess').run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,text=True).stdout.strip() or 'uncommitted-local-source','data_sha':value['meta'].get('data_git_sha'),'snapshot_id':value['snapshot_id'],'publication_health':value['meta']['publication_health']})
print('Prepared',target,'snapshot',value['snapshot_id'],'health',value['meta']['publication_health'])
