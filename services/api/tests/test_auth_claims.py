import time,uuid
from types import SimpleNamespace
import jwt,pytest
from cryptography.hazmat.primitives.asymmetric import ec
from services.api.app import auth
from services.api.app.errors import AppError
from scripts.local_db import local_url

@pytest.fixture
def signed(monkeypatch):
    private=ec.generate_private_key(ec.SECP256R1())
    monkeypatch.setenv('SUPABASE_JWKS_URL','http://127.0.0.1:54321/fixture-public-keys')
    monkeypatch.setenv('SUPABASE_JWT_ISSUER','http://127.0.0.1:54321/auth/v1')
    monkeypatch.setattr(auth,'jwks_client',lambda _:SimpleNamespace(get_signing_key_from_jwt=lambda _:SimpleNamespace(key=private.public_key())))
    def make(**changes):
        stamp=int(time.time())
        claims={'iss':'http://127.0.0.1:54321/auth/v1','aud':'authenticated','iat':stamp,'exp':stamp+1800,'sub':str(uuid.uuid4()),'session_id':str(uuid.uuid4()),**changes}
        return jwt.encode(claims,private,algorithm='ES256')
    return make

def test_small_auth_host_clock_skew_is_bounded(signed):
    assert auth.validate_claims(signed(iat=int(time.time())+3))['session_id']

@pytest.mark.parametrize('change',[
    {'iat':lambda:int(time.time())+60}, {'exp':lambda:int(time.time())-60},
    {'iss':'https://untrusted.invalid'}, {'aud':'untrusted'},
    {'is_anonymous':True}, {'session_id':'not-a-session-uuid'},
])
def test_clock_tolerance_does_not_bypass_other_claims(signed,change,caplog):
    token=signed(**{k:v() if callable(v) else v for k,v in change.items()})
    with pytest.raises(AppError) as error:auth.validate_claims(token)
    assert error.value.status==401
    assert token not in caplog.text

@pytest.mark.parametrize('url',[
    'https://hosted-project.supabase.co:54321',
    'http://localhost.untrusted.invalid:54321',
    'http://0.0.0.0:54321','http://127.0.0.1:5432',
])
def test_local_setup_refuses_non_loopback_or_unexpected_ports(url):
    with pytest.raises(ValueError):local_url(url,54321)
