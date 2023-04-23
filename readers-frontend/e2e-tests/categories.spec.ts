import { test, expect } from "@playwright/test";
import prisma from "../src/prisma.js";

test.describe("Muse", () => {
  test("has Muse as title", async ({ page }) => {
    await page.goto("./muse");
    await expect(page).toHaveTitle("Muse - Nouse");
  });

  test("Displays custom home page", async ({ page }) => {
    await page.goto("./muse");
    await expect(
      page.locator("#featured-articles >> .article:visible")
    ).toHaveCount(2);

    const featuredSection = page.locator(".featured-sections > div");
    await expect(featuredSection).toHaveCount(2);
  });

  test("Has pagination", async ({ page }) => {
    await page.goto("./muse");
    const paginatorButtons = page.locator("#paginator-container >> button");
    await expect(paginatorButtons).toHaveCount(2);

    // Load next page
    (await paginatorButtons.all())[1].click();

    // Let next page load
    await page.waitForTimeout(1000);
    await expect(page).toHaveTitle("Muse - Nouse");
  });
});
