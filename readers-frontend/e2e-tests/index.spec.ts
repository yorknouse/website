import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

// test("has title", async ({ page }) => {
  // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle("Welcome to Astro.");
// });

// test("navbar has correct number of items and correct image", async ({
//   page,
// }) => {
  // await expect(page.locator("nav > ul > li")).toHaveCount(11);
  // await expect(page.locator("header > a > img")).toHaveAttribute(
  //   "src",
  //   "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-print.svg"
  // );
// });
