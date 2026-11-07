"""Conservative per-process upstream accounting; shared-IP usage is unknown."""
import math,time
from collections import deque
from .io import ROOT,write_json

events=deque();total=0
def estimated_calls(params):
    count=len(str(params.get('latitude','')).split(','));variables=len(str(params.get('hourly','')).split(','))
    if 'start_date' in params:
        from datetime import date
        days=(date.fromisoformat(params['end_date'])-date.fromisoformat(params['start_date'])).days+1
    else:days=int(params.get('past_days',0))+int(params.get('forecast_days',7))
    # Forecast horizon >14 days and >10 variables scale official accounting.
    # Rounding up is deliberately conservative. Model remains one per request.
    return math.ceil(count*max(1,variables/10)*max(1,days/14))

def reserve(params):
    global total
    cost=estimated_calls(params)
    if cost>480 or total+cost>8000:raise RuntimeError('Conservative source quota gate: split the request or review daily budget')
    while True:
        now=time.monotonic()
        while events and now-events[0][0]>=3600:events.popleft()
        minute=sum(c for t,c in events if now-t<60);hour=sum(c for t,c in events)
        if minute+cost<=480 and hour+cost<=4000:break
        time.sleep(2)
    events.append((time.monotonic(),cost));total+=cost
    write_json(ROOT/'reports/quota-estimate.json',{'equivalent_calls_this_process':total,'warning':total>=6000,'stop_at':8000,'minute_stop_at':480,'hour_stop_at':4000,'monthly_usage':'unknown','shared_ip_usage':'unknown','basis':'Open-Meteo pricing, retrieved 2026-11-07; conservative rounded location/variable/period accounting'})
