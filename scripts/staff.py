"""Explicit local staff provisioning; no public signup or default passwords."""
from __future__ import annotations
import argparse,getpass,json,os,secrets,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import httpx
import psycopg
from psycopg.rows import dict_row
from scripts.local import load_env
from scripts.local_db import PRIVATE,ROOT,local_url

def administrator():
    url=os.environ['HEATGUARD_LOCAL_ADMIN_DATABASE_URL'];local_url(url,54322)
    return psycopg.connect(url,row_factory=dict_row)

def auth_admin(method,path,body=None):
    base=os.environ['SUPABASE_URL'];local_url(base,54321)
    with httpx.Client(timeout=15) as client:
        response=client.request(method,base.rstrip('/')+'/auth/v1/admin/'+path,
          headers={'apikey':os.environ['SUPABASE_SECRET_KEY'],'Authorization':'Bearer '+os.environ['HEATGUARD_LOCAL_SERVICE_ROLE_KEY']},json=body)
    if not response.is_success:raise RuntimeError(f'Local Auth admin request failed (HTTP {response.status_code}); no credentials are logged.')
    return response.json()

def create(email,password,role):
    if '@' not in email or len(password)<12:raise ValueError('A valid email identifier and a password of at least 12 characters are required.')
    user=auth_admin('POST','users',{'email':email,'password':password,'email_confirm':True,'app_metadata':{'local_test_account':email.endswith('@heatguard.test')}})
    try:
        with administrator() as db:
            db.execute('insert into app_private.authority_members(user_id,role) values(%s,%s)',(user['id'],role))
    except Exception:
        auth_admin('DELETE','users/'+user['id'])
        raise
    return {'id':user['id'],'email':email,'role':role}

def bootstrap():
    path=PRIVATE/'staff-credentials.json';PRIVATE.mkdir(parents=True,exist_ok=True)
    accounts=json.loads(path.read_text(encoding='utf-8'))['accounts'] if path.exists() else []
    for role in ['officer','approver']:
        if any(a['role']==role for a in accounts):continue
        password=secrets.token_urlsafe(24)
        account=create(role+'@heatguard.test',password,role)
        accounts.append({**account,'password':password})
        # Save after each account so interruption does not lose its password.
        path.write_text(json.dumps({'notice':'Explicit local test accounts, no real authority affiliation. No messages sent.','accounts':accounts},indent=2),encoding='utf-8')
        path.chmod(0o600)
    print('Created two separate local test staff accounts. Private credentials: data/raw/local/staff-credentials.json. No passwords are printed.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['create','bootstrap','disable']);parser.add_argument('--email')
    parser.add_argument('--role',choices=['viewer','officer','approver'],default='viewer');args=parser.parse_args()
    load_env(ROOT/'.env')
    if args.action=='bootstrap':bootstrap()
    elif args.action=='create':
        if not args.email:parser.error('--email is required')
        password=getpass.getpass('New local staff password: ')
        if password!=getpass.getpass('Repeat password: '):raise SystemExit('Passwords differ; no account created.')
        account=create(args.email,password,args.role);print('Created local staff account with role '+account['role']+'.')
    else:
        if not args.email:parser.error('--email is required')
        with administrator() as db:
            row=db.execute('update app_private.authority_members m set active=false,updated_at=now() from auth.users u where u.id=m.user_id and lower(u.email)=lower(%s) returning m.user_id',(args.email,)).fetchone()
        if not row:raise SystemExit('No matching staff membership was found.')
        print('Local membership disabled. Existing tokens cannot access protected routes on their next request.')

if __name__=='__main__':main()
