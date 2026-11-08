import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Live local credentials are never embedded in source, traces or report bodies.
test.use({ trace: "off" });
test("real local staff approve and export an Exercise without Telegram or internet", async ({
  page,
}, info) => {
  test.skip(
    process.env.HEATGUARD_RUN_DB_TESTS !== "1",
    "Local database integration is explicitly enabled separately",
  );
  test.skip(
    !["phone", "desktop"].includes(info.project.name),
    "Real staff flow covered at 360 and 1280",
  );
  const saved = JSON.parse(
    readFileSync(
      resolve("../../data/raw/local/staff-credentials.json"),
      "utf8",
    ),
  );
  const officer = saved.accounts.find(
    (a: { role: string }) => a.role === "officer",
  );
  const approver = saved.accounts.find(
    (a: { role: string }) => a.role === "approver",
  );
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "onLine", { get: () => false }),
  );
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return ["127.0.0.1", "localhost"].includes(host)
      ? route.continue()
      : route.abort("internetdisconnected");
  });
  async function signIn(account: { email: string; password: string }) {
    await page.getByLabel("Authority email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    const signedIn = page.waitForResponse(
      (r) => r.url().endsWith("/auth/login") && r.request().method() === "POST",
    );
    const membership = page.waitForResponse((r) =>
      r.url().endsWith("/session"),
    );
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    expect((await signedIn).status()).toBe(200);
    expect((await membership).status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Authorized alert workspace" }),
    ).toBeVisible();
  }
  await page.goto(
    "/authority?mode=replay&episode=era5-2024-04-26&date=2024-04-26",
  );
  await signIn(officer);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  if (info.project.name === "phone") {
    await page.locator(".authority-mobile-list summary").first().click();
    await page
      .locator(".authority-mobile-list input[type=checkbox]")
      .first()
      .check();
  } else
    await page.locator(".authority-table input[type=checkbox]").first().check();
  await page
    .getByRole("checkbox", { name: /Keep drinking water available/ })
    .check();
  const createdEvent = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().endsWith("/alerts/draft"),
  );
  await page
    .getByRole("button", { name: "Submit for approval", exact: true })
    .click();
  const createdResponse = await createdEvent;
  expect(createdResponse.status()).toBe(201);
  const alert = (await createdResponse.json()).data.alert;
  expect(alert.is_simulation).toBe(true);
  await expect(
    page.getByRole("button", { name: "Approve this revision", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await signIn(approver);
  await page.getByRole("button", { name: new RegExp(alert.id) }).click();
  await page
    .getByRole("button", { name: "Approve this revision", exact: true })
    .click();
  await expect(
    page.getByText("Approval recorded. Delivery remains a separate action.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send test alert", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(/Telegram delivery is optional and disabled/),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download CAP XML", exact: true })
    .click();
  const downloaded = await downloadEvent;
  const content = readFileSync((await downloaded.path())!, "utf8");
  expect(content).toContain("<status>Exercise</status>");
  expect(content).toContain("<scope>Restricted</scope>");
  await page.getByRole("button", { name: "Cancel alert", exact: true }).click();
  await expect(
    page.getByText("Cancellation recorded. Audit evidence is retained.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
