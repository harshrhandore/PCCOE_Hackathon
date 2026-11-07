"""A documented health read, never a promise to prevent host suspension."""
import os,urllib.request,json,sys
url=os.environ.get('HEATGUARD_HEALTH_URL')
if not url:raise SystemExit('HEATGUARD_HEALTH_URL is not configured; no health read performed')
with urllib.request.urlopen(url+'?readiness=true',timeout=20) as response:result=json.load(response)
print(json.dumps(result))
sys.exit(0 if result['data']['status']=='ok' else 1)
