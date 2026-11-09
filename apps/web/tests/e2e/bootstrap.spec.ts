import { test, expect } from "@playwright/test";

test("local document embeds the selected snapshot while browser integrity checks remain active", async ({
  page,
}, info) => {
  test.skip(
    !["phone", "desktop"].includes(info.project.name),
    "Transport integrity at 360 and 1280",
  );
  const critical: string[] = [];
  page.on("request", (r) => {
    if (
      /\/data\/(latest\.json|(?:releases|replay)\/.*\/(?:forecast|geography|methods)\.json)$/.test(
        new URL(r.url()).pathname,
      )
    )
      critical.push(r.url());
  });
  await page.goto("/");
  await expect(page.getByLabel("Planning ward", { exact: true })).toBeVisible();
  expect(critical).toEqual([]);
  await page.goto("/?mode=replay&episode=era5-2024-04-26&date=2024-04-26");
  await expect(page.locator(".simulation-banner")).toContainText("Replay");
  await expect(page.getByLabel("Planning ward", { exact: true })).toBeVisible();
  expect(critical).toEqual([]);
  let forged = false;
  await page.route("http://127.0.0.1:8081/", async (route) => {
    const response = await route.fetch();
    let html = await response.text();
    html = html.replace(
      /(<script type="application\/json" id="heatguard-bootstrap">)(.*?)(<\/script>)/s,
      (_, start, raw, end) => {
        const payload = JSON.parse(raw);
        const forecast = JSON.parse(payload.files["forecast.json"]);
        forecast.daily.forEach((r: any) => (r.peak_utci = 999.9));
        payload.files["forecast.json"] = JSON.stringify(forecast);
        forged = true;
        return start + JSON.stringify(payload).replaceAll("<", "\\u003c") + end;
      },
    );
    const headers = response.headers();
    delete headers["content-encoding"];
    delete headers["content-length"];
    await route.fulfill({ response, body: html, headers });
  });
  await page.goto("/");
  await expect(page.getByLabel("Planning ward", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  expect(forged).toBe(true);
  expect(critical.length).toBeGreaterThan(0); // retry fetched the real, verified files
  await expect(page.getByText(/999\.9/)).toHaveCount(0);
});
