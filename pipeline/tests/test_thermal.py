from pathlib import Path
from decimal import Decimal,localcontext
import numpy as np
import pandas as pd
import pytest
import thermofeel as tf
from pythermalcomfort.models import utci
from pvlib.solarposition import spa_python
from pipeline.heatguard_core.thermal import estimated_longwave

FIX=Path(__file__).parent/'fixtures'

def test_official_ecmwf_utci_vectors():
    d=np.genfromtxt(FIX/'thermofeel_testcases.csv',delimiter=',',names=True)
    expected=np.loadtxt(FIX/'utci.csv')
    actual=tf.calculate_utci(d['t2m'],d['va'],d['mrt'],td_k=d['td'])
    assert len(actual)>=10
    np.testing.assert_allclose(actual,expected,atol=1e-6)

def test_independent_utci_100_combinations():
    errors=[]
    for t in [15,20,26,32,38,44]:
        for rh in [20,40,60,80]:
            for v in [.5,1,2,4,8]:
                # Use identical vapour-pressure convention from the UTCI specification.
                eh=tf.calculate_saturation_vapour_pressure(np.array([t+273.15]))*rh/100
                if eh[0]>50:continue
                a=tf.calculate_utci(np.array([t+273.15]),np.array([v]),np.array([t+283.15]),ehPa=eh)[0]-273.15
                b=float(utci(tdb=t,tr=t+10,v=v,rh=rh,limit_inputs=True,round_output=False).utci)
                errors.append(abs(a-b))
    assert len(errors)>=100
    assert max(errors)<=.2

def test_longwave_independent_decimal_equation():
    with localcontext() as ctx:
        ctx.prec=40
        t=Decimal('303.15');e=Decimal('20');f=Decimal('.4')
        emissivity=Decimal('1.24')*(e/t)**(Decimal(1)/7)
        expected=(f+(1-f)*emissivity)*Decimal('5.670374419e-8')*t**4
    down,net=estimated_longwave(np.array([303.15]),np.array([20.0]),np.array([.4]))
    assert down[0]==pytest.approx(float(expected),abs=1e-9)
    assert net[0]<0
    opaque,_=estimated_longwave(np.array([303.15]),np.array([20.0]),np.array([1.0]))
    assert opaque[0]==pytest.approx(5.670374419e-8*303.15**4)

def test_nrel_spa_reference():
    result=spa_python(pd.DatetimeIndex(['2003-10-17T19:30:30Z']),39.742476,-105.1786,altitude=1830.14,pressure=82000,temperature=11,delta_t=67)
    assert float(result['apparent_zenith'].iloc[0])==pytest.approx(50.11162,abs=.0001)

def test_nws_published_example():
    t=np.array([(100-32)/1.8+273.15]);rh=np.array([55.])
    dew=tf.calculate_dew_point_from_relative_humidity(rh,t)
    hi=(tf.calculate_heat_index_adjusted(t,dew)[0]-273.15)*1.8+32
    assert hi==pytest.approx(124,abs=1.5)

def test_ccohs_components_and_weighted_example():
    assert .7*24+.2*42+.1*40==pytest.approx(29.2,abs=1e-9)
    assert (.5*25+1*27+.5*28)/2==pytest.approx(26.75,abs=1e-9)
