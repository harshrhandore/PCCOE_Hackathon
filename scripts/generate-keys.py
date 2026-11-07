"""Explicit local provisioning command. Writes secrets only when invoked by owner."""
import secrets,base64
for name in ['HANDLE_HMAC_KEY','HANDLE_ENCRYPTION_KEY','DELETION_TOKEN_HMAC_KEY']:
    print(name+'='+base64.b64encode(secrets.token_bytes(32)).decode())
