import base64,hashlib,hmac,os,secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from .errors import AppError

def key(name):
    value=os.environ.get(name,'')
    try:decoded=base64.b64decode(value,validate=True)
    except ValueError:decoded=b''
    if len(decoded)!=32:raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'encryption_configuration'})
    return decoded
def keyed_hash(value,name='HANDLE_HMAC_KEY'):return hmac.new(key(name),value.encode(),hashlib.sha256).hexdigest()
def encrypt_endpoint(endpoint):
    nonce=secrets.token_bytes(12)
    return nonce+AESGCM(key('HANDLE_ENCRYPTION_KEY')).encrypt(nonce,endpoint.encode(),b'heatguard-endpoint-v1')
def decrypt_endpoint(ciphertext):return AESGCM(key('HANDLE_ENCRYPTION_KEY')).decrypt(ciphertext[:12],ciphertext[12:],b'heatguard-endpoint-v1').decode()
