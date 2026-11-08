import { test, expect } from "@playwright/test";

test("server authority UI binds approval, prevents self-approval and stops unknown retries", async ({
  page,
}, info) => {
  test.skip(
    !["phone", "desktop"].includes(info.project.name),
    "Primary authority contracts covered at 360 and 1280",
  );
  const officer = "00000000-0000-4000-8000-000000000010";
  const reviewer = "00000000-0000-4000-8000-000000000020";
  let alert: any = null;
  let revoked = false;
  const writes: { path: string; body: any; key?: string }[] = [];
  // Explicit UI contract fixture: no real accounts, database or messages.
  await page.route("**/data/latest.json", async (route) => {
    const response = await route.fetch();
    const value = await response.json();
    value.meta.issued_at = new Date().toISOString();
    value.meta.quality_flags.push("SYNTHETIC_CONTRACT_EXAMPLE");
    await route.fulfill({ response, json: value });
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    const body = request.method() === "GET" ? null : request.postDataJSON();
    const user = request.headers().authorization?.includes("reviewer")
      ? reviewer
      : officer;
    const answer = (data: any, status = 200) =>
      route.fulfill({
        status,
        json: {
          data,
          meta: {
            is_simulation: true,
            quality_flags: ["SYNTHETIC_CONTRACT_EXAMPLE"],
          },
        },
      });
    if (path === "/auth/login")
      return answer({
        access_token: body.email.includes("reviewer")
          ? "fixture-reviewer-token"
          : "fixture-officer-token",
        expires_in: 3600,
      });
    if (path === "/auth/logout") return answer({ signed_out: true });
    if (path === "/health")
      return answer({ optional_channels: { telegram: "test_configured" } });
    if (revoked)
      return route.fulfill({
        status: 403,
        json: {
          data: null,
          error: { code: "FORBIDDEN", message_key: "state.forbidden" },
        },
      });
    if (path === "/session")
      return answer({
        user_id: user,
        role: user === reviewer ? "approver" : "officer",
      });
    if (path === "/alerts" && request.method() === "GET")
      return answer({ items: alert ? [alert] : [], next_cursor: null });
    if (path === "/alerts/draft") {
      writes.push({ path, body, key: request.headers()["idempotency-key"] });
      alert = {
        id: "00000000-0000-4000-8000-000000000001",
        status: "draft",
        revision: 1,
        created_by: officer,
        approved_by: null,
        content_sha256: "a".repeat(64),
        snapshot_id: body.snapshot_id,
        ward_ids: body.ward_ids,
        audience: body.audience,
        languages: body.languages,
        risk_level: body.risk_level,
        expires_at: body.expires,
        created_at: new Date().toISOString(),
        cap_status: "Test",
        is_simulation: false,
        delivery_summary: {},
        content: {
          text: "TEST — UI CONTRACT FIXTURE ONLY. No messages sent.",
          instructions: "Fixture only.",
          method_version: "1.0.0",
          snapshot_issued_at: new Date().toISOString(),
          draft_request: body,
        },
      };
      return answer({ alert }, 201);
    }
    if (path.endsWith("/approve")) {
      writes.push({ path, body });
      expect(body).toEqual({
        expected_revision: 1,
        content_sha256: "a".repeat(64),
      });
      expect(user).toBe(reviewer);
      alert = { ...alert, status: "approved", approved_by: reviewer };
      return answer({ alert });
    }
    if (path.endsWith("/send")) {
      writes.push({ path, body });
      expect(body).toEqual({ expected_revision: 1, delivery_mode: "test" });
      alert = { ...alert, delivery_summary: { unknown: 1 } };
      return answer(
        { alert_id: alert.id, status: "approved", deliveries: { unknown: 1 } },
        202,
      );
    }
    if (path.endsWith("/cap.xml"))
      return route.fulfill({
        contentType: "application/cap+xml",
        body: "<fixture>UI transport only; official CAP validation is tested in pytest.</fixture>",
      });
    if (path.endsWith("/audit"))
      return answer({
        items: [
          {
            event: "fixture_draft",
            created_at: new Date().toISOString(),
            after_state: { revision: 1 },
          },
        ],
      });
    if (path === `/alerts/${alert?.id}`) return answer({ alert });
    return answer(null, 404);
  });
  async function signIn(name: string) {
    await page.getByLabel("Authority email").fill(`${name}@test.invalid`);
    await page
      .getByLabel("Password", { exact: true })
      .fill("fixture-password-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Authorized alert workspace" }),
    ).toBeVisible();
  }
  await page.goto("/authority");
  await signIn("officer");
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
  await page
    .getByRole("button", { name: "Submit for approval", exact: true })
    .click();
  await expect(
    page.getByText("TEST — UI CONTRACT FIXTURE ONLY. No messages sent.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve this revision", exact: true }),
  ).toBeDisabled();
  expect(writes[0].body.action_ids).toEqual(["citizen_water"]);
  expect(writes[0].key).toBeTruthy();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await signIn("reviewer");
  await page.getByRole("button", { name: /Test · draft · r1/ }).click();
  await page
    .getByRole("button", { name: "Approve this revision", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send test alert", exact: true }),
  ).toBeEnabled();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download CAP XML", exact: true })
    .click();
  expect((await downloadEvent).suggestedFilename()).toContain("-r1.xml");
  await page
    .getByRole("button", { name: "Send test alert", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send test alert", exact: true }),
  ).toBeDisabled();
  await expect(
    page.locator(".alert-composer dt").filter({ hasText: "unknown" }),
  ).toBeVisible();
  expect(writes.filter((w) => w.path.endsWith("/send"))).toHaveLength(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  revoked = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

test("what-if comparison retains explicit simulation and exact returned inputs", async ({
  page,
}, info) => {
  test.skip(
    !["phone", "desktop"].includes(info.project.name),
    "Primary comparison UI covered at 360 and 1280",
  );
  const manifest = await (await page.request.get("/data/latest.json")).json();
  const forecast = await (
    await page.request.get("/data/" + manifest.files["forecast.json"].url)
  ).json();
  await page.route("**/api/v1/whatif", async (route) => {
    const input = route.request().postDataJSON();
    const scenario = forecast.daily.map((r: any) => ({
      ...r,
      risk_level: r.risk_level === null ? null : Math.min(4, r.risk_level + 1),
      peak_utci:
        r.peak_utci === null ? null : r.peak_utci + input.temperature_delta_c,
    }));
    await route.fulfill({
      json: {
        data: {
          scenario_id: "fixture-scenario-only",
          source_snapshot_id: input.snapshot_id,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          content_sha256: "b".repeat(64),
          applied_deltas: input,
          clamp_counts: { rh: 0 },
          baseline: forecast.daily,
          scenario,
        },
        meta: {
          is_simulation: true,
          mode: "whatif",
          quality_flags: ["SYNTHETIC_CONTRACT_EXAMPLE"],
        },
      },
    });
  });
  await page.goto("/scenarios");
  await page.getByLabel("Air temperature change numeric value").fill("2");
  await expect(
    page.getByRole("heading", { name: "Computed comparison", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Applied inputs: temperature \+2 °C/),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByText("Independent perturbation, not a live forecast.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  expect((await event).suggestedFilename()).toBe("heatguard-whatif.txt");
});
