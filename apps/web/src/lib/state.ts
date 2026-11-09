import { create } from "zustand";
import { persist } from "zustand/middleware";
type Preferences = {
  lang: string;
  density: string;
  ward: string | null;
  set: (key: "lang" | "density" | "ward", value: string) => void;
};
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      lang: "en",
      density: "comfortable",
      ward: null,
      set: (key, value) => set({ [key]: value }),
    }),
    {
      name: "heatguard-preferences",
      partialize: (s) => ({ lang: s.lang, density: s.density, ward: s.ward }),
    },
  ),
);
export function number(value: number | null | undefined, digits = 1) {
  return value === null || value === undefined ? "—" : value.toFixed(digits);
}
export function dateLabel(day: string, lang = "en") {
  let formatter = dateFormatters.get(lang);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(lang, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
    dateFormatters.set(lang, formatter);
  }
  return formatter.format(new Date(`${day}T06:30:00Z`));
}
export function timeLabel(instant: string | null | undefined, lang = "en") {
  if (!instant) return "\u2014";
  let formatter = timeFormatters.get(lang);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(lang, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    timeFormatters.set(lang, formatter);
  }
  return formatter.format(new Date(instant));
}
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const timeFormatters = new Map<string, Intl.DateTimeFormat>();
const localPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});
export function localParts(instant: string) {
  const p = localPartsFormatter.formatToParts(new Date(instant));
  const get = (k: string) => p.find((x) => x.type === k)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}
export function validatedParams(
  params: URLSearchParams,
  dates: string[],
  ids: string[],
  now = new Date(),
) {
  const today = localParts(now.toISOString()).date;
  const ordered = [...dates].sort();
  const defaultDate =
    params.get("mode") === "replay"
      ? ordered[0]
      : ordered.find((day) => day >= today) || ordered[ordered.length - 1];
  return {
    mode: ["live", "replay", "whatif"].includes(params.get("mode") || "")
      ? params.get("mode")!
      : "live",
    date: dates.includes(params.get("date") || "")
      ? params.get("date")!
      : defaultDate,
    hour: /^(?:[01]?\d|2[0-3])$/.test(params.get("t") || "")
      ? Number(params.get("t"))
      : 14,
    ward: ids.includes(params.get("ward") || "") ? params.get("ward") : null,
    layer: ["risk", "hazard", "vulnerability", "refuges"].includes(
      params.get("layer") || "",
    )
      ? params.get("layer")!
      : "hazard",
    lang: ["en", "hi", "mr"].includes(params.get("lang") || "")
      ? params.get("lang")!
      : "en",
  };
}
export function csvCell(value: unknown) {
  const s = String(value ?? "");
  return `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
}
export function download(filename: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
