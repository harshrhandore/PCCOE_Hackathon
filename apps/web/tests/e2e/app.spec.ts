import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("real static bulletin, ward path, methods, mobile reflow and accessibility", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Today in Pune", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: "Ward watch", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ward-row").first()).toBeVisible();
  await page.locator(".ward-row").nth(1).click();
  await expect(page).toHaveURL(/ward=pune-2022-/);
  await page.getByRole("button", { name: "Hazard", exact: true }).click();
  await expect(page).toHaveURL(/layer=hazard/);
  await page.getByText("Why this level", { exact: true }).click();
  await expect(page.getByText("UTCI_BASE", { exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({
    path: `../../reports/visual/overview-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = accessibility.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact || ""),
  );
  expect(serious).toEqual([]);
  await page
    .locator(".ward-context")
    .getByRole("link", { name: "Full ward bulletin →" })
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
test("authority is gated; explicit local independent approval simulates only", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "tablet" || testInfo.project.name === "wide",
    "Authority primary path covered at 360 and 1280",
  );
  await page.goto("/authority");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Local demo — no messages sent.",
      exact: true,
    })
    .click();
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
    page.getByRole("heading", { name: "Subscribe", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Consent comes before delivery.", { exact: true }),
  ).toBeVisible();
});
