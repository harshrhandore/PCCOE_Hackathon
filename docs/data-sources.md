# Data sources and acquisition status

- Boundaries: DataMeet Pune 2022 electoral prabhags, 58 actual validated polygons, zero repairs. Historical geography; not claimed current. Source URL, SHA-256, representative points and computed UTM 43N areas are in data/processed/ward-manifest.json. Pune folder CC BY-SA 2.5 India; upstream 2022 additionally MIT.
- Forecast: actual Open-Meteo best_match data; original source units retained under ignored data/raw. Grid-resolution estimates, model initialization unavailable. Derived indices carry approximate radiation/surface flags.
- Climatology: 1991?2020 ERA5 acquisition is recorded in reports/climatology-run.log. Acceptance requires completed processed coverage arrays; no forecast is used to fill missing baseline values.
- Replay: five-complete-year ERA5 scan script implemented; no episode is claimed until the scan completes and generated catalog exists.
- Demographics/land cover/refuges: verified spatial crosswalk and complete comparable feature cohort not acquired. Values remain null. No invented census statistics, facility availability or proxy counts.

Contains modified Copernicus Climate Change Service information 2026. Neither the European Commission nor ECMWF is responsible for any use that may be made of the Copernicus information or data it contains. ERA5 hourly single levels, DOI https://doi.org/10.24381/cds.adbb2d47, accessed through Open-Meteo; temperature-derived baseline calculations modify the source. Licence evidence: https://ecds.ecmwf.int/licences/licence-to-use-copernicus-products.
