import { test, expect } from "@playwright/test";

test.describe("Author Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./author/1")
  });

  test("Has author name as title", async ({ page }) => {
    await expect(page).toHaveTitle("John Doe - Nouse");
  });

  test("Author Mantle Shows Correct Details and Featured Articles", async ({ page }) => {
    const authorMantle = page.locator("#author-mantle");

    // Checking author profile picture
    await expect(authorMantle.locator("#author-image")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
    );

    // Checking number of featured articles
    await expect(authorMantle.locator(".article:visible")).toHaveCount(2);
    
    const authorDetails = authorMantle.locator("#author-details");
    // Checking personal information
    await expect(authorDetails.locator("h1")).toHaveText("John Doe (he/him)");
    await expect(authorDetails.locator("p").first()).toHaveText("Editor");
    await expect(authorDetails.locator("p").nth(1)).toHaveText("Previously Held Positions: Deputy Editor (2022-2023)");
    await expect(authorDetails.locator("p").nth(2)).toHaveText("Hi there. Hope you like my articles");
  });

  test("Shows correct number of non featured articles",async ({ page }) => {
    await expect(page.locator("#article-list >> .article:visible")).toHaveCount(9);
    await expect(page.locator("#paginator-container >> button")).toHaveCount(1);
  });
});