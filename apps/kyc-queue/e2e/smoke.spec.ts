import { expect, test } from "@playwright/test";

test("analyst escalates a case with a reason and the audit row appears", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: /Ana Analyst/ }).click();
  await expect(page.getByTestId("current-user")).toContainText("Ana Analyst");

  await page.goto("/?status=in_review");
  await page.getByRole("link", { name: /^KYC-/ }).first().click();
  await expect(page.getByTestId("case-status")).toHaveText("in_review");
  const caseId = page.url().split("/cases/")[1]!.split("?")[0]!;

  const reason = `Smoke: name mismatch on ID document ${Date.now()}`;
  await page.getByLabel("Reason").fill(reason);
  await page.getByRole("button", { name: "Escalate" }).click();
  await expect(page.getByTestId("case-status")).toHaveText("escalated");
  // Analysts cannot resolve escalations, so no transition buttons remain.
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);

  await page.getByRole("link", { name: "audit" }).click();
  const row = page.getByRole("row").filter({ hasText: reason });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("analyst");
  await expect(row).toContainText("in_review");
  await expect(row).toContainText("escalated");

  const res = await page.request.get(`/api/audit?caseId=${caseId}`);
  expect(res.status()).toBe(200);
  const [latest] = await res.json();
  expect(latest).toMatchObject({ reason, before: { status: "in_review" }, after: { status: "escalated" } });
});
