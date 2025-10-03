import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test.describe("Desktop Navbar", () => {
  test("Has the correct number of items and correct image", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile === true);
    await expect(page.locator("#desktopNav > ul > li")).toHaveCount(5);
    // Checking Header Picture
    await expect(page.locator("#desktopHeader > a > img")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-print.svg",
    );
    // Checking Nouse button Picture
    await expect(
      page.locator("#desktopNav > ul > li:nth-child(5) > a > img"),
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/kingfisher.svg",
    );
    // Checking Muse button Picture
    await expect(
      page.locator("#desktopNav > ul > li:nth-child(7) > a > img"),
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/MUSE%20Logo%20White%20small.png",
    );
    // Checking Test category page shows nested category
    await page.goto("./testCategory1");
    await expect(
      page.locator("#desktopNav > ul").nth(1).locator("li"),
    ).toHaveCount(1);
  });

  test("Has the correct links", async ({ page, isMobile }) => {
    test.skip(isMobile === true);
    // Home Button
    await expect(
      page.locator("#desktopNav > ul > li:nth-child(1) > a"),
    ).toHaveAttribute("href", "/website/");
    // Test category Button
    await expect(
      page.locator("#desktopNav > ul > li:nth-child(3) > a"),
    ).toHaveAttribute("href", "/website/testCategory1");
    // Nouse Button
    await expect(
      page.locator("#desktopNav > ul > li:nth-child(5) > a"),
    ).toHaveAttribute("href", "/website/");
    // Muse Button
    await expect(
      page.locator("#desktopNav > ul > li:nth-child(7) > a"),
    ).toHaveAttribute("href", "/website/muse");
    // Checking Test category page has correct nested category button
    await page.goto("./testCategory1");
    await expect(
      page.locator("#desktopNav > ul").nth(1).locator("li:nth-child(1) > a"),
    ).toHaveAttribute("href", "/website/testCategory1/testNestedCategory");
  });
});

test.describe("Mobile navbar", () => {
  test("Navbar appears on hamburger menu click", async ({ page, isMobile }) => {
    test.skip(isMobile === false);
    const hamburgerMenu = page.locator("#mobileNavMenuTgl");
    const mobileNav = page.locator("#mobileNav");

    await expect(mobileNav).toHaveClass(/-translate-y-\[calc\(100%\+7rem\)]/);

    await hamburgerMenu.click();

    await expect(mobileNav).not.toHaveClass(
      /-translate-y-\[calc\(100%\+7rem\)]/,
    );
  });

  test("Has the correct links", async ({ page, isMobile }) => {
    test.skip(isMobile === false);
    const hamburgerMenu = page.locator("#mobileNavMenuTgl");
    await hamburgerMenu.click();

    // Home Button
    await expect(
      page.locator("#mobileNav > ul > li:nth-child(1) > div > a"),
    ).toHaveAttribute("href", "/website/");
    // Test category Button (has nested category)
    await expect(
      page.locator(
        "#mobileNav > ul > li:nth-child(2) > div > button > div > a",
      ),
    ).toHaveAttribute("href", "/website/testCategory1");
    // Nouse Button
    await expect(
      page.locator("#mobileNav > ul > li:nth-child(3) > div > a"),
    ).toHaveAttribute("href", "/website/");
    // Muse Button
    await expect(
      page.locator("#mobileNav > ul > li:nth-child(4) > div > a"),
    ).toHaveAttribute("href", "/website/muse");
  });

  test("Categories are nested correctly", async ({ page, isMobile }) => {
    test.skip(isMobile === false);
    const hamburgerMenu = page.locator("#mobileNavMenuTgl");
    await hamburgerMenu.click();

    // --- Nouse begin ---
    const nouseCategoryBtn = page.locator(
      "#mobileNav > ul > li:nth-child(2) > div > button",
    );
    const nouseCategoryListContainer = page.locator(
      "#mobileNav > ul > li:nth-child(2) > div > div[id*='ListContainer']",
    );

    // Before opening submenu
    await expect(nouseCategoryListContainer).toHaveClass(/hidden/);
    // Open
    await nouseCategoryBtn.click({
      position: {
        x: 0,
        y: 0,
      },
    });
    // After openin submenu
    await expect(nouseCategoryListContainer).not.toHaveClass(/hidden/);
    // Close
    await nouseCategoryBtn.click({
      position: {
        x: 0,
        y: 0,
      },
    });
    // After closing submenu
    await expect(nouseCategoryListContainer).toHaveClass(/hidden/);

    // Check link
    await expect(
      nouseCategoryListContainer.locator("ul > li:nth-child(1) > a"),
    ).toHaveAttribute("href", "/website/testCategory1/testNestedCategory");
    // --- Nouse end ---

    await page.goto("./muse");
    await hamburgerMenu.click();

    // --- Muse begin ---
    const museCategoryBtn = page.locator(
      "#mobileNav > ul > li:nth-child(2) > div > button",
    );
    const museCategoryListContainer = page.locator(
      "#mobileNav > ul > li:nth-child(2) > div > div[id*='ListContainer']",
    );

    // Before opening submenu
    await expect(museCategoryListContainer).toHaveClass(/hidden/);
    // Open
    await museCategoryBtn.click({
      position: {
        x: 0,
        y: 0,
      },
    });
    // After openin submenu
    await expect(museCategoryListContainer).not.toHaveClass(/hidden/);
    // Close
    await museCategoryBtn.click({
      position: {
        x: 0,
        y: 0,
      },
    });
    // After closing submenu
    await expect(museCategoryListContainer).toHaveClass(/hidden/);

    // Check link
    await expect(
      museCategoryListContainer.locator("ul > li:nth-child(1) > a"),
    ).toHaveAttribute("href", "/website/muse/features/testMuseNestedCategory");
    // --- Muse end ---
  });

  test("Categories are higlighted", async ({ page, isMobile }) => {
    test.skip(isMobile === false);
    const hamburgerMenu = page.locator("#mobileNavMenuTgl");
    await hamburgerMenu.click();

    await expect(
      page.locator("#mobileNav > ul > li:nth-child(1) > div > a"),
    ).toHaveClass(/border-b-\[5px\]/);

    await page.goto("./testCategory1");
    await hamburgerMenu.click();

    await expect(
      page.locator("#mobileNav > ul > li:nth-child(2) > div > button"),
    ).toHaveClass(/border-b-\[5px\]/);

    await page.goto("./testCategory1/testNestedCategory");
    await hamburgerMenu.click();

    await expect(
      page.locator("#mobileNav > ul > li:nth-child(2) > div > button"),
    ).toHaveClass(/border-b-\[5px\]/);

    await page.goto("./muse/features");
    await hamburgerMenu.click();
    await expect(
      page.locator("#mobileNav > ul > li:nth-child(2) > div > button"),
    ).toHaveClass(/border-b-\[5px\]/);

    await page.goto("./muse/features/testMuseNestedCategory");
    await hamburgerMenu.click();
    await expect(
      page.locator("#mobileNav > ul > li:nth-child(2) > div > button"),
    ).toHaveClass(/border-b-\[5px\]/);
  });

  test("Chevron rotates", async ({ page, isMobile }) => {
    test.skip(isMobile === false);

    const hamburgerMenu = page.locator("#mobileNavMenuTgl");
    const chevron = page.locator(
      "#mobileNav > ul > li:nth-child(2) > div > button > div > svg",
    );
    const category = page.locator(
      "#mobileNav > ul > li:nth-child(2) > div > button",
    );
    await hamburgerMenu.click();

    // Initial
    await expect(chevron).toHaveClass(/rotate-90/);

    // Rotate to expanded position
    await category.click({ position: { x: 0, y: 0 } });
    await expect(chevron).toHaveClass(/-rotate-90/);

    // Back to initial
    await category.click({ position: { x: 0, y: 0 } });
    await expect(chevron).toHaveClass(/rotate-90/);
  });
});
