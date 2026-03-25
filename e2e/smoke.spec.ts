import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL ?? "seed@containpoint.com";
const password = process.env.E2E_PASSWORD ?? "Seed1234!";

test.describe("dashboard smoke", () => {
  test("sign in and open facilities list", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });
    await page.goto("/app/facilities");
    await expect(page.getByRole("heading", { name: /facilities/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
