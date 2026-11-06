import { expect, test } from "@playwright/test";

// Admin is the only spec role core's mock OIDC can sign in as today (see README).
test("admin toggles a prod flag inline with a reason and the audit row appears", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: /Ada Admin/ }).click();
  await expect(page.getByTestId("current-user")).toContainText("Ada Admin");

  const row = page.getByTestId("flag-row-prod-new-checkout");
  await expect(row.getByTestId("flag-state")).toHaveText("off");
  const reason = `Smoke: launch new checkout ${Date.now()}`;
  await row.getByLabel("Reason for new-checkout").fill(reason);
  await row.getByRole("button", { name: "Turn on" }).click();
  await expect(row.getByTestId("flag-state")).toHaveText("on");

  await row.getByRole("link", { name: "new-checkout" }).click();
  await page.getByRole("link", { name: "audit" }).click();
  const audit = page.getByRole("row").filter({ hasText: reason });
  await expect(audit).toHaveCount(1);
  await expect(audit).toContainText("admin");
  await expect(audit).toContainText("off");

  const res = await page.request.get("/api/audit?flagId=prod-new-checkout");
  expect(res.status()).toBe(200);
  const [latest] = await res.json();
  expect(latest).toMatchObject({ reason, before: { state: "off" }, after: { state: "on" } });
});
