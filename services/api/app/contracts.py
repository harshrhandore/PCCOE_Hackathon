from datetime import datetime
from typing import Literal
from pydantic import BaseModel,ConfigDict,Field,field_validator,model_validator

class StrictModel(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)

Audience=Literal['authority','citizen','outdoor_worker','school_anganwadi','care_home']
class WhatIf(StrictModel):
    snapshot_id:str=Field(min_length=1,max_length=100)
    ward_ids:list[str]=Field(min_length=1,max_length=200)
    temperature_delta_c:float=Field(ge=0,le=6)
    relative_humidity_delta_pp:float=Field(ge=-30,le=30)
    wind_multiplier:float=Field(ge=0,le=2)
    weights_mode:Literal['default','equal']='default'
    @field_validator('ward_ids')
    @classmethod
    def unique(cls,values):
        if len(set(values))!=len(values) or any(len(v)>100 for v in values):raise ValueError('Duplicate or invalid ward IDs')
        return values

class Login(StrictModel):
    email:str=Field(min_length=3,max_length=254)
    password:str=Field(min_length=1,max_length=256)

class Subscription(StrictModel):
    channel:Literal['telegram','web_push','email']
    ward_id:str=Field(min_length=1,max_length=100)
    lang:Literal['en','hi','mr']='en'
    audience:Literal['citizen','outdoor_worker','school_anganwadi','care_home']='citizen'
    consent:Literal[True]
    consent_version:Literal['1.0.0']

class Draft(StrictModel):
    snapshot_id:str=Field(min_length=1,max_length=100)
    ward_ids:list[str]=Field(min_length=1,max_length=200)
    risk_level:int=Field(ge=0,le=4)
    audience:Audience
    languages:list[Literal['en','hi','mr']]=Field(min_length=1,max_length=3)
    action_ids:list[str]=Field(min_length=1,max_length=12)
    onset:datetime
    expires:datetime
    @field_validator('ward_ids','languages','action_ids')
    @classmethod
    def unique(cls,values):
        if len(values)!=len(set(values)):raise ValueError('Duplicate selection')
        return values
    @model_validator(mode='after')
    def times(self):
        if self.onset.tzinfo is None or self.expires.tzinfo is None or self.expires<=self.onset:raise ValueError('UTC-offset onset and increasing expiry required')
        return self

class Revision(StrictModel):
    expected_revision:int=Field(ge=1)
class Approval(Revision):
    content_sha256:str=Field(pattern='^[a-f0-9]{64}$')
class Send(Revision):
    delivery_mode:Literal['test']
class Cancel(Revision):
    reason_code:Literal['superseded','incorrect','withdrawn']
class PatchDraft(Revision):
    ward_ids:list[str]|None=Field(default=None,min_length=1,max_length=200)
    languages:list[Literal['en','hi','mr']]|None=None
    action_ids:list[str]|None=None
    onset:datetime|None=None
    expires:datetime|None=None
