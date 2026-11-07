"""Scan distributable source and built text for common credential accidents."""
import pathlib,re,sys
root=pathlib.Path(__file__).resolve().parents[1]
patterns=[re.compile(r'sbp_[A-Za-z0-9]{20,}'),re.compile(r'sb_secret_[A-Za-z0-9_-]{20,}'),re.compile(r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----'),re.compile(r'(?<![A-Za-z0-9])\d{8,12}:[A-Za-z0-9_-]{30,}')]
failures=[]
for directory in ['apps/web/src','apps/web/dist','config','services','pipeline']:
 for p in (root/directory).rglob('*'):
  if p.suffix not in ['.py','.tsx','.ts','.js','.json','.html','.css','.sql']:continue
  text=p.read_text(encoding='utf8',errors='replace')
  if any(pattern.search(text) for pattern in patterns):failures.append(str(p.relative_to(root)))
if failures:raise SystemExit('Potential credentials in: '+', '.join(failures))
print('No matching credential patterns in distributable source/build text. This is a bounded pattern scan, not a proof of secret absence.')
