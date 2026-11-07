export type Level = 0 | 1 | 2 | 3 | 4 | null;
export type Mode = "live" | "replay" | "whatif";
export interface Source {
  source_id: string;
  url: string;
  vintage?: string;
  licence?: string;
  is_proxy?: boolean;
  quality_flags?: string[];
  method_version?: string;
}
export interface Ward {
  id: string;
  source_ward_id: string;
  name_en: string;
  name_mr: string | null;
  boundary_version: string;
  area_km2: number;
  centroid: [number, number];
  weather_point: [number, number];
  provenance: Source;
}
export interface Registry {
  wards: Ward[];
  ward_count: number;
  vintage: string;
  bounds: [number, number, number, number];
  centre: [number, number];
  boundary_version: string;
  definition: string;
  licence: string;
  source_url: string;
}
export interface Rule {
  id: string;
  status: "fired" | "not_fired" | "unknown";
  inputs: Record<string, unknown>;
  threshold: unknown;
  method_version: string;
}
export interface Daily {
  ward_id: string;
  date: string;
  base_level: Level;
  hazard_level: Level;
  risk_level: Level;
  risk_basis: string;
  priority_score: number | null;
  vulnerability: number | null;
  top_quintile: boolean | null;
  vulnerability_coverage: number;
  peak_utci: number | null;
  peak_wbgt: number | null;
  tmax: number | null;
  peak_heat_index: number | null;
  peak_utci_time: string | null;
  night_min_t: number | null;
  night_threshold: number | null;
  night_period: { start: string; end: string } | null;
  imd_flag: string;
  hazard_rule_fired: Rule[];
  modifier_status: string;
  quality_flags: string[];
  p_ge_3: number | null;
  radiation_method: string;
  indices_quality: string;
  source_grid: {
    latitude: number;
    longitude: number;
    elevation: number | null;
  };
  completeness: Record<string, boolean>;
}
export interface Meta {
  snapshot_id: string;
  issued_at: string;
  fetched_at: string;
  model_run: string | null;
  model_id: string;
  git_sha: string;
  data_git_sha: string;
  is_simulation: boolean;
  mode: Mode;
  method_version: string;
  boundary_version: string;
  schema_version: string;
  dates: string[];
  ward_count: number;
  publication_health: string;
  quality_flags: string[];
  episode?: {
    id: string;
    start: string;
    end: string;
    selection_method: string;
  } | null;
  data_vintage: Record<string, string>;
}
export interface FileEntry {
  url: string;
  sha256: string;
  bytes: number;
  gzip_bytes: number;
}
export interface Manifest {
  snapshot_id: string;
  schema_version: string;
  method_version: string;
  meta: Meta;
  files: Record<string, FileEntry>;
}
export interface Hourly {
  time: string[];
  t2m: (number | null)[];
  rh: (number | null)[];
  dew_point: (number | null)[];
  wind: (number | null)[];
  mrt: (number | null)[];
  utci: (number | null)[];
  wbgt: (number | null)[];
  heat_index: (number | null)[];
  quality_flags: string[][];
  radiation_method: string;
  indices_quality: string;
  units: Record<string, string>;
}
export interface Methods {
  version: string;
  utci: { upper_endpoints_c: number[]; names: string[] };
  night: Record<string, unknown>;
  formulas: Record<string, string>;
  weights: {
    components: { id: string; weight: number; group: string; unit: string }[];
  };
  radiation: Record<string, unknown>;
  source_catalog: {
    id: string;
    title: string;
    url: string;
    licence?: string;
    vintage?: string;
  }[];
  worker_screening: {
    unacclimatized: Record<string, number>;
    acclimatized: Record<string, number>;
    source: string;
  };
  limitations: string[];
  validation: Record<string, string>;
}
export interface Dataset {
  manifest: Manifest;
  registry: Registry;
  daily: Daily[];
  methods: Methods;
  diagnostic: boolean;
  updateError?: boolean;
}
export type Geometry = GeoJSON.FeatureCollection<
  GeoJSON.MultiPolygon,
  { id: string; name_en: string }
>;
