import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def read_config(name):
    return json.loads((ROOT / 'config' / f'{name}.json').read_text(encoding='utf8'))

def methods():
    return {**read_config('methods.v1'), 'weights': read_config('weights.v1'),
            'actions_version': '1.0.0', 'source_catalog': read_config('sources'),
            'validation': {'ml': 'not_trained', 'clinical': 'not_performed'},
            'limitations': ['Prototype rule — not locally health-validated.',
                'Ward-level risk on grid-resolution weather.',
                'Candidate refuges are not official PMC cooling centres.']}
