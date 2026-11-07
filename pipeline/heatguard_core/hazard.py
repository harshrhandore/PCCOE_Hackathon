from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from .config import read_config
from .units import finite

IST = ZoneInfo('Asia/Kolkata')

def category(utci):
    if not finite(utci): return None
    thresholds = read_config('methods.v1')['utci']['upper_endpoints_c']
    return next((i for i, bound in enumerate(thresholds) if utci <= bound), 4)

def local_time(value):
    if isinstance(value, (int, float)): return datetime.fromtimestamp(value, timezone.utc).astimezone(IST)
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(IST)

def complete_bins(points, field, expected):
    bins = {}
    for when, value in points:
        bins.setdefault((when.date(), when.hour), []).append(value)
    return len(bins) == expected and all(len(v)==1 and finite(v[0]) for v in bins.values())

def evaluate(base, prior_bases, hot_nights, night_inputs=None):
    cfg = read_config('methods.v1')
    def rule(rule_id, status, inputs, threshold):
        return {'id': rule_id, 'status': status, 'inputs': inputs, 'threshold': threshold,
                'method_version': cfg['version']}
    rules = [rule('UTCI_BASE', 'unknown' if base is None else 'fired', {'base': base}, cfg['utci'])]
    known_nights = len(hot_nights)==2 and all(v is not None for v in hot_nights)
    known_days = len(prior_bases)==2 and all(v is not None for v in prior_bases) and base is not None
    night_bonus = int(known_nights and base is not None and base >= cfg['night']['min_base'] and all(hot_nights))
    persistence = int(known_days and all(v >= 2 for v in [*prior_bases, base]))
    rules.append(rule('NIGHT_RELIEF_2', 'fired' if night_bonus else 'not_fired' if known_nights else 'unknown',
                      night_inputs or {'hot_nights': hot_nights, 'base': base}, cfg['night']))
    rules.append(rule('PERSISTENCE_3', 'fired' if persistence else 'not_fired' if known_days else 'unknown',
                      {'base_levels': [*prior_bases, base]}, {'days':3,'minimum_base':2}))
    return {'base_level':base, 'hazard_level':None if base is None else min(4,base+night_bonus+persistence),
            'hazard_rule_fired':rules, 'modifier_status':'complete' if known_nights and known_days else 'unknown'}

def daily_records(hourly, display_dates, thresholds=None, normals=None):
    thresholds, normals = thresholds or {}, normals or {}
    times = [local_time(t) for t in hourly['time']]
    def pairs(field, predicate):
        return [(t,v) for t,v in zip(times,hourly[field]) if predicate(t)]
    bases, nights, night_data = {}, {}, {}
    first = datetime.fromisoformat(display_dates[0]).date()-timedelta(days=2)
    for offset in range(7):
        day = first+timedelta(days=offset); key=day.isoformat()
        u=pairs('utci',lambda t:t.date()==day)
        bases[key]=category(max(v for _,v in u)) if complete_bins(u,'utci',24) else None
        start=datetime.combine(day,datetime.min.time(),IST)+timedelta(hours=20)
        end=start+timedelta(hours=10)
        n=pairs('t2m',lambda t:start<=t<end)
        minimum=min(v for _,v in n) if complete_bins(n,'t2m',10) else None
        threshold=thresholds.get(key[5:])
        nights[key] = None if minimum is None or threshold is None else minimum > threshold
        night_data[key]={'date':key,'start':start.isoformat(),'end':end.isoformat(),'minimum_c':minimum,'threshold_c':threshold,'comparison':'>'}
    result=[]
    for key in display_dates:
        day=datetime.fromisoformat(key).date(); previous=(day-timedelta(days=1)).isoformat()
        prior=[bases.get((day-timedelta(days=i)).isoformat()) for i in [2,1]]
        rule=evaluate(bases.get(key),prior,[nights.get(previous),nights.get(key)],{'nights':[night_data.get(previous),night_data.get(key)]})
        record={**rule,'date':key,'night_min_t':night_data.get(key,{}).get('minimum_c'),
                'night_threshold':thresholds.get(key[5:]),'night_period':night_data.get(key),
                'completeness':{'hourly':bases.get(key) is not None,'night_context':all(nights.get(x) is not None for x in [previous,key]),'persistence_context':all(x is not None for x in prior)}}
        for field,output in [('utci','peak_utci'),('wbgt','peak_wbgt'),('t2m','tmax'),('heat_index','peak_heat_index')]:
            values=pairs(field,lambda t:t.date()==day)
            if complete_bins(values,field,24):
                when,value=max(values,key=lambda x:x[1]);record[output]=value;record[output+'_time']=when.astimezone(timezone.utc).isoformat().replace('+00:00','Z')
            else: record[output]=None;record[output+'_time']=None
        from .imd import indicative
        record['imd_flag']=indicative(record['tmax'],normals.get(key[5:]))
        record['p_ge_3']=None
        result.append(record)
    return result
