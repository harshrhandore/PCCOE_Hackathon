"""Initialize catalogue and token assets from the user's immutable specification."""
import pathlib, json, urllib.request, concurrent.futures, re

root = pathlib.Path(__file__).resolve().parents[1]
for directory in ['apps/web/src/styles','apps/web/src/i18n','apps/web/src/components','apps/web/src/routes','apps/web/src/data','apps/web/src/lib','apps/web/public/data','apps/web/public/icons','apps/web/tests/unit','apps/web/tests/e2e','pipeline/heatguard_core','pipeline/tests','services/api/app','services/api/tests','config','schemas','data/processed','data/replay','data/fixtures','docs/methods','reports/tests','reports/visual','.github/workflows','supabase/migrations','supabase/tests','ml/artifacts']:
    (root/directory).mkdir(parents=True,exist_ok=True)
spec = (root/'HeatGuard_AI_Expanded_Build_Prompt.md').read_text(encoding='utf8')
css = spec.split('### G.1 CSS tokens')[1].split('```css')[1].split('```')[0].strip()
(root/'apps/web/src/styles/tokens.css').write_text(css+'\n@theme inline { --color-paper: var(--paper-0); --color-ink: var(--ink-0); --color-accent: var(--verdigris-600); --font-sans: var(--font-body); }\n',encoding='utf8')
langs = {x:{} for x in ['en','hi','mr']}
for line in spec.split('## I. Copy deck')[1].split('## J.')[0].splitlines():
    if line.startswith('| ') and re.match(r'\| [a-z]+\.[A-Za-z0-9]+ \|',line):
        row = [x.strip() for x in line.strip('|').split('|')]
        if len(row)==4:
            for lang,value in zip(langs,row[1:]): langs[lang][row[0]]=value
for lang,strings in langs.items():
    (root/f'apps/web/src/i18n/{lang}.json').write_text(json.dumps(strings,ensure_ascii=False,indent=2),encoding='utf8')
packages=['vite','@vitejs/plugin-react','typescript','@types/react@18','@types/react-dom@18','@types/geojson','@types/d3','react-router-dom','@tanstack/react-query','zustand','i18next','react-i18next','i18next-icu','@radix-ui/react-dialog','@radix-ui/react-select','@radix-ui/react-dropdown-menu','@observablehq/plot','d3','maplibre-gl','tailwindcss','@tailwindcss/vite','@fontsource/newsreader','@fontsource/atkinson-hyperlegible-next','@fontsource/noto-sans-devanagari','@fontsource/noto-serif-devanagari','@fontsource/ibm-plex-mono','vitest','@playwright/test','@axe-core/playwright','@lhci/cli']
def resolve(name):
    base=name.rsplit('@',1)[0] if '@18' in name else name
    with urllib.request.urlopen('https://registry.npmjs.org/'+base.replace('/','%2f'),timeout=30) as response: data=json.load(response)
    if '@18' in name:
        version=sorted([x for x in data['versions'] if x.startswith('18.') and '-' not in x],key=lambda s:tuple(map(int,s.split('.'))))[-1]
    else: version=data['dist-tags']['latest']
    return base,version,data['versions'][version].get('license'),data['versions'][version].get('peerDependencies',{})
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: resolved=list(pool.map(resolve,packages))
deps={'react':'18.3.1','react-dom':'18.3.1'}
deps.update({x[0]:x[1] for x in resolved})
package={'name':'@heatguard/web','private':True,'version':'0.1.0','type':'module','scripts':{'dev':'vite --host 127.0.0.1','build':'tsc -b && vite build','typecheck':'tsc -b','test':'vitest run tests/unit','test:e2e':'playwright test'},'dependencies':deps}
(root/'apps/web/package.json').write_text(json.dumps(package,indent=2),encoding='utf8')
(root/'docs/evidence/npm-versions.json').write_text(json.dumps(resolved,indent=2),encoding='utf8')
rows=[x for x in spec.split('### A.1')[1].split('### A.2')[0].splitlines() if re.match(r'\| A\d\d ',x)]
decisions='# Decisions\n\n| id | decision | reason | evidence | tier | review_status |\n|---|---|---|---|---|---|\n'
for row in rows:
    cells=[x.strip() for x in row.strip('|').split('|')]
    decisions+=f'| {cells[0]} | {cells[1]} | Adopted specification decision | Expanded build prompt A.1 | P0 | adopted |\n'
(root/'DECISIONS.md').write_text(decisions,encoding='utf8')
sql=spec.split('### F.1 SQL DDL')[1].split('```sql')[1].split('```')[0].strip()
(root/'supabase/migrations/20261107000100_initial.sql').write_text('-- Prepared from specification; execution requires local PostGIS/Supabase.\n'+sql+'\n',encoding='utf8')
print('Scaffolded tokens,',len(langs['en']),'catalogue keys and',len(deps),'exact npm pins')
