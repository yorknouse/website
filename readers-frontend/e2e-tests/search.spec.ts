import { test, expect } from "@playwright/test";
import { apiSearchResponse } from "./apiSearchReponse.js";

test.beforeEach(async ({ page }) => {
  await page.goto("./search");
});

test.describe("Search functionality", () => {
  test("Search interface appears on button click", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile === true, "Skipping on mobile for now");

    const searchInterface = page.locator("[id=searchInterface]");
    const searchButton = await page.waitForSelector(
      ".searchBtnClassIdentifier"
    );

    await expect(searchInterface).toHaveClass(/invisible/);
    await expect(searchInterface).toHaveClass(/opacity-0/);

    await searchButton.click();

    await expect(searchInterface).not.toHaveClass(/invisible/);
    await expect(searchInterface).not.toHaveClass(/opacity-0/);
  });

  test("Search provides results", async ({ page, isMobile }) => {
    // Mock api
    await page.route("**/searchSuggestions.php", async (route) => {
      const json = apiSearchResponse;
      await route.fulfill({ json });
    });

    let divsInFirstPage = 0;

    if (isMobile) {
      // Manually perform search - Mobile navbar missing
      await page.goto("./search?q=Test");

      // Page one, 6 articles in one column
      divsInFirstPage = 6;
    } else {
      // Perform search - Start
      const searchButton = await page.waitForSelector(
        ".searchBtnClassIdentifier"
      );

      await searchButton.click();

      const searchInput = page.locator("[id=searchBox]");
      await searchInput.fill("Test");
      const navigationPromise = page.waitForURL("**/search?q=Test");
      await searchInput.press("Enter");
      await navigationPromise;
      // Perform Search - End

      // Page one, 3 rows of articles
      divsInFirstPage = 3;
    }
    // Get first page of results articles
    const articles = page.locator("[id=searchResults_container] > div");
    // Check number of divs
    await expect(articles).toHaveCount(divsInFirstPage);

    if (isMobile === false) {
      // Desktop articles are in rows
      // Check content of each row
      for (let row of await articles.all()) {
        const content = row.locator(":scope > div");

        // Two articles per row
        await expect(content).toHaveCount(2);
      }
    }

    // Paginator buttons
    const paginatorButtons = page.locator(
      "[id=paginator-container] > div > div > button"
    );

    // No next page group button as there are only two pages, so count = 2
    await expect(paginatorButtons).toHaveCount(2);

    // Load next page
    (await paginatorButtons.all())[1].click();

    // Let next page load
    await page.waitForTimeout(1000);

    const secondPageArticles = page.locator(
      "[id=searchResults_container] > div"
    );

    // Second page has only one row
    await expect(secondPageArticles).toHaveCount(1);
  });

  test("Search provides fallback text", async ({ page, isMobile }) => {
    // Mock api, internal server error
    await page.route("**/searchSuggestions.php", async (route) => {
      const status = 500;
      await route.fulfill({ status });
    });

    if (isMobile) {
      // Manually perform search - Mobile navbar missing
      await page.goto("./search?q=Test");
    } else {
      // Perform search - Start
      const searchButton = await page.waitForSelector(
        ".searchBtnClassIdentifier"
      );

      searchButton.click();

      const searchInput = page.locator("[id=searchBox]");
      await searchInput.fill("Test");
      const navigationPromise = page.waitForURL("**/search?q=Test");
      await searchInput.press("Enter");
      await navigationPromise;
      // Perform Search - End
    }

    const fallBackText = page.locator("[id=searchFallback]");

    await expect(fallBackText).toHaveText(
      "We couldn't find anything for “Test”"
    );
  });
});
