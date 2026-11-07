"""Explicit complete-cohort join; absent source data stays null."""
from .io import ROOT,read_json,write_json
from .heatguard_core.vulnerability import compute_cohort

def prepare(path=None):
    registry=read_json(ROOT/'data/processed/ward-manifest.json')
    source=read_json(path) if path else []
    by_id={x['ward_id']:x for x in source}
    if len(by_id)!=len(source) or set(by_id)-{w['id'] for w in registry['wards']}:raise ValueError('Duplicate or unknown feature ward IDs')
    rows=[{'ward_id':w['id'],**by_id.get(w['id'],{})} for w in registry['wards']]
    result={'version':'1.0.0','boundary_version':registry['boundary_version'],'cohort_id':'pune-electoral-2022-complete','wards':compute_cohort(rows),
      'raw':rows,'warning':'No verified demographic crosswalk or complete adaptive-capacity cohort has been acquired. Vulnerability unavailable; no synthetic values substituted.'}
    write_json(ROOT/'data/processed/features.json',result);return result
if __name__=='__main__':prepare()
