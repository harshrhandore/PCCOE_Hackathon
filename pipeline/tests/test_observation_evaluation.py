"""Synthetic arithmetic/transport fixtures only, not real validation evidence."""
import csv
import pytest
from scripts.evaluate_observations import read_observations, compare, FIELDS


def write(path, rows):
    with path.open("w", newline="", encoding="utf8") as stream:
        writer=csv.DictWriter(stream, fieldnames=sorted(FIELDS));writer.writeheader();writer.writerows(rows)


def row(**changes):
    return {"ward_id":"fixture-ward", "time_utc":"2026-01-01T01:00:00Z", "variable":"air_temperature",
            "observed_value":"30", "unit":"degC", "reference_source":"synthetic arithmetic fixture",
            "measurement_method":"not a measurement", "permission_reference":"test fixture", **changes}


@pytest.mark.parametrize("rows", [[], [row(),row(time_utc="2026-01-01T06:30:00+05:30")],
    [row(observed_value="NaN")], [row(unit="K")], [row(time_utc="2026-01-01T01:00:00")], [row(reference_source="")]])
def test_invalid_or_empty_reference_files_never_produce_evidence(tmp_path,rows):
    path=tmp_path/"fixture.csv";write(path,rows)
    with pytest.raises(ValueError):read_observations(path)


def test_exact_matching_metrics_and_reanalysis_scope(tmp_path):
    path=tmp_path/"fixture.csv";write(path,[row(),row(time_utc="2026-01-01T02:00:00Z",observed_value="34"),row(time_utc="2026-01-01T03:00:00Z")])
    manifest={"snapshot_id":"synthetic-fixture", "meta":{"issued_at":"2026-01-02T00:00:00Z","mode":"replay"}}
    def file(name):
        return {"wards":[{"id":"fixture-ward"}]} if name=="geography.json" else {"time":["2026-01-01T01:00:00Z","2026-01-01T02:00:00Z"],"t2m":[32,32],"units":{"t2m":"\u00b0C"}}
    result=compare(manifest,file,read_observations(path))
    assert result["metrics"]["air_temperature"]=={"pairs":2,"unit":"degC","bias":0,"mae":2,"rmse":2}
    assert len(result["unmatched"])==1 and result["pairs"][0]["publication_lead_hours"]<0
    assert result["forecast_skill_evaluated"] is False and result["health_benefit_evaluated"] is False
