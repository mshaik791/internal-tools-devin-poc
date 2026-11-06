import { expect, test } from "@playwright/test";

test("engineer toggles a staging flag inline with a reason and the audit row appears", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: /Eve Engineer/ }).click();
  await expect(page.getByTestId("current-user")).toContainText("engineer");

  // Prod is admin only: no toggle for the engineer.
  await expect(page.getByTestId("flag-row-prod-fast-payouts")).toContainText("read only");

  const row = page.getByTestId("flag-row-staging-fast-payouts");
  await expect(row.getByTestId("flag-state")).toHaveText("off");
  const reason = `Smoke: enable fast payouts in staging ${Date.now()}`;
  await row.getByLabel("Reason for fast-payouts").fill(reason);
  await row.getByRole("button", { name: "Turn on" }).click();
  await expect(row.getByTestId("flag-state")).toHaveText("on");

  await row.getByRole("link", { name: "fast-payouts" }).click();
  await page.getByRole("link", { name: "audit" }).click();
  const audit = page.getByRole("row").filter({ hasText: reason });
  await expect(audit).toHaveCount(1);
  await expect(audit).toContainText("engineer");
  await expect(audit).toContainText("off");

  const res = await page.request.get("/api/audit?flagId=staging-fast-payouts");
  expect(res.status()).toBe(200);
  const [latest] = await res.json();
  expect(latest).toMatchObject({ actor: "engineer", reason, before: { state: "off" }, after: { state: "on" } });
});
