import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("has title", async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Welcome to Astro.");
});

test("navbar has correct number of items and correct image", async ({
  page,
}) => {
  // await expect(page.locator("nav > ul > li")).toHaveCount(11);
  // await expect(page.locator("header > a > img")).toHaveAttribute(
  //   "src",
  //   "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-print.svg"
  // );
});

test("banner and edition display correct information", async ({ page }) => {
  const join = page.locator("[id='join_nouse']");
  await expect(join.locator("img")).toHaveAttribute(
    "src",
    "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/headerImages/join_nouse.png"
  );

  // const mockEditionURL = "TODO";
  const edition = page.locator("[id='edition']");
  await expect(edition.locator("div > p")).toHaveCount(2);
  // await expect(edition.locator("img")).toHaveAttribute("src", mockEditionURL);
});
