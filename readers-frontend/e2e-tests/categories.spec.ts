import { test, expect } from "@playwright/test";
import prisma from "../src/prisma.js";

test.describe("Muse", () => {
  test("has Muse as title", async ({ page }) => {
    await page.goto("./muse");
    await expect(page).toHaveTitle("Muse - Nouse");
  });

  test("Displays custom home page", async ({ page }) => {
    await page.goto("./muse");

    // Checking for the featured articles
    await expect(
      page.locator("#featured-articles >> .article:visible")
    ).toHaveCount(2);

    // Checking for the featured sections
    const featuredSection = page.locator(".featured-sections > div");
    await expect(featuredSection).toHaveCount(2);
  });

  test("Has pagination", async ({ page }) => {
    await page.goto("./muse");
    const paginatorButtons = page.locator("#paginator-container >> button");

    // Check that paginator has two buttons
    await expect(paginatorButtons).toHaveCount(2);

    // Load next page
    (await paginatorButtons.all())[1].click();

    // Let next page load
    await page.waitForTimeout(1000);

    // Sanity check that the page actually loaded correctly
    await expect(page).toHaveTitle("Muse - Nouse");
  });

  test("Displays featured articles, a list of non-featured articles and a paginator on the rest of the pages", async ({
    page,
  }) => {
    await page.goto("./muse/2");

    // Checking for the featured articles
    await expect(
      page.locator("#featured-articles >> .article:visible")
    ).toHaveCount(2);

    // Checking for the list of non-featured articles
    await expect(page.locator("#article-list >> .article:visible")).toHaveCount(
      2
    );

    // Check that paginator has two buttons
    await expect(page.locator("#paginator-container >> button")).toHaveCount(2);
  });
});

// Tests for a category with only featured articles
test.describe("Muse Subcategory", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./muse/features");
  });

  test("has correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Features - Nouse");
  });

  test("Displays featured articles and a paginator", async ({
    page,
    isMobile,
  }) => {
    // Checking for the mobile header
    const mobileHeader = page.locator("#mobile-header");
    if (isMobile) {
      await expect(mobileHeader).toBeVisible();
      await expect(mobileHeader).toHaveText("Features");
    } else {
      await expect(mobileHeader).not.toBeVisible();
    }

    // Checking for the featured articles
    await expect(
      page.locator("#featured-articles >> .article:visible")
    ).toHaveCount(2);

    // Check that paginator has two buttons
    await expect(page.locator("#paginator-container >> button")).toHaveCount(1);
  });
});

// Tests for a category with featured articles and a list of non-featured
test.describe("Nouse Category", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./testCategory1");
  });

  test("has correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Test - Nouse");
  });

  test("Displays featured articles, a list of non-featured articles and a paginator", async ({
    page,
    isMobile,
  }) => {
    // Checking for the mobile header
    const mobileHeader = page.locator("#mobile-header");
    if (isMobile) {
      await expect(mobileHeader).toBeVisible();
      await expect(mobileHeader).toHaveText("Test");
    } else {
      await expect(mobileHeader).not.toBeVisible();
    }

    // Checking for the featured articles
    await expect(
      page.locator("#featured-articles >> .article:visible")
    ).toHaveCount(5);

    // Checking for the list of non-featured articles
    await expect(page.locator("#article-list >> .article:visible")).toHaveCount(
      2
    );

    // Check that paginator has two buttons
    await expect(page.locator("#paginator-container >> button")).toHaveCount(1);
  });
});
