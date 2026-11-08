import os
from typing import Protocol
from dataclasses import dataclass
import httpx
from .errors import AppError

@dataclass
class DeliveryResult:
    status:str
    provider_message_id:str|None=None
    error_code:str|None=None

class AlertChannel(Protocol):
    def preview(self,alert,lang):...
    def validate_recipient(self,recipient):...
    async def send(self,approved_payload,recipient,idempotency_key):...
    def delivery_status(self,result):...

class Telegram:
    def preview(self,alert,lang='en'):return alert['content']['text']
    def validate_recipient(self,recipient):
        allowed={x.strip() for x in os.environ.get('TELEGRAM_TEST_CHAT_IDS','').split(',') if x.strip()}
        if os.environ.get('DELIVERY_MODE','test')!='test' or str(recipient) not in allowed:raise AppError('FORBIDDEN',403,'state.forbidden')
    async def send(self,approved_payload,recipient,idempotency_key):
        self.validate_recipient(recipient)
        token=os.environ.get('TELEGRAM_BOT_TOKEN')
        if not token:raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'telegram'})
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15,connect=5)) as client:
                r=await client.post(f'https://api.telegram.org/bot{token}/sendMessage',json={'chat_id':recipient,'text':approved_payload['content']['text']})
            if r.status_code==429:return DeliveryResult('failed',error_code='RATE_LIMITED')
            if r.status_code>=500:return DeliveryResult('unknown',error_code='PROVIDER_ACCEPTANCE_UNKNOWN')
            try:data=r.json()
            except ValueError:return DeliveryResult('unknown',error_code='PROVIDER_RESPONSE_INVALID')
            if not r.is_success or not data.get('ok'):return DeliveryResult('failed',error_code='PROVIDER_REJECTED')
            if not isinstance(data.get('result'),dict) or 'message_id' not in data['result']:return DeliveryResult('unknown',error_code='PROVIDER_RESPONSE_INVALID')
            return DeliveryResult('succeeded',str(data['result']['message_id']))
        except (httpx.TimeoutException,httpx.NetworkError):return DeliveryResult('unknown',error_code='PROVIDER_ACCEPTANCE_UNKNOWN')
    def delivery_status(self,result):return result.status

class Simulator:
    def preview(self,alert,lang='en'):return 'SIMULATOR ONLY\n'+alert['content']['text']
    def validate_recipient(self,recipient):return True
    async def send(self,approved_payload,recipient,idempotency_key):return DeliveryResult('simulated')
    def delivery_status(self,result):return result.status
