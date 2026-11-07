def adjusted_risk(hazard, vulnerability=None, top_quintile=None):
    bump = int(hazard is not None and hazard >= 2 and bool(top_quintile)) if vulnerability is not None else 0
    return {'risk_level': None if hazard is None else min(4,hazard+bump),
            'risk_basis':'unavailable' if hazard is None else 'hazard_only' if vulnerability is None else 'vulnerability_adjusted',
            'priority_score':None if hazard is None or vulnerability is None else 100*(hazard/4)*(.5+.5*vulnerability)}

def ranking_key(record):
    def value(key): return record[key] if record.get(key) is not None else float('-inf')
    return (-value('risk_level'),-value('priority_score'),-value('peak_utci'),record['ward_id'])
