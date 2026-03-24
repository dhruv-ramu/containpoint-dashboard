/**
 * Captures screenshots from the ContainPoint dashboard for documentation.
 *
 * Prerequisites:
 * 1. App must be running: npm run dev
 * 2. Database seeded: npm run db:seed
 *
 * Run: npx tsx scripts/capture-screenshots.ts
 *
 * Screenshots are saved to docs/screenshots/
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "docs", "screenshots");

const CREDENTIALS = {
  email: "seed@containpoint.com",
  password: "Seed1234!",
};

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function capture(name: string, page: import("playwright").Page, selector?: string) {
  await ensureDir(OUTPUT_DIR);
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  if (selector) {
    const el = await page.locator(selector).first();
    await el.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage: true });
  }
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  console.log("ContainPoint Screenshot Capture");
  console.log("==============================\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    // 1. Login
    console.log("1. Capturing login page...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await capture("01-login", page);

    // 2. Login and go to app dashboard
    console.log("\n2. Logging in...");
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|app\/)$/, { timeout: 10000 });

    // 3. App dashboard (org level)
    console.log("\n3. Capturing app dashboard...");
    await page.waitForTimeout(1000);
    await capture("02-app-dashboard", page);

    // 4. Facilities list
    console.log("\n4. Capturing facilities list...");
    await page.click('a[href="/app/facilities"]');
    await page.waitForURL(/\/app\/facilities/, { timeout: 5000 });
    await page.waitForTimeout(800);
    await capture("03-facilities", page);

    // 5. Facility dashboard (first facility)
    console.log("\n5. Capturing facility dashboard...");
    const facilityLink = page.locator('tbody a[href^="/app/facilities/"]').first();
    const facilityHref = await facilityLink.getAttribute("href");
    let facilityId: string | null = null;
    if (facilityHref) {
      facilityId = facilityHref.split("/")[3];
      await page.goto(`${BASE_URL}${facilityHref}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await capture("04-facility-dashboard", page);

      // 6. Plan overview
      console.log("\n6. Capturing plan overview...");
      await page.goto(`${BASE_URL}/app/facilities/${facilityId}/plan`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await capture("05-plan-overview", page);

      // 7. Plan version detail (if there's a version link)
      const planVersionLink = page.locator('a[href*="/plan/"]').first();
      const planHref = await planVersionLink.getAttribute("href");
      if (planHref && planHref.includes("/plan/") && !planHref.endsWith("/plan")) {
        console.log("\n7. Capturing plan version detail...");
        await page.goto(`${BASE_URL}${planHref}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(800);
        await capture("06-plan-version", page);
      }

      // 8. Incidents
      console.log("\n8. Capturing incidents page...");
      await page.goto(`${BASE_URL}/app/facilities/${facilityId}/incidents`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await capture("07-incidents", page);

      // 9. Exports
      console.log("\n9. Capturing export center...");
      await page.goto(`${BASE_URL}/app/facilities/${facilityId}/exports`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await capture("08-export-center", page);

      // 11. Assets
      console.log("\n11. Capturing assets...");
      await page.goto(`${BASE_URL}/app/facilities/${facilityId}/assets`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await capture("10-assets", page);

      // 12. Inspections
      console.log("\n12. Capturing inspections...");
      await page.goto(`${BASE_URL}/app/facilities/${facilityId}/inspections`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await capture("11-inspections", page);
    }

    // 10. Portfolio
    console.log("\n10. Capturing portfolio...");
    await page.goto(`${BASE_URL}/app/portfolio`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await capture("09-portfolio", page);
  } catch (err) {
    console.error("\nError:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }

  console.log("\n==============================");
  console.log("Screenshots saved to docs/screenshots/");
}

main();
