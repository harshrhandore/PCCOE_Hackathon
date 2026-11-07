# External reference fixtures

`thermofeel_testcases.csv`, `utci.csv`, `mrtr.csv`: ECMWF thermofeel tag 2.3.0, https://github.com/ecmwf/thermofeel/tree/2.3.0/tests, retrieved 2026-11-07, Apache-2.0. t2m/MRT/dew point and UTCI in K; wind in m/s. Official library reference values, not observed Pune weather. UTCI tolerance 1e-6 K. These are reference fixtures, never public forecast seeds.

NREL SPA: Reda & Andreas 2004 reference case, also in https://github.com/pvlib/pvlib-python/blob/main/tests/test_solarposition.py, retrieved 2026-11-07. Apparent zenith 50.11162 degrees, tolerance .0001 degree, unrounded calculation.

NWS chart example: https://www.weather.gov/ama/heatindex, 100 °F, RH 55%, chart 124 °F; tolerance 1.5 °F, retrieved 2026-11-07. CCOHS examples: https://www.ccohs.ca/oshanswers/phys_agents/heat/heat_control.html, component example 29.2 °C; weighted 26.75 °C is independently calculated from the published durations, not a quoted measured value.

Decimal longwave check: derived test vector from Ghausi et al. 2023 equations 1,4,5; T=303.15 K, e=20 hPa, f=.4; expected independently evaluated using 40-digit Decimal arithmetic, tolerance 1e-9 W/m². No measured-radiation accuracy claim is made.
