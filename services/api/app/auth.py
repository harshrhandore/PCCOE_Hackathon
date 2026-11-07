import os
from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID
import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from .errors import AppError
from .storage import database

security=HTTPBearer(auto_error=False)
@dataclass(frozen=True)
class Member:
    user_id:str
    role:str
    session_id:str

@lru_cache(maxsize=1)
def jwks_client(url):return jwt.PyJWKClient(url,cache_jwk_set=True,lifespan=300,timeout=5)

def validate_claims(token):
    url=os.environ.get('SUPABASE_JWKS_URL');issuer=os.environ.get('SUPABASE_JWT_ISSUER');audience=os.environ.get('SUPABASE_JWT_AUDIENCE','authenticated')
    if not url or not issuer:raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'auth_configuration'})
    try:
        key=jwks_client(url).get_signing_key_from_jwt(token)
        claims=jwt.decode(token,key.key,algorithms=['ES256','RS256'],issuer=issuer,audience=audience,options={'require':['exp','iat','sub','session_id']})
        UUID(claims['sub']);UUID(claims['session_id'])
        if claims.get('is_anonymous'):raise ValueError('Anonymous session')
        return claims
    except (jwt.PyJWTError,ValueError,KeyError) as exc:raise AppError('UNAUTHENTICATED',401,'state.unauthorized') from exc

def member(credentials:HTTPAuthorizationCredentials|None=Depends(security)):
    if credentials is None:raise AppError('UNAUTHENTICATED',401,'state.unauthorized')
    claims=validate_claims(credentials.credentials)
    with database() as connection:
        row=connection.execute('select m.role from app_private.authority_members m join auth.sessions s on s.user_id=m.user_id where m.user_id=%s and s.id=%s and m.active and (s.not_after is null or s.not_after>now())',(claims['sub'],claims['session_id'])).fetchone()
        if not row:raise AppError('FORBIDDEN',403,'state.forbidden')
        return Member(claims['sub'],row['role'],claims['session_id'])

def require_role(current,roles):
    if current.role not in roles:raise AppError('FORBIDDEN',403,'state.forbidden')

def recheck_member(connection,current,roles):
    # Check again in the mutation transaction; JWT role claims are never trusted.
    row=connection.execute('select role from app_private.authority_members where user_id=%s and active for share',(current.user_id,)).fetchone()
    session=connection.execute('select id from auth.sessions where id=%s and user_id=%s and (not_after is null or not_after>now())',(current.session_id,current.user_id)).fetchone()
    if not row or row['role'] not in roles or not session:raise AppError('FORBIDDEN',403,'state.forbidden')
