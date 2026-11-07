import math
from datetime import datetime,timezone,timedelta
import pytest
from pipeline.heatguard_core.hazard import category,evaluate,local_time,complete_bins
from pipeline.heatguard_core.risk import adjusted_risk
from pipeline.heatguard_core.imd import indicative
from pipeline.heatguard_core.vulnerability import percentile_ranks,compute_cohort
from pipeline.heatguard_core.units import checked_celsius,json_safe,c_to_k,k_to_c

@pytest.mark.parametrize('x,expected',[(25.9,0),(26,0),(26.0001,1),(32,1),(32.0001,2),(38,2),(38.0001,3),(46,3),(46.0001,4),(None,None),(float('nan'),None)])
def test_utci_boundaries(x,expected):assert category(x)==expected

@pytest.mark.parametrize('base,prior,nights,hazard,night,persistence',[(2,[1,2],[True,True],3,True,False),(2,[1,2],[False,True],2,False,False),(2,[2,2],[False,False],3,False,True),(2,[2,1],[False,False],2,False,False),(3,[2,2],[True,True],4,True,True),(0,[0,0],[True,True],0,False,False)])
def test_modifiers(base,prior,nights,hazard,night,persistence):
    out=evaluate(base,prior,nights)
    assert out['hazard_level']==hazard
    assert (out['hazard_rule_fired'][1]['status']=='fired')==night
    assert (out['hazard_rule_fired'][2]['status']=='fired')==persistence

def test_missing_context_is_unknown():
    out=evaluate(2,[None,2],[None,True]);assert out['modifier_status']=='unknown'
    assert out['hazard_rule_fired'][1]['status']=='unknown'

@pytest.mark.parametrize('h,v,top,expected',[(1,.9,True,1),(2,.9,True,3),(3,.9,False,3),(4,.9,True,4),(2,None,None,2),(None,None,None,None)])
def test_risk(h,v,top,expected):assert adjusted_risk(h,v,top)['risk_level']==expected

def test_priority():
    assert adjusted_risk(3,.84,True)['priority_score']==pytest.approx(69)
    assert adjusted_risk(2)['priority_score'] is None

@pytest.mark.parametrize('t,d,out',[(39.999,8,'no'),(40,4.499,'no'),(40,4.5,'heat_wave'),(42,6.4,'heat_wave'),(42,6.4001,'severe_heat_wave'),(44.999,0,'no'),(45,0,'heat_wave'),(46.999,0,'heat_wave'),(47,0,'severe_heat_wave'),(45,None,'heat_wave'),(41,None,'unknown_departure')])
def test_imd(t,d,out):assert indicative(t,None if d is None else t-d)==out

def test_tied_rank_order_and_incomplete_cohort():
    assert percentile_ranks([1,2,2,4])==[0,.5,.5,1]
    assert percentile_ranks([3,3])==[.5,.5]
    rows=[{'ward_id':str(i),'population_density':i,'children_share':i,'low_green_cover':i} for i in range(4)]
    assert all(not row['available'] for row in compute_cohort(rows))
    for i,row in enumerate(rows):row['cooling_distance']=i
    a=compute_cohort(rows);b={r['ward_id']:r for r in compute_cohort(rows[::-1])}
    assert all(r['vulnerability']==b[r['ward_id']]['vulnerability'] for r in a)
    assert all(r['available'] for r in a)

def test_ist_keeps_source_instant():
    t=local_time('2025-05-01T15:00:00Z');assert (t.hour,t.minute)==(20,30)
    points=[(t+timedelta(hours=i),float(i)) for i in range(10)]
    assert complete_bins(points,'t',10)
    assert not complete_bins(points[:-1]+[points[0]],'t',10)

def test_units_and_nonfinite():
    assert k_to_c(c_to_k(35))==35
    with pytest.raises(ValueError):checked_celsius(308.15)
    assert json_safe({'x':math.inf,'a':[math.nan]})=={'x':None,'a':[None]}
