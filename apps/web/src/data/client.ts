import { useQuery } from "@tanstack/react-query";
import type {
  Dataset,
  Manifest,
  FileEntry,
  Hourly,
  Geometry,
  Registry,
  Methods,
} from "./types";
const BASE = import.meta.env.VITE_DATA_BASE_URL || "/data";
let lastGood: Dataset | undefined;
export async function checkedJSON<T>(entry: FileEntry): Promise<T> {
  if (
    !/^(releases|replay)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+$/.test(entry.url) ||
    entry.url.includes("..")
  )
    throw new Error("Invalid snapshot path");
  const response = await fetch(`${BASE}/${entry.url}`);
  if (!response.ok) throw new Error("Snapshot file unavailable");
  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  if (hex !== entry.sha256) throw new Error("Snapshot checksum mismatch");
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
async function getManifest(url: string): Promise<Manifest> {
  const r = await fetch(`${BASE}/${url}`, { cache: "no-cache" });
  if (!r.ok) throw new Error("No published snapshot");
  const value = (await r.json()) as Manifest;
  if (
    value.schema_version !== "1.0.0" ||
    !value.files?.["forecast.json"] ||
    !value.meta?.dates?.length
  )
    throw new Error("Invalid snapshot manifest");
  return value;
}
export function useDataset(mode: string, episode: string | null) {
  return useQuery({
    queryKey: ["snapshot", mode, episode],
    queryFn: async (): Promise<Dataset> => {
      let manifest: Manifest,
        diagnostic = false;
      try {
        manifest = await getManifest(
          mode === "replay" && episode
            ? `replay/${episode}/latest.json`
            : "latest.json",
        );
      } catch (error) {
        if (mode === "replay") throw error;
        try {
          manifest = await getManifest("diagnostic.json");
          diagnostic = true;
        } catch {
          if (lastGood) return { ...lastGood, updateError: true };
          throw error;
        }
      }
      try {
        const [forecast, registry, methods] = await Promise.all([
          checkedJSON<{
            daily: Dataset["daily"];
            dates: string[];
            ward_count: number;
          }>(manifest.files["forecast.json"]),
          checkedJSON<Registry>(manifest.files["geography.json"]),
          checkedJSON<Methods>(manifest.files["methods.json"]),
        ]);
        const ids = new Set(registry.wards.map((w) => w.id));
        if (
          ids.size !== registry.ward_count ||
          registry.ward_count !== manifest.meta.ward_count ||
          methods.version !== manifest.method_version
        )
          throw new Error("Snapshot version or count mismatch");
        for (const date of manifest.meta.dates) {
          const rows = forecast.daily.filter((d) => d.date === date);
          if (
            rows.length !== ids.size ||
            new Set(rows.map((d) => d.ward_id)).size !== ids.size ||
            rows.some(
              (d) =>
                !ids.has(d.ward_id) ||
                (d.risk_level !== null &&
                  (d.hazard_level === null || d.risk_level < d.hazard_level)),
            )
          )
            throw new Error("Invalid ward join");
        }
        const result = {
          manifest,
          registry,
          daily: forecast.daily,
          methods,
          diagnostic,
        };
        if (mode === "live") lastGood = result;
        return result;
      } catch (error) {
        if (lastGood && mode === "live")
          return { ...lastGood, updateError: true };
        throw error;
      }
    },
    retry: 1,
    staleTime: 60000,
    refetchInterval: 180000,
  });
}
export function useHourly(data: Dataset, ward: string | undefined) {
  return useQuery({
    queryKey: ["hourly", data.manifest.snapshot_id, ward],
    enabled: !!ward && !!data.manifest.files[`hourly/${ward}.json`],
    queryFn: () =>
      checkedJSON<Hourly>(data.manifest.files[`hourly/${ward}.json`]),
    staleTime: Infinity,
    retry: 1,
  });
}
export function useGeometry(data: Dataset) {
  return useQuery({
    queryKey: ["geometry", data.manifest.files["wards.geojson"].sha256],
    queryFn: () => checkedJSON<Geometry>(data.manifest.files["wards.geojson"]),
    staleTime: Infinity,
    retry: 1,
  });
}
export async function api<T>(
  path: string,
  body?: unknown,
  token?: string,
  method?: string,
): Promise<T> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}${path}`,
    {
      method: method || (body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(body ? { "Idempotency-Key": crypto.randomUUID() } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message_key || "state.waking");
  return result.data as T;
}
