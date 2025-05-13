import { test, expect } from "@playwright/test";

test.describe("Editions Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./editions");
  });

  test("has Editions as title", async ({ page }) => {
    await expect(page).toHaveTitle("Our Editions - Nouse");
  });

  test("Shows the correct print and web editions sorted by the academic year", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveText("Our Editions");

    const academicYear = page.locator(".academic-year");
    // Checking there is only one academic year group
    await expect(academicYear).toHaveCount(1);

    // Checking the headings are correct
    await expect(academicYear.locator("h2")).toHaveText("2022-2023");
    await expect(academicYear.locator("h3").nth(0)).toHaveText(
      "Print Editions and Supplements"
    );
    await expect(academicYear.locator("h3").nth(1)).toHaveText(
      "Web Editions and Supplements"
    );

    // Checking the print editions are correct
    const printEditionsSection = academicYear.locator(".print-editions");
    await expect(printEditionsSection.locator(".edition")).toHaveCount(2);

    // Checking the first print edition is correct
    await expect(
      printEditionsSection.locator(".edition").nth(0)
    ).toHaveAttribute("href", "/website/editions/test-edition");
    await expect(
      printEditionsSection.locator(".edition").nth(0).locator("img")
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-THUMBNAIL/1676037110155-67511536907255130000-503jpg_medium.jpg"
    );
    await expect(printEditionsSection.locator(".edition").nth(0)).toHaveText(
      "№1"
    );

    // Checking the second print edition is correct
    await expect(
      printEditionsSection.locator(".edition").nth(1)
    ).toHaveAttribute("href", "/website/editions/test-edition-2");
    await expect(
      printEditionsSection.locator(".edition").nth(1).locator("img")
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-THUMBNAIL/1668680604820-51650241314374140000-502jpg_medium.jpg"
    );
    await expect(printEditionsSection.locator(".edition").nth(1)).toHaveText(
      "3 January 2023"
    );

    // Checking the web editions are correct
    const webEditionsSection = academicYear.locator(".web-editions");
    await expect(webEditionsSection.locator(".edition")).toHaveCount(1);

    await expect(webEditionsSection.locator(".edition")).toHaveAttribute(
      "href",
      "/website/editions/test-web-edition"
    );
    await expect(
      webEditionsSection.locator(".edition").locator("img")
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-THUMBNAIL/1677873768325-93595571150116960000-nouseinbrief2jpeg_medium.jpeg"
    );
    await expect(webEditionsSection.locator(".edition")).toHaveText(
      "Test Web Edition"
    );
  });
});

test.describe("Print Edition Pages", () => {
  test.describe("First Print Edition", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./editions/test-edition");
    });

    test("has correct title", async ({ page }) => {
      await expect(page).toHaveTitle("№1 - Nouse");
    });

    test("Shows correct content", async ({ page }) => {
      await expect(page.locator("h1")).toHaveText("№1");
      await expect(page.locator("h4")).toHaveText(
        "Published on 24 February 2023"
      );
      await expect(page.locator("iframe")).toHaveAttribute(
        "src",
        "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-PDF/1676036977957-53461650533729990000-nouse503pdf.pdf"
      );
    });
  });

  test.describe("Second Print Edition", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./editions/test-edition-2");
    });

    test("has correct title", async ({ page }) => {
      await expect(page).toHaveTitle("3 January 2023 - Nouse");
    });

    test("Shows correct content", async ({ page }) => {
      await expect(page.locator("h1")).toHaveText("3 January 2023");
      await expect(page.locator("h4")).toHaveCount(0);
      await expect(page.locator("iframe")).toHaveAttribute(
        "src",
        "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-PDF/1668680182051-68589577660991020000-502pdf.pdf"
      );
    });
  });
});

test.describe("Web Edition Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./editions/test-web-edition");
  });

  test("has correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Test Web Edition - Nouse");
  });

  test("Shows correct content", async ({ page }) => {
    // Checking the headings and thumbnail are correct
    await expect(page.locator("h1")).toHaveText("Test Web Edition");
    await expect(page.locator("h4")).toHaveText("Published on 1 January 2023");
    await expect(page.locator("#thumbnail")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-THUMBNAIL/1677873768325-93595571150116960000-nouseinbrief2jpeg_medium.jpeg"
    );

    // Checking the sections are correct
    await expect(page.locator(".section")).toHaveCount(2);

    // Checking the first section is correct
    const firstSection = page.locator(".section").nth(0);
    await expect(firstSection.locator(".article:visible")).toHaveCount(3);
    await expect(firstSection.locator(".section-image")).toHaveCount(0);

    const firstCustomBoxContainer = firstSection.locator(
      ".custom-boxes-container"
    );
    await expect(firstCustomBoxContainer.locator("p").first()).toHaveText(
      "From Our Editors"
    );
    await expect(firstCustomBoxContainer.locator(".custom-box")).toHaveCount(2);
    await expect(
      firstCustomBoxContainer.locator(".custom-box").nth(0).locator("p").nth(0)
    ).toHaveText("Custom Box 1");
    await expect(
      firstCustomBoxContainer.locator(".custom-box").nth(0).locator("p").nth(1)
    ).toHaveText("Custom Box Text 1");
    await expect(
      firstCustomBoxContainer.locator(".custom-box").nth(1).locator("p").nth(0)
    ).toHaveText("Custom Box 2");
    await expect(
      firstCustomBoxContainer.locator(".custom-box").nth(1).locator("p").nth(1)
    ).toHaveText("Custom Box Text 2");

    // Checking the second section is correct
    const secondSection = page.locator(".section").nth(1);
    await expect(secondSection.locator(".article:visible")).toHaveCount(2);
    await expect(secondSection.locator(".section-image")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_medium.jpg"
    );

    const secondCustomBoxContainer = secondSection.locator(
      ".custom-boxes-container"
    );
    await expect(secondCustomBoxContainer.locator("p").first()).toHaveText(
      "From Our Editors"
    );
    await expect(secondCustomBoxContainer.locator(".custom-box")).toHaveCount(
      1
    );
    await expect(
      secondCustomBoxContainer.locator(".custom-box").nth(0).locator("p").nth(0)
    ).toHaveText("Custom Box Header");
    await expect(
      secondCustomBoxContainer.locator(".custom-box").nth(0).locator("p").nth(1)
    ).toHaveText("Custom Box Text");
  });

  test.describe("Custom Boxes", () => {
    test("allow users to flip between each custom box", async ({
      page,
      isMobile,
    }) => {
      const firstCustomBoxContainer = page
        .locator(".section")
        .nth(0)
        .locator(".custom-boxes-container");

      const secondCustomBoxContainer = page
        .locator(".section")
        .nth(1)
        .locator(".custom-boxes-container");

      if (isMobile) {
        // Checking the mobile selection indicators shows the correct number of bubbles with the first one being active
        await expect(
          firstCustomBoxContainer.locator(".mobile-selection-indicator > span")
        ).toHaveCount(2);
        await expect(
          firstCustomBoxContainer
            .locator(".mobile-selection-indicator > span")
            .nth(0)
        ).toHaveClass(/border-white/);
        await expect(
          firstCustomBoxContainer
            .locator(".mobile-selection-indicator > span")
            .nth(1)
        ).toHaveClass(/border-gray-500/);
        await expect(
          secondCustomBoxContainer.locator(".mobile-selection-indicator > span")
        ).toHaveCount(1);
        await expect(
          secondCustomBoxContainer
            .locator(".mobile-selection-indicator > span")
            .nth(0)
        ).toHaveClass(/border-white/);

        // TODO: Add a test for the swipe functionality
        // Note: This is not currently possible with Playwright
      } else {
        // Checking that when more than one custom box is present,
        // the back button is disabled and the forward button is enabled
        await expect(
          firstCustomBoxContainer.locator(".back-button")
        ).toBeDisabled();
        await expect(
          firstCustomBoxContainer.locator(".forward-button")
        ).toBeEnabled();

        // Checking that clicking the forward button flips to the next custom box,
        // enables the back button and disables the forward button
        await firstCustomBoxContainer.locator(".forward-button").click();
        await page.waitForTimeout(1000);
        await expect(
          firstCustomBoxContainer.locator(".back-button")
        ).toBeEnabled();
        await expect(
          firstCustomBoxContainer.locator(".forward-button")
        ).toBeDisabled();

        // Checking that when only one custom box is present,
        // both the back and forward buttons are disabled
        await expect(
          secondCustomBoxContainer.locator(".back-button")
        ).toBeDisabled();
        await expect(
          secondCustomBoxContainer.locator(".forward-button")
        ).toBeDisabled();
      }
    });
  });
});
