# Validation scope

Automated results belong in `reports/tests/` with actual command/environment. Thermal reference checks cover official ECMWF fixtures, independent pythermalcomfort combinations, published NWS/CCOHS examples, NREL solar geometry and independently evaluated longwave equations. They validate units/arithmetic and method agreement, not clinical or local radiation-model accuracy.

No fitted ML, health-outcome data, calibrated probabilities, SHAP model or validated uncertainty bands are present. ML selection requires genuine issued-forecast archives, chronological folds, held-out calibration/test periods, a five-day purge gap, lower multiclass Brier than the deterministic baseline, and no >.02 absolute worsening of Level≥3 recall.

Database migration replay, JWKS/session revocation in a real configured project, provider acknowledgement, native-language safety review, operational authorization and deployed scheduling are separate acceptance gates. Unit tests cannot stand in for them. Every skipped check must retain its reason.
