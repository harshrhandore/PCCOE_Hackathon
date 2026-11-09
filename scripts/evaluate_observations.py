"""Descriptive agreement with supplied references; never a forecast-skill claim."""
import argparse
import csv
import datetime as dt
import json
import math
from pathlib import Path

VARIABLES = {"air_temperature": ("t2m", "degC", "\u00b0C"), "relative_humidity": ("rh", "%", "%"), "reference_wbgt": ("wbgt", "degC", "\u00b0C")}
FIELDS = {"ward_id", "time_utc", "variable", "observed_value", "unit", "reference_source", "measurement_method", "permission_reference"}


def instant(value):
    result = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("Every reference timestamp requires an explicit timezone")
    return result.astimezone(dt.timezone.utc)


def read_observations(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not FIELDS <= set(reader.fieldnames or []):
            raise ValueError("Observation CSV is missing required columns")
        rows, seen = [], set()
        for line, raw in enumerate(reader, 2):
            row = {key: (raw.get(key) or "").strip() for key in FIELDS}
            if not all(row.values()):
                raise ValueError(f"Missing reference metadata on line {line}")
            if row["variable"] not in VARIABLES or row["unit"] != VARIABLES[row["variable"]][1]:
                raise ValueError(f"Unsupported variable or unit on line {line}")
            value = float(row["observed_value"])
            if not math.isfinite(value):
                raise ValueError(f"Non-finite reference value on line {line}")
            if row["variable"] == "relative_humidity" and not 0 <= value <= 100:
                raise ValueError(f"Humidity outside 0-100 percent on line {line}")
            when = instant(row["time_utc"])
            key = (row["ward_id"], when, row["variable"])
            if key in seen:
                raise ValueError(f"Duplicate ward/time/variable on line {line}")
            seen.add(key)
            rows.append({**row, "time": when, "value": value})
    if not rows:
        raise ValueError("No observations supplied; the blank template contains no evidence")
    return rows


def compare(manifest, file, observations):
    ids = {w["id"] for w in file("geography.json")["wards"]}
    cache, pairs, unmatched = {}, [], []
    published = instant(manifest["meta"]["issued_at"])
    for row in observations:
        ward = row["ward_id"]
        if ward not in ids:
            raise ValueError("Reference ward is not in the snapshot boundary registry")
        if ward not in cache:
            hourly = file(f"hourly/{ward}.json")
            cache[ward] = (hourly, {instant(time): i for i, time in enumerate(hourly["time"])})
        hourly, indices = cache[ward]
        field, _, expected_unit = VARIABLES[row["variable"]]
        if hourly.get("units", {}).get(field) != expected_unit:
            raise ValueError("Snapshot units do not match the observation variable")
        index = indices.get(row["time"])
        predicted = None if index is None else hourly[field][index]
        if predicted is None or not math.isfinite(predicted):
            unmatched.append({"ward_id": ward, "time_utc": row["time"].isoformat(), "variable": row["variable"], "reason": "no exact valid sample"})
            continue
        pairs.append({"ward_id": ward, "time_utc": row["time"].isoformat(), "variable": row["variable"],
                      "model_value": predicted, "reference_value": row["value"], "difference": predicted-row["value"],
                      "publication_lead_hours": (row["time"]-published).total_seconds()/3600,
                      "reference_source": row["reference_source"], "measurement_method": row["measurement_method"],
                      "permission_reference": row["permission_reference"]})
    if not pairs:
        raise ValueError("No exact time-matched valid pairs; no metrics produced")
    metrics = {}
    for variable in VARIABLES:
        differences = [p["difference"] for p in pairs if p["variable"] == variable]
        if differences:
            n = len(differences)
            metrics[variable] = {"pairs": n, "unit": VARIABLES[variable][1], "bias": sum(differences)/n,
                                 "mae": sum(abs(x) for x in differences)/n, "rmse": math.sqrt(sum(x*x for x in differences)/n)}
    return {"snapshot_id": manifest["snapshot_id"], "mode": manifest["meta"]["mode"],
            "scope": "Descriptive agreement with supplied references. Reference independence, quality and representativeness require human review. Pairs may be dependent across shared cells.",
            "forecast_skill_evaluated": False, "health_benefit_evaluated": False,
            "warning": "Publication lead is not model initialization lead. Reanalysis and pre-publication samples cannot establish as-issued forecast skill. Reference WBGT requires documented instrumentation and comparable exposure.",
            "metrics": metrics, "pairs": pairs, "unmatched": unmatched}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot-id", required=True)
    parser.add_argument("--observations", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    # Reuse immutable manifest/path/hash verification; no acquisition or DB access.
    from services.api.app.snapshots import load
    manifest, file = load(args.snapshot_id)
    result = compare(manifest, file, read_observations(args.observations))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, allow_nan=False)+"\n", encoding="utf-8")
    print(f"Compared {len(result['pairs'])} supplied reference pairs. No forecast-skill or health-benefit claim.")


if __name__ == "__main__":
    main()
