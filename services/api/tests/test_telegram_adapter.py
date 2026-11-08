import asyncio
import httpx
import pytest
from services.api.app.channels import Telegram
from services.api.app.errors import AppError

@pytest.mark.parametrize('response,status',[
    ((200,{'ok':True,'result':{'message_id':123}}),'succeeded'),
    ((429,{'ok':False}),'failed'),((403,{'ok':False}),'failed'),
    ((502,{'ok':False}),'unknown'),((200,{'ok':True}),'unknown'),
    ('timeout','unknown'),('invalid_json','unknown')
])
def test_provider_outcomes_no_blind_retry(monkeypatch,response,status):
    monkeypatch.setenv('DELIVERY_MODE','test');monkeypatch.setenv('TELEGRAM_TEST_CHAT_IDS','fixture-chat')
    monkeypatch.setenv('TELEGRAM_BOT_TOKEN','fixture-token-only')
    calls=[]
    def handler(request):
        calls.append(request)
        if response=='timeout':raise httpx.ReadTimeout('fixture timeout')
        if response=='invalid_json':return httpx.Response(200,text='invalid')
        return httpx.Response(response[0],json=response[1])
    original=httpx.AsyncClient
    monkeypatch.setattr('services.api.app.channels.httpx.AsyncClient',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    result=asyncio.run(Telegram().send({'content':{'text':'TEST — fixture adapter test'}},'fixture-chat','fixture-idempotency'))
    assert result.status==status
    assert len(calls)==1

def test_nonallowlisted_and_non_test_mode_rejected(monkeypatch):
    monkeypatch.setenv('TELEGRAM_TEST_CHAT_IDS','fixture-chat');monkeypatch.setenv('DELIVERY_MODE','test')
    with pytest.raises(AppError):Telegram().validate_recipient('fixture-other-chat')
    monkeypatch.setenv('DELIVERY_MODE','actual')
    with pytest.raises(AppError):Telegram().validate_recipient('fixture-chat')
