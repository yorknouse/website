import { test, expect } from "@playwright/test";
import prisma from "../src/prisma.js";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("has title", async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Nouse");
});

test.describe("Featured Articles", () => {
  // Tests for different numbers of landscape featured articles
  for (let i = 6; i > 0; i--) {
    let landscapeArticles = [1, 2, 3, 4, 5, 6];
    const landscapeFeaturedArticles = landscapeArticles.slice(0, i);
    test.describe(`When ${landscapeFeaturedArticles.length} landscape articles are featured`, async () => {
      test("Displays correct number of articles", async ({ page }) => {
        await prisma.featuredHome.update({
          where: {
            featuredHome_id: 1,
          },
          data: {
            featuredHome_articles: landscapeFeaturedArticles.toString(),
          },
        });
        await page.reload();
        await expect(
          page.locator("#featured-articles >> .article:visible")
        ).toHaveCount(landscapeFeaturedArticles.length);
      });

      test("Display the correct information and have the correct links to articles", async ({
        page,
        isMobile,
      }) => {
        await prisma.featuredHome.update({
          where: {
            featuredHome_id: 1,
          },
          data: {
            featuredHome_articles: landscapeFeaturedArticles.toString(),
          },
        });
        await page.reload();
        for (let i = 0; i < landscapeFeaturedArticles.length; i++) {
          const article = page
            .locator(`#featured-articles >> .article:visible`)
            .nth(i);

          // Checking Image
          if (i === 0) {
            // Article 1 has a custom image
            await expect(article.locator("img")).toHaveAttribute(
              "src",
              "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
            );
          } else if (!isMobile || (isMobile && i <= 2)) {
            // in Mobile View, only the first 3 articles have images visible
            // All other articles have the default image
            await expect(article.locator("img")).toHaveAttribute(
              "src",
              process.env.fileStoreUrl +
                "/nouseSiteAssets/imageArchive-comp.jpg"
            );
          }
          if (!isMobile || (isMobile && i <= 2)) {
            // in Mobile View, only the first 3 articles have images visible
            await expect(article.locator(".image-link")).toHaveAttribute(
              "href",
              new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
            );
          }

          // Checking Category
          await expect(article.locator(".category-text")).toHaveAttribute(
            "href",
            "/website/testCategory1"
          );
          await expect(article.locator(".category-text")).toHaveText("Test");
          await expect(article.locator(".category-text")).toHaveCSS(
            "color",
            "rgb(237, 179, 33)"
          ); // Playwright doesn't support hex values for toHaveCSS.

          // Checking Headline
          await expect(article.locator(".headline")).toHaveAttribute(
            "href",
            new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
          );
          await expect(article.locator(".headline")).toHaveText(
            `Article Draft ${i + 1}`
          );

          // Checking Author
          await expect(article.locator(".author")).toHaveAttribute(
            "href",
            `/author/1`
          );
          await expect(article.locator(".author")).toHaveText(`By John Doe`);

          // Checking Excerpt
          await expect(article.locator(".excerpt")).toHaveAttribute(
            "href",
            new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
          );
          await expect(article.locator(".excerpt")).toHaveText(
            `Article ${i + 1} Excerpt`
          );
        }
      });
    });
  }

  // Tests for different numbers of landscape with portrait featured articles.
  // Note: The current implementation of the featured articles section only supports one portrait article.
  for (let i = 6; i > 0; i--) {
    let landscapeWithPortraitArticles = [2, 3, 4, 5, 6, 7]; // 7 is portrait. The rest are landscape.
    const landscapeFeaturedArticles = landscapeWithPortraitArticles.slice(
      0,
      i - 1
    );
    landscapeFeaturedArticles.push(7);
    test.describe(`When ${landscapeFeaturedArticles.length} landscape articles and 1 portrait article are featured ${landscapeFeaturedArticles}`, async () => {
      test(`Displays correct number of articles ${landscapeFeaturedArticles}`, async ({
        page,
      }) => {
        await prisma.featuredHome.update({
          where: {
            featuredHome_id: 1,
          },
          data: {
            featuredHome_articles: landscapeFeaturedArticles.toString(),
          },
        });
        await page.reload();
        await expect(
          page.locator("#featured-articles >> .article:visible")
        ).toHaveCount(landscapeFeaturedArticles.length);
      });

      test("Reorders articles so that the first article is portrait", async ({
        page,
      }) => {
        await prisma.featuredHome.update({
          where: {
            featuredHome_id: 1,
          },
          data: {
            featuredHome_articles: landscapeFeaturedArticles.toString(),
          },
        });
        await page.reload();
        const article = page
          .locator(`#featured-articles >> .article:visible`)
          .nth(0);

        // Checking Image
        await expect(article.locator("img")).toHaveAttribute(
          "src",
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
        );
        await expect(article.locator(".image-link")).toHaveAttribute(
          "href",
          /^(.*?)\/2023\/02\/24\/test-article-7/
        );

        // Checking Category
        await expect(article.locator(".category-text")).toHaveAttribute(
          "href",
          "/website/testCategory1"
        );
        await expect(article.locator(".category-text")).toHaveText("Test");
        await expect(article.locator(".category-text")).toHaveCSS(
          "color",
          "rgb(237, 179, 33)"
        ); // Playwright doesn't support hex values for toHaveCSS.

        // Checking Headline
        await expect(article.locator(".headline")).toHaveAttribute(
          "href",
          /^(.*?)\/2023\/02\/24\/test-article-7/
        );
        await expect(article.locator(".headline")).toHaveText(
          `Article Draft 7`
        );

        // Checking Author
        await expect(article.locator(".author")).toHaveAttribute(
          "href",
          `/author/1`
        );
        await expect(article.locator(".author")).toHaveText(`By John Doe`);

        // Checking Excerpt
        await expect(article.locator(".excerpt")).toHaveAttribute(
          "href",
          /^(.*?)\/2023\/02\/24\/test-article-7/
        );
        await expect(article.locator(".excerpt")).toHaveText(
          `Article 7 Excerpt`
        );
      });

      if (landscapeFeaturedArticles.length > 1) {
        test(`Display the correct information and have the correct links to the landscape articles ${landscapeFeaturedArticles}`, async ({
          page,
          isMobile,
        }) => {
          await prisma.featuredHome.update({
            where: {
              featuredHome_id: 1,
            },
            data: {
              featuredHome_articles: landscapeFeaturedArticles.toString(),
            },
          });
          await page.reload();
          for (let i = 1; i < landscapeFeaturedArticles.length; i++) {
            const article = page
              .locator(`#featured-articles >> .article:visible`)
              .nth(i);

            if (!isMobile || (isMobile && i <= 2)) {
              // in Mobile View, only the first 3 articles have images visible
              await expect(article.locator("img")).toHaveAttribute(
                "src",
                process.env.fileStoreUrl +
                  "/nouseSiteAssets/imageArchive-comp.jpg"
              );
              await expect(article.locator(".image-link")).toHaveAttribute(
                "href",
                new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
              );
            }

            // Checking Category
            await expect(article.locator(".category-text")).toHaveAttribute(
              "href",
              `/website/testCategory1`
            );
            await expect(article.locator(".category-text")).toHaveText("Test");
            await expect(article.locator(".category-text")).toHaveCSS(
              "color",
              "rgb(237, 179, 33)"
            ); // Playwright doesn't support hex values for toHaveCSS.

            // Checking Headline
            await expect(article.locator(".headline")).toHaveAttribute(
              "href",
              new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
            );
            await expect(article.locator(".headline")).toHaveText(
              `Article Draft ${i + 1}`
            );

            // Checking Author
            await expect(article.locator(".author")).toHaveAttribute(
              "href",
              `/author/1`
            );
            await expect(article.locator(".author")).toHaveText(`By John Doe`);

            // Checking Excerpt
            await expect(article.locator(".excerpt")).toHaveAttribute(
              "href",
              new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
            );
            await expect(article.locator(".excerpt")).toHaveText(
              `Article ${i + 1} Excerpt`
            );
          }
        });
      }
    });
  }
});

test.describe("Banner and Edition", () => {
  test("Displays correct pictures", async ({ page }) => {
    const join = page.locator("[id='join_nouse']");
    await expect(join.locator("img")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/headerImages/join_nouse.png"
    );

    const edition = page.locator("[id='edition']");
    await expect(edition.locator("div > p")).toHaveCount(2);
    await expect(edition.locator("img")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-THUMBNAIL/1676037110155-67511536907255130000-503jpg_medium.jpg"
    );
  });

  test("Has the correct links", async ({ page }) => {
    await expect(page.locator("[id='join_nouse']")).toHaveAttribute(
      "href",
      "/website/join"
    );

    await expect(page.locator("[id='edition']")).toHaveAttribute(
      "href",
      "/website/edition/test-edition"
    );
  });
});

test.describe("Featured Section", () => {
  test("Displays one featured section", async ({ page }) => {
    const featuredSection = page.locator(".featured-sections > div");
    await expect(featuredSection).toHaveCount(1);
  });
  test("Displays the category accent", async ({ page }) => {
    const categoryAccent = page
      .locator("#testCategory1-section")
      .locator(".category-text");
    await expect(categoryAccent).toHaveAttribute(
      "href",
      `/website/testCategory1`
    );
    await expect(categoryAccent).toHaveText("Test");
    await expect(categoryAccent).toHaveCSS("color", "rgb(237, 179, 33)"); // Playwright doesn't support hex values for toHaveCSS.
  });

  test("Displays the correct number of articles", async ({ page }) => {
    const articles = page
      .locator("#testCategory1-section")
      .first()
      .locator(".article:visible");
    await expect(articles).toHaveCount(5);
  });

  test("Displays the correct information and have the correct links to the featured articles", async ({
    page,
    isMobile,
  }) => {
    const articles = page
      .locator("#testCategory1-section")
      .locator(".article:visible");
    for (let i = 0; i < 5; i++) {
      const article = articles.nth(i);

      // Checking Image
      if (i === 0) {
        // Article 1 has a custom image
        await expect(article.locator("img")).toHaveAttribute(
          "src",
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
        );
      } else if (!isMobile) {
        // in Mobile View, only the first article has an image visible
        // All other articles have the default image
        await expect(article.locator("img")).toHaveAttribute(
          "src",
          process.env.fileStoreUrl + "/nouseSiteAssets/imageArchive-comp.jpg"
        );
      }
      if (!isMobile || (isMobile && i == 0)) {
        // in Mobile View, only the first 3 articles have images
        await expect(article.locator(".image-link")).toHaveAttribute(
          "href",
          new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
        );
      }

      // Checking Headline
      await expect(article.locator(".headline")).toHaveAttribute(
        "href",
        new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
      );
      await expect(article.locator(".headline")).toHaveText(
        `Article Draft ${i + 1}`
      );

      // Checking Author
      await expect(article.locator(".author")).toHaveAttribute(
        "href",
        `/author/1`
      );
      await expect(article.locator(".author")).toHaveText(`By John Doe`);

      // Checking Excerpt
      await expect(article.locator(".excerpt")).toHaveAttribute(
        "href",
        new RegExp(String.raw`^(.*?)/2023/02/24/test-article-${i + 1}`)
      );
      await expect(article.locator(".excerpt")).toHaveText(
        `Article ${i + 1} Excerpt`
      );
    }
  });
});

test.describe("Muse component", () => {
  test("Muse logo is a link", async ({ page }) => {
    const museLogoLink = page.locator("[id='muse-banner'] > a");

    await expect(museLogoLink).toHaveCount(1);
    await expect(museLogoLink).toHaveAttribute("href", "/muse");

    const museLogo = museLogoLink.locator("img");

    await expect(museLogo).toHaveCount(1);
    await expect(museLogo).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/MUSE%20Logo%20White%20small.png"
    );
  });

  test("Muse Banner lays navbar", async ({ page }) => {
    const museNavbarItems = page.locator(
      "[id='muse-navbar-desktop'] > ul > li"
    );

    await expect(museNavbarItems).toHaveCount(3);

    // First item should always be "Home"
    await expect(museNavbarItems.first()).toHaveText("Home");
  });

  test("Button turns to link", async ({ page, isMobile }) => {
    test.skip(isMobile == true, "Skipping on mobile for now");
    const museMenuCategories = await prisma.categories.findMany({
      where: {
        categories_showMenu: true,
        categories_nestUnder: 4, // Muse
      },
    });

    // Index 2 cause 0 is muse Home
    const museNavbarSecondItem = (
      await page.locator("[id='muse-navbar-desktop'] > ul > li").all()
    )[2];

    const secondItemButton = museNavbarSecondItem.locator("button");
    const secondItemMissingLink = museNavbarSecondItem.locator("a");

    await expect(secondItemButton).toHaveCount(1);
    await expect(secondItemMissingLink).toHaveCount(0);

    await expect(secondItemButton).toHaveText(
      museMenuCategories[1].categories_displayName!
    );

    // Button should turn insto a tag after click
    await secondItemButton.click();

    const secondItemLink = museNavbarSecondItem.locator("a");
    const secondItemMissingButton = museNavbarSecondItem.locator("button");

    await expect(secondItemLink).toHaveCount(1);
    await expect(secondItemLink).toHaveText(
      museMenuCategories[1].categories_displayName!
    );
    await expect(secondItemLink).toHaveAttribute(
      "href",
      `/${museMenuCategories[1].categories_name}`
    );
    await expect(secondItemMissingButton).toHaveCount(0);
  });
});
