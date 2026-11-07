# Frozen local-night baseline

1991–2020 ERA5 hourly temperatures are acquired by verified actual upstream grid cell, chunked by year and cached. Coordinates are ward representative-point samples, labelled centroid/grid proxies rather than polygon-area normals. Source model, returned grid/elevation and retrieval metadata are retained. No current forecast is used to fill historical gaps.

Daily Tmax requires one finite source value in each local-hour bin, 00–23 IST. N(D) uses the actual ten samples whose containing bins fall in [D 20:00, D+1 06:00); an hourly UTC source therefore generally contributes 20:30–05:30 IST samples.

Exclude February 29 during fitting. For each of 365 calendar days, collect five centered calendar days across the 30 baseline years, wrapping the calendar. Require at least 135 of 150 complete nights. Apply NumPy linear quantile .90. Interpolate February 29 from its adjacent climatological dates. Daily Tmax normals use the same centered window and completeness threshold. Unknown thresholds propagate unknown night modifiers and block live delivery.

The baseline is climatological, not a Pune health-outcome calibration. ETCCDI TN90p is precedent only; its daily minimum definition is different from this prototype's night interval. Equal thresholds do not count as hot nights. See `pipeline/build_climatology.py` and generated coverage arrays. No baseline acquisition is claimed until `data/processed/climatology.json` exists with actual coverage.
