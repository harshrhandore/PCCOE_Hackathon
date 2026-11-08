import { test, expect } from "@playwright/test";

test("saved bulletin, real calculation and replay survive external network loss", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "onLine", { get: () => false });
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname))
      return route.continue();
    return route.abort("internetdisconnected");
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Today in Pune", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ward-row").first()).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  const manifest = await (await page.request.get("/data/latest.json")).json();
  const geography = await (
    await page.request.get(`/data/${manifest.files["geography.json"].url}`)
  ).json();
  const calculation = await page.request.post("/api/v1/whatif", {
    data: {
      snapshot_id: manifest.snapshot_id,
      ward_ids: [geography.wards[0].id],
      temperature_delta_c: 0,
      relative_humidity_delta_pp: 0,
      wind_multiplier: 1,
    },
  });
  expect(calculation.ok()).toBe(true);
  const result = await calculation.json();
  expect(result.meta.is_simulation).toBe(true);
  expect(result.data.scenario).toHaveLength(5);
  expect(result.data.scenario.map((r: any) => r.risk_level)).toEqual(
    result.data.baseline.map((r: any) => r.risk_level),
  );
  await page.goto("/scenarios");
  await expect(
    page.getByRole("button", { name: "Compute what-if", exact: true }),
  ).toBeEnabled();
  await page.goto("/?mode=replay&episode=era5-2024-04-26&date=2024-04-26");
  await expect(page.locator(".ward-row").first()).toBeVisible();
  await expect(page.getByText(/SIMULATION/).first()).toBeVisible();
});
