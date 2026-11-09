import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("real static bulletin, ward path, methods, mobile reflow and accessibility", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const hourlyRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("/hourly/"))
      hourlyRequests.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ward heat outlook", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: "All wards", exact: true }),
  ).toBeVisible();
  await page.locator("#ward-list").scrollIntoViewIfNeeded();
  await expect(page.locator(".ward-row").first()).toBeVisible();
  await page.locator(".ward-row").nth(1).click();
  await expect(page).toHaveURL(/ward=pune-2022-/);
  await expect(
    page.getByRole("button", { name: "Vulnerability", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Cooling refuges", exact: true }),
  ).toHaveCount(0);
  await page
    .getByText("Why this level? Methods & limits", { exact: true })
    .click();
  await page.getByText("Why this level", { exact: true }).click();
  await expect(page.getByText("UTCI_BASE", { exact: true })).toBeVisible();
  expect(hourlyRequests).toEqual([]);
  await page
    .getByText("Hour-by-hour thermal estimates", { exact: true })
    .click();
  await expect(
    page.getByRole("slider", { name: "Hourly UTCI timeline", exact: true }),
  ).toBeVisible();
  expect(hourlyRequests).toHaveLength(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
  await page.locator(".map-column").scrollIntoViewIfNeeded();
  await expect(page.locator(".map-ward")).toHaveCount(58);
  await page.screenshot({
    path: `../../reports/visual/overview-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const source = page.locator(".workspace-heading .source-chip");
  await source.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(source).toBeFocused();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = accessibility.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact || ""),
  );
  expect(serious).toEqual([]);
  await page
    .locator(".ward-context")
    .getByRole("link", { name: "Review ward & actions →" })
    .click();
  await expect(page).toHaveURL(/\/ward\/pune-2022-/);
  await page.reload();
  await expect(page.locator(".ward-detail-page")).toBeVisible();
  await page.goto("/methods");
  await expect(
    page.getByRole("heading", { name: "Methods & Data", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("ML not trained. The rule-based baseline is active.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("authority needs no account; local independent approval simulates only", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "tablet" || testInfo.project.name === "wide",
    "Authority primary path covered at 360 and 1280",
  );
  const staffRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /\/api\/v1\/(auth|session|alerts)(\/|$)/.test(
        new URL(request.url()).pathname,
      )
    )
      staffRequests.push(request.url());
  });
  await page.goto("/authority");
  await expect(page.getByText("LOCAL DEMO", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  if (testInfo.project.name === "phone") {
    await page.locator(".authority-mobile-list summary").first().click();
    await page
      .locator(".authority-mobile-list input[type=checkbox]")
      .first()
      .check();
  } else
    await page.locator(".authority-table input[type=checkbox]").first().check();
  await page
    .getByRole("button", { name: "Draft local Exercise preview", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Approve local revision" }),
  ).toBeDisabled();
  await page.getByLabel("Demo identity").selectOption("approver");
  await page.getByRole("button", { name: "Approve local revision" }).click();
  await page.getByRole("button", { name: "Simulate delivery" }).click();
  await expect(page.getByText("simulated · r1", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `../../reports/visual/authority-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Reset local preview", exact: true })
    .click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Draft local Exercise preview",
      exact: true,
    }),
  ).toBeDisabled();
  expect(staffRequests).toEqual([]);
});
test("invalid ward and unconfigured subscription remain honest", async ({
  page,
}) => {
  await page.goto("/ward/not-real");
  await expect(
    page.getByRole("heading", {
      name: "This ward is not in the selected boundary set.",
    }),
  ).toBeVisible();
  await page.goto("/subscribe");
  await expect(
    page.getByRole("heading", {
      name: "Alert delivery is unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to Telegram", exact: true }),
  ).toHaveCount(0);
});

test("ward detail keeps evidence optional and reflows with accessible actions", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Review ward & actions \u2192", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download planning brief", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("slider", { name: "Hourly UTCI timeline", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".technical-evidence")).not.toHaveAttribute("open");
  await expect(page.getByText("UTCI_BASE", { exact: true })).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    audit.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});
