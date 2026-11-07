"""Unit-checked thermofeel adapters. No implicit radiation substitutions."""
import numpy as np
import pandas as pd
import thermofeel as tf
from pvlib.solarposition import spa_python
from .config import read_config
from .units import json_safe

SIGMA = 5.670374419e-8

def estimated_longwave(t_k, vapour_hpa, cloud_fraction):
    """Brutsaert (1975) + cloud mixing, Ghausi et al. (2023), eqs 1,4,5.

    Using model cloud fraction rather than a solar-derived cloud proxy is an
    explicit analyst adaptation. Surface is a blackbody at air temperature;
    that open-reference-surface proxy is NOT a measured urban surface.
    """
    emissivity_clear = np.minimum(1, 1.24 * (np.maximum(vapour_hpa, 0) / t_k)**(1/7))
    cloud=np.clip(cloud_fraction,0,1)
    down=(cloud+(1-cloud)*emissivity_clear)*SIGMA*t_k**4
    up=SIGMA*t_k**4
    return down, down-up

def compute(raw, latitude, longitude, *, allow_estimated=None):
    h=raw['hourly'];n=len(h['time'])
    def arr(key): return np.asarray([np.nan if v is None else v for v in h.get(key,[None]*n)],dtype=float)
    t=arr('temperature_2m');rh=arr('relative_humidity_2m');dew=arr('dew_point_2m');wind=arr('wind_speed_10m')
    tk=t+273.15;dk=dew+273.15
    utc=pd.to_datetime(h['time'],unit='s',utc=True)
    # Instantaneous shortwave fields and instantaneous solar geometry share one time.
    solar=spa_python(utc,latitude,longitude)
    cos=np.clip(np.cos(np.radians(solar['zenith'].to_numpy())),0,1)
    ghi=arr('shortwave_radiation_instant');direct=arr('direct_radiation_instant')
    diffuse=arr('diffuse_radiation_instant');dni=arr('direct_normal_irradiance_instant')
    night=cos<=0
    for a in [ghi,direct,diffuse,dni]: a[night & (np.abs(a)<1e-6)]=0
    balance=np.abs(ghi-direct-diffuse)<=np.maximum(5,.05*np.abs(ghi))
    vapour=tf.calculate_saturation_vapour_pressure(tk)*rh/100
    enabled=read_config('methods.v1')['radiation']['enabled'] if allow_estimated is None else allow_estimated
    valid_inputs=np.isfinite(t)&np.isfinite(rh)&np.isfinite(wind)&np.isfinite(ghi)&np.isfinite(dni)&balance
    mrt=np.full(n,np.nan);utci=np.full(n,np.nan)
    flags=[[] for _ in range(n)]
    adjusted=np.maximum(wind,.5)
    if enabled:
        down,net=estimated_longwave(tk,vapour,arr('cloud_cover')/100)
        albedo=read_config('methods.v1')['radiation']['albedo']
        mrt=tf.calculate_mean_radiant_temperature(ghi,(1-albedo)*ghi,dni,down,direct,net,cos)-273.15
        valid=valid_inputs&np.isfinite(mrt)&(t>=-50)&(t<=50)&(wind<=17)&((mrt-t)>=-30)&((mrt-t)<=70)&(vapour<=50)
        utci=tf.calculate_utci(tk,adjusted,mrt+273.15,ehPa=vapour)-273.15
        utci[~valid]=np.nan;mrt[~valid_inputs]=np.nan
    # Full natural-wet-bulb and globe energy balance, not psychrometric substitution.
    fraction=np.divide(direct,ghi,out=np.zeros_like(ghi),where=ghi>0)
    wbgt=tf.calculate_wbgt_liljegren(tk,rh,arr('surface_pressure'),wind,ghi,fraction,cos)-273.15
    wbgt[~valid_inputs]=np.nan
    hi=tf.calculate_heat_index_adjusted(tk,dk)-273.15
    for i in range(n):
        if enabled: flags[i].extend(['ESTIMATED_LONGWAVE','AIR_TEMPERATURE_SURFACE_PROXY','REFERENCE_ALBEDO_0_20','APPROXIMATE_INDICES'])
        else: flags[i].append('MRT_RADIATION_GATE_UNAVAILABLE')
        if wind[i]<.5: flags[i].append('UTCI_WIND_FLOOR_0_5_MS')
        if wind[i]<.62: flags[i].append('WBGT_WIND_FLOOR_0_62_MS')
        if not balance[i]: flags[i].append('SHORTWAVE_BALANCE_FAILED')
        if not np.isfinite(utci[i]):flags[i].append('UTCI_UNAVAILABLE_OR_OUTSIDE_DOMAIN')
    result={'time':[x.isoformat().replace('+00:00','Z') for x in utc],
      't2m':t.tolist(),'rh':rh.tolist(),'dew_point':dew.tolist(),'wind':wind.tolist(),'utci_wind':adjusted.tolist(),
      'mrt':mrt.tolist(),'utci':utci.tolist(),'wbgt':wbgt.tolist(),'heat_index':hi.tolist(),
      'ghi':ghi.tolist(),'direct_horizontal':direct.tolist(),'diffuse_horizontal':diffuse.tolist(),'dni':dni.tolist(),
      'cos_solar_zenith':cos.tolist(),'quality_flags':flags,
      'units':{'t2m':'°C','rh':'%','dew_point':'°C','wind':'m/s','mrt':'°C','utci':'°C','wbgt':'°C','heat_index':'°C','ghi':'W/m²'},
      'radiation_method':'estimated' if enabled else 'unavailable','is_proxy':bool(enabled),'indices_quality':'approximate' if enabled else 'incomplete',
      'method_version':read_config('methods.v1')['version']}
    return json_safe(result)

def transform(raw, temperature_delta_c, relative_humidity_delta_pp, wind_multiplier):
    import copy
    changed=copy.deepcopy(raw);h=changed['hourly']
    t=np.asarray(h['temperature_2m'],float)+temperature_delta_c
    unclamped=np.asarray(h['relative_humidity_2m'],float)+relative_humidity_delta_pp
    rh=np.clip(unclamped,0,100)
    dew=tf.calculate_dew_point_from_relative_humidity(rh,t+273.15)-273.15
    h.update(temperature_2m=t.tolist(),relative_humidity_2m=rh.tolist(),dew_point_2m=dew.tolist(),wind_speed_10m=(np.asarray(h['wind_speed_10m'])*wind_multiplier).tolist())
    return changed,{'rh':int(np.sum(unclamped!=rh))}
