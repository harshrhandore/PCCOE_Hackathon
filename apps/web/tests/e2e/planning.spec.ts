import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("planner retains ward/date, exports a sourced brief and computes only the requested ward", async ({
  page,
}, info) => {
  test.skip(
    !["phone", "desktop"].includes(info.project.name),
    "Primary planning journey at 360 and 1280",
  );
  const manifest = await (await page.request.get("/data/latest.json")).json();
  const registry = await (
    await page.request.get(`/data/${manifest.files["geography.json"].url}`)
  ).json();
  const ward = registry.wards[2];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const dates = [...manifest.meta.dates].sort();
  const expectedDate =
    dates.find((d: string) => d >= today) || dates[dates.length - 1];
  const staffRequests: string[] = [];
  page.on("request", (r) => {
    if (
      /\/api\/v1\/(auth|session|alerts|subscriptions)(\/|$)/.test(
        new URL(r.url()).pathname,
      )
    )
      staffRequests.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator(".global-nav > a")).toHaveCount(3);
  await page.getByLabel("Planning ward", { exact: true }).selectOption(ward.id);
  const review = page.getByRole("link", {
    name: "Review ward & actions →",
    exact: true,
  });
  await expect(review).toHaveAttribute(
    "href",
    new RegExp(`date=${expectedDate}`),
  );
  if (info.project.name === "phone")
    expect((await review.boundingBox())!.y).toBeLessThan(800);
  await review.click();
  await expect(
    page.getByRole("heading", { name: ward.name_en, exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download planning brief", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: `../../reports/visual/planning-brief-${info.project.name}.png`,
    fullPage: true,
  });
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download planning brief", exact: true })
    .click();
  const brief = await readFile((await (await downloadEvent).path())!, "utf8");
  expect(brief).toContain(ward.id);
  expect(brief).toContain(expectedDate);
  expect(brief).toContain(manifest.snapshot_id);
  expect(brief).toContain(
    "Population vulnerability and allocation priority unavailable",
  );
  expect(brief).toContain("action library");
  expect(brief).toContain("not an official warning");
  await page
    .getByRole("link", { name: "Plan outdoor work →", exact: true })
    .click();
  await expect(page.getByLabel("Choose a ward", { exact: true })).toHaveValue(
    ward.id,
  );
  await expect(page).toHaveURL(new RegExp(`date=${expectedDate}`));
  await page.goto(`/scenarios?ward=${ward.id}&date=${expectedDate}`);
  await expect(page.getByLabel("Comparison ward", { exact: true })).toHaveValue(
    ward.id,
  );
  let computations = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/whatif")) computations++;
  });
  await page.getByLabel("Air temperature change numeric value").fill("1");
  await page.waitForTimeout(450);
  expect(computations).toBe(0);
  const requested = page.waitForRequest((r) => r.url().endsWith("/whatif"));
  await page
    .getByRole("button", { name: "Compute what-if", exact: true })
    .click();
  expect((await requested).postDataJSON().ward_ids).toEqual([ward.id]);
  await expect(
    page.getByRole("heading", { name: "Computed comparison", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  expect(staffRequests).toEqual([]);
});

test("evidence audit and guided historical case expose limits without unavailable feature controls", async ({
  page,
}, info) => {
  test.skip(
    !["phone", "desktop"].includes(info.project.name),
    "Evidence and case study at 360 and 1280",
  );
  await page.goto("/subscribe");
  await expect(
    page.getByRole("heading", { name: "Alert delivery is unavailable" }),
  ).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await page.goto("/methods");
  await expect(
    page.getByRole("button", { name: "Equal weights", exact: true }),
  ).toHaveCount(0);
  await page
    .getByText("Classification and spatial-coverage audit", { exact: true })
    .click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download evidence summary", exact: true })
    .click();
  const evidence = JSON.parse(
    await readFile((await (await downloadEvent).path())!, "utf8"),
  );
  expect(evidence.days).toHaveLength(5);
  expect(evidence.days[0].cells).toBeGreaterThan(0);
  expect(evidence.validation.user_study).toBe("not completed");
  await page.goto("/presenter");
  await page
    .getByRole("link", { name: "Start the historical case", exact: true })
    .click();
  await expect(page).toHaveURL(/mode=replay/);
  await expect(page.locator(".simulation-banner")).toContainText("Replay");
  await page.locator("#ward-list").scrollIntoViewIfNeeded();
  await expect(page.locator(".ward-row")).toHaveCount(58);
});
