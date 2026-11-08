"""Start the isolated local Supabase stack without printing credentials."""
from __future__ import annotations
import argparse,base64,hashlib,json,os,secrets,shutil,subprocess,sys,tarfile,uuid
from pathlib import Path
from urllib.parse import quote,urlparse,unquote

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.local import load_env

VERSION='3.0.0'
PRIVATE=ROOT/'data/raw/local'
NETWORK='heatguard-local'
WSL_DISTRO=os.environ.get('HEATGUARD_WSL_DISTRO','Ubuntu')
WSL_CLI='/usr/local/lib/heatguard-cli/supabase'
EXCLUDE='realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'
KEEPER='heatguard-local-wsl-keeper'

def wsl(*args,**kwargs):
    return subprocess.run(['wsl','-d',WSL_DISTRO,'-u','root','--exec',*args],check=True,**kwargs)

def linux_root():
    return wsl('wslpath','-a',str(ROOT),capture_output=True,text=True).stdout.strip()

def ensure_keeper():
    if os.name!='nt':return
    found=subprocess.run(['wsl','-d',WSL_DISTRO,'-u','root','--exec','pgrep','-f','^'+KEEPER+' '],capture_output=True)
    if found.returncode:
        # WSL systemd services alone do not keep a distro alive. Retain one
        # project-owned process with no visible PowerShell window.
        subprocess.Popen(['wsl','-d',WSL_DISTRO,'-u','root','--exec','bash','-c',f'exec -a {KEEPER} sleep infinity'],
          stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)

def command(*args):
    if os.name=='nt':
        return ['wsl','-d',WSL_DISTRO,'-u','root','--exec',WSL_CLI,*args,'--workdir',linux_root()]
    binary=shutil.which('supabase') or str(ROOT/'node_modules/.bin/supabase')
    return [binary,*args,'--workdir',str(ROOT)]

def ensure_signing_key():
    PRIVATE.mkdir(parents=True,exist_ok=True)
    target=PRIVATE/'signing-keys.json'
    if target.exists():
        values=json.loads(target.read_text(encoding='utf-8'))
        if not any(v.get('alg')=='ES256' and 'sign' in v.get('key_ops',[]) and v.get('d') for v in values):
            raise ValueError('Local signing-key configuration has no ES256 private signing key.')
        return
    from cryptography.hazmat.primitives.asymmetric import ec
    from jwt.algorithms import ECAlgorithm
    value=ECAlgorithm.to_jwk(ec.generate_private_key(ec.SECP256R1()),as_dict=True)
    value.update(alg='ES256',kid=str(uuid.uuid4()),use='sig',key_ops=['sign','verify'],ext=True)
    target.write_text(json.dumps([value]),encoding='utf-8');target.chmod(0o600)
    print('Created a private local ES256 signing key; values are not logged.',flush=True)

def setup():
    """Windows uses its existing Ubuntu distro; no Windows service or port proxy."""
    if os.name!='nt':
        print('Install Docker and the pinned Supabase CLI using README instructions, then run db:start.')
        return
    wsl('sh','-c','command -v docker >/dev/null || { apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends docker.io ca-certificates; }')
    tools=ROOT/'data/raw/tools';tools.mkdir(parents=True,exist_ok=True)
    import httpx
    metadata=httpx.get(f'https://registry.npmjs.org/@supabase%2fcli-linux-x64/{VERSION}',timeout=30)
    metadata.raise_for_status();dist=metadata.json()['dist']
    archive=tools/f'supabase-cli-linux-x64-{VERSION}.tgz'
    if not archive.exists():
        npm=shutil.which('npm.cmd')
        subprocess.run([npm,'pack',f'@supabase/cli-linux-x64@{VERSION}','--pack-destination',str(tools),'--json'],check=True,capture_output=True)
    actual=base64.b64encode(hashlib.sha512(archive.read_bytes()).digest()).decode()
    if dist['integrity']!='sha512-'+actual:raise SystemExit('Supabase CLI package integrity mismatch; no binary was installed.')
    extracted=tools/'linux-cli'
    with tarfile.open(archive) as package:package.extractall(extracted,filter='data')
    wsl('mkdir','-p',WSL_CLI.rsplit('/',1)[0])
    wsl('install','-m','755',linux_root()+'/data/raw/tools/linux-cli/package/bin/supabase',WSL_CLI)
    print(f'Installed verified Supabase CLI {VERSION} in Ubuntu. Run npm run db:start.')

def status_values():
    result=subprocess.run(command('status','--output','json'),check=True,capture_output=True,text=True)
    return json.loads(result.stdout)

def local_url(value,port):
    parsed=urlparse(value)
    if parsed.hostname not in ['localhost','127.0.0.1','::1'] or parsed.port!=port:
        raise ValueError('Refusing a non-loopback or unexpected service URL.')
    return parsed

def save_environment(updates):
    path=ROOT/'.env';lines=path.read_text(encoding='utf-8-sig').splitlines() if path.exists() else []
    pending=dict(updates);result=[]
    for line in lines:
        name=line.partition('=')[0].strip()
        if name in updates:
            if name in pending:result.append(name+'='+pending.pop(name))
        else:result.append(line)
    result.extend(name+'='+value for name,value in pending.items())
    temporary=PRIVATE/'env.next';temporary.write_text('\n'.join(result)+'\n',encoding='utf-8');temporary.chmod(0o600)
    os.replace(temporary,path)

def configure(values=None):
    import psycopg
    from psycopg import sql
    load_env(ROOT/'.env')
    existing=os.environ.get('DATABASE_URL')
    if existing:
        previous=local_url(existing,54322)
        if previous.username!='heatguard_api':raise ValueError('Existing DATABASE_URL is not the managed local application role; it was preserved.')
    values=values or status_values();local_url(values['API_URL'],54321);local_url(values['DB_URL'],54322)
    password=unquote(urlparse(existing).password) if existing else secrets.token_urlsafe(32)
    with psycopg.connect(values['DB_URL']) as db:
        if not db.execute("select to_regclass('app_private.authority_members')").fetchone()[0]:raise ValueError('Local application migrations have not run.')
        if not db.execute("select 1 from pg_roles where rolname='heatguard_api'").fetchone():
            db.execute('create role heatguard_api login nosuperuser nocreatedb nocreaterole noreplication bypassrls')
        db.execute(sql.SQL('alter role heatguard_api password {}').format(sql.Literal(password)))
        db.execute('grant service_role to heatguard_api')
        db.execute('grant usage on schema auth to heatguard_api')
        db.execute('grant select(id,user_id,not_after) on auth.sessions to heatguard_api')
    base=values['API_URL'].rstrip('/')
    updates={'APP_ENV':'local','DATABASE_URL':f'postgresql://heatguard_api:{quote(password,safe="")}@127.0.0.1:54322/postgres',
      'HEATGUARD_LOCAL_ADMIN_DATABASE_URL':values['DB_URL'],
      'HEATGUARD_LOCAL_SERVICE_ROLE_KEY':values['SERVICE_ROLE_KEY'],
      'SUPABASE_URL':base,'SUPABASE_PUBLISHABLE_KEY':values['PUBLISHABLE_KEY'],
      'SUPABASE_SECRET_KEY':values['SECRET_KEY'],'SUPABASE_JWKS_URL':base+'/auth/v1/.well-known/jwks.json',
      'SUPABASE_JWT_ISSUER':base+'/auth/v1','SUPABASE_JWT_AUDIENCE':'authenticated','DELIVERY_MODE':'test'}
    for name in ['HANDLE_HMAC_KEY','HANDLE_ENCRYPTION_KEY','DELETION_TOKEN_HMAC_KEY']:
        updates[name]=os.environ.get(name) or base64.b64encode(os.urandom(32)).decode()
    save_environment(updates)
    subprocess.run([sys.executable,'scripts/seed-db.py'],cwd=ROOT,check=True)
    print('Configured local Auth and a restricted application database login. Credentials stay in ignored .env. Restart npm start to load them.')

def start():
    ensure_keeper()
    ensure_signing_key()
    if os.name=='nt':wsl('systemctl','start','docker')
    docker=['wsl','-d',WSL_DISTRO,'-u','root','--exec','docker'] if os.name=='nt' else ['docker']
    found=subprocess.run([*docker,'network','inspect',NETWORK],capture_output=True)
    if found.returncode:
        subprocess.run([*docker,'network','create','-o','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',NETWORK],check=True,capture_output=True)
    else:
        options=json.loads(found.stdout)[0]['Options']
        if options.get('com.docker.network.bridge.host_binding_ipv4')!='127.0.0.1':raise SystemExit('Existing local network does not bind to loopback. Refusing to start.')
    log=PRIVATE/'stack.log'
    print('Starting local database and Auth. First start downloads containers. Progress: data/raw/local/stack.log (private).',flush=True)
    with log.open('a',encoding='utf-8') as output:
        result=subprocess.run(command('start','--network-id',NETWORK,'--exclude',EXCLUDE),stdout=output,stderr=subprocess.STDOUT)
        if result.returncode==0:
            result=subprocess.run(command('db','push','--yes'),stdout=output,stderr=subprocess.STDOUT)
    if result.returncode:raise SystemExit('Local stack failed to start. Inspect the private progress log; no credentials are printed here.')
    values=status_values()
    # Status can include private keys. Keep the complete result ignored.
    (PRIVATE/'status.json').write_text(json.dumps(values),encoding='utf-8')
    for name in ['supabase_db_heatguard-local','supabase_kong_heatguard-local']:
        inspect=subprocess.run([*docker,'inspect','--format','{{json .NetworkSettings.Ports}}',name],check=True,capture_output=True,text=True)
        bindings=json.loads(inspect.stdout)
        if any(binding['HostIp'] not in ['127.0.0.1','::1'] for group in bindings.values() if group for binding in group):
            subprocess.run(command('stop','--project-id','heatguard-local'),check=True,capture_output=True)
            raise SystemExit('Unexpected non-loopback port binding; owned local stack was stopped.')
    configure(values)
    print('Local database and Auth are ready.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['setup','start','configure','stop','status'])
    action=parser.parse_args().action
    if action=='setup':setup()
    elif action=='start':start()
    elif action=='configure':configure()
    elif action=='stop':
        subprocess.run(command('stop','--project-id','heatguard-local'),check=True,capture_output=True)
        if os.name=='nt':subprocess.run(['wsl','-d',WSL_DISTRO,'-u','root','--exec','pkill','-f','^'+KEEPER+' infinity$'],capture_output=True)
        print('Local stack stopped; database volume retained.')
    else:
        values=status_values()
        import httpx,psycopg
        local_url(values['API_URL'],54321);local_url(values['DB_URL'],54322)
        with psycopg.connect(values['DB_URL']) as db:
            version=db.execute("select current_setting('server_version'),extversion from pg_extension where extname='postgis'").fetchone()
        response=httpx.get(values['API_URL'].rstrip('/')+'/auth/v1/health',timeout=5)
        print(f'Database ready: PostgreSQL {version[0]}; PostGIS {version[1]}. Auth HTTP {response.status_code}.')
        if response.status_code!=200:raise SystemExit(1)

if __name__=='__main__':main()
