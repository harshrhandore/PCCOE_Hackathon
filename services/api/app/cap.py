"""CAP serialization from frozen content; geocodes avoid polygon-hole ambiguity."""
from datetime import datetime,timezone
from pathlib import Path
from lxml import etree
from .errors import AppError

NS='urn:oasis:names:tc:emergency:cap:1.2'
def generate(alert):
    if alert['cap_status'] not in ['Test','Exercise']:raise ValueError('Actual CAP disabled')
    if alert.get('is_simulation') and alert['cap_status']!='Exercise':raise ValueError('Simulation must use Exercise')
    root=etree.Element('{'+NS+'}alert',nsmap={None:NS})
    def add(parent,name,value):
        element=etree.SubElement(parent,'{'+NS+'}'+name);element.text=str(value);return element
    content=alert['content']
    def cap_time(value):
        # CAP 1.2 XSD requires an explicit signed UTC offset, not the ISO Z form.
        return datetime.fromisoformat(value.replace('Z','+00:00')).isoformat(timespec='seconds')
    created=cap_time(alert['created_at']);onset=cap_time(content['onset']);expiry=cap_time(alert['expires_at'])
    for name,value in [('identifier',str(alert['id'])+'-r'+str(alert['revision'])),('sender','heatguard-ai.avcoe.prototype'),('sent',created),('status',alert['cap_status']),('msgType','Alert'),('scope','Restricted'),('restriction','Independent student research prototype. Consented, allowlisted test recipients only.')]:add(root,name,value)
    info=add(root,'info','');info.text=None
    now=datetime.now(timezone.utc);when=datetime.fromisoformat(onset.replace('Z','+00:00'))
    fields=[('language','en-IN'),('category','Met'),('event','Heat stress advisory — HeatGuard prototype'),('urgency','Immediate' if when<=now else 'Future'),('severity',['Minor','Minor','Moderate','Severe','Extreme'][alert['risk_level']]),('certainty','Possible'),('audience',alert['audience']),('onset',onset),('expires',expiry),('senderName','HeatGuard AI · AVCOE student team'),('headline','SIMULATION — not a live forecast.' if alert['is_simulation'] else 'TEST — prototype advisory.'),('description',content['text']),('instruction',content['instructions']),('web','https://open-meteo.com/en/docs')]
    for name,value in fields:add(info,name,value)
    for name,value in [('snapshot_id',alert['snapshot_id']),('method_version',content['method_version']),('is_simulation',str(alert['is_simulation']).lower()),('hazard',content.get('hazards')),('vulnerability',content.get('vulnerabilities')),('risk',alert['risk_level'])]:
        parameter=add(info,'parameter','');parameter.text=None;add(parameter,'valueName',name);add(parameter,'value',value)
    for ward in content['wards']:
        area=add(info,'area','');area.text=None;add(area,'areaDesc',ward['name_en']+' · historical boundaries 2022')
        for name,value in [('ward_id',ward['id']),('boundary_version',ward['boundary_version'])]:
            geocode=add(area,'geocode','');geocode.text=None;add(geocode,'valueName',name);add(geocode,'value',value)
    return etree.tostring(root,encoding='UTF-8',xml_declaration=True,pretty_print=True)

def validate(xml):
    schema_path=Path(__file__).resolve().parents[3]/'docs/evidence/cap_xsd_fixed.xsd'
    if not schema_path.exists():raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'CAP_XSD'})
    parser=etree.XMLParser(resolve_entities=False,no_network=True,load_dtd=False)
    doc=etree.fromstring(xml,parser)
    schema=etree.XMLSchema(etree.parse(str(schema_path),parser))
    schema.assertValid(doc)
    return True
