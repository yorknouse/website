import { test, expect } from "@playwright/test";
import prisma from "../src/prisma.js";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("has title", async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Welcome to Astro.");
});

test.describe("Navbar", () => {
  test("Has the correct number of items and correct image", async ({
    page,
  }) => {
    await expect(page.locator("nav > ul > li")).toHaveCount(5);
    // Checking Header Picture
    await expect(page.locator("header > a > img")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-print.svg"
    );
    // Checking Nouse button Picture
    await expect(
      page.locator("body > nav > ul > li:nth-child(5) > a > img")
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/kingfisher.svg"
    );
    // Checking Muse button Picture
    await expect(
      page.locator("body > nav > ul > li:nth-child(7) > a > img")
    ).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/MUSE%20Logo%20White%20small.png"
    );
  });

  test("Has the correct links", async ({ page }) => {
    // Home Button
    await expect(
      page.locator("body > nav > ul > li:nth-child(1) > a")
    ).toHaveAttribute("href", "/website/");
    // Test category Button
    await expect(
      page.locator("body > nav > ul > li:nth-child(3) > a")
    ).toHaveAttribute("href", "/testCategory1");
    // Nouse Button
    await expect(
      page.locator("body > nav > ul > li:nth-child(5) > a")
    ).toHaveAttribute("href", "/website/");
    // Muse Button
    await expect(
      page.locator("body > nav > ul > li:nth-child(7) > a")
    ).toHaveAttribute("href", "/muse");
  });
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
          page.locator(".featured-articles >> .article")
        ).toHaveCount(landscapeFeaturedArticles.length);
      });

      test("Display the correct information and have the correct links to articles", async ({
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
        for (let i = 0; i < landscapeFeaturedArticles.length; i++) {
          const article = page.locator(`.featured-articles >> .article`).nth(i);
          const articleImage = article.locator("img");
          const articleLinks = article.locator("a");

          // Checking Image
          if (i === 0) {
            // Article 1 has a custom image
            await expect(articleImage).toHaveAttribute(
              "src",
              "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
            );
          } else {
            // All other articles have the default image
            await expect(articleImage).toHaveAttribute(
              "src",
              process.env.fileStoreUrl +
                "/nouseSiteAssets/imageArchive-comp.jpg"
            );
          }
          await expect(articleLinks.nth(0)).toHaveAttribute(
            "href",
            `/2023/02/24/test-article-${i + 1}`
          );

          // Checking Category
          await expect(articleLinks.nth(1)).toHaveAttribute(
            "href",
            `/testCategory1`
          );
          await expect(articleLinks.nth(1)).toHaveText("Test");
          await expect(articleLinks.nth(1)).toHaveCSS(
            "color",
            "rgb(237, 179, 33)"
          ); // Playwright doesn't support hex values for toHaveCSS.

          // Checking Headline
          await expect(articleLinks.nth(2)).toHaveAttribute(
            "href",
            `/2023/02/24/test-article-${i + 1}`
          );
          await expect(articleLinks.nth(2)).toHaveText(
            `Article Draft ${i + 1}`
          );

          // Checking Author
          await expect(articleLinks.nth(3)).toHaveAttribute(
            "href",
            `/author/1`
          );
          await expect(articleLinks.nth(3)).toHaveText(`By John Doe`);

          // Checking Excerpt
          await expect(articleLinks.nth(4)).toHaveAttribute(
            "href",
            `/2023/02/24/test-article-${i + 1}`
          );
          await expect(articleLinks.nth(4)).toHaveText(
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
          page.locator(".featured-articles >> .article")
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
        const article = page.locator(`.featured-articles >> .article`).nth(0);
        const articleImage = article.locator("img");
        const articleLinks = article.locator("a");

        // Checking Image
        await expect(articleImage).toHaveAttribute(
          "src",
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
        );
        await expect(articleLinks.nth(0)).toHaveAttribute(
          "href",
          `/2023/02/24/test-article-7`
        );

        // Checking Category
        await expect(articleLinks.nth(1)).toHaveAttribute(
          "href",
          `/testCategory1`
        );
        await expect(articleLinks.nth(1)).toHaveText("Test");
        await expect(articleLinks.nth(1)).toHaveCSS(
          "color",
          "rgb(237, 179, 33)"
        ); // Playwright doesn't support hex values for toHaveCSS.

        // Checking Headline
        await expect(articleLinks.nth(2)).toHaveAttribute(
          "href",
          `/2023/02/24/test-article-7`
        );
        await expect(articleLinks.nth(2)).toHaveText(`Article Draft 7`);

        // Checking Author
        await expect(articleLinks.nth(3)).toHaveAttribute("href", `/author/1`);
        await expect(articleLinks.nth(3)).toHaveText(`By John Doe`);

        // Checking Excerpt
        await expect(articleLinks.nth(4)).toHaveAttribute(
          "href",
          `/2023/02/24/test-article-7`
        );
        await expect(articleLinks.nth(4)).toHaveText(`Article 7 Excerpt`);
      });

      if (landscapeFeaturedArticles.length > 1) {
        test(`Display the correct information and have the correct links to the landscape articles ${landscapeFeaturedArticles}`, async ({
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
          for (let i = 1; i < landscapeFeaturedArticles.length; i++) {
            const article = page
              .locator(`.featured-articles >> .article`)
              .nth(i);
            const articleImage = article.locator("img");
            const articleLinks = article.locator("a");

            await expect(articleImage).toHaveAttribute(
              "src",
              process.env.fileStoreUrl +
                "/nouseSiteAssets/imageArchive-comp.jpg"
            );
            // }
            await expect(articleLinks.nth(0)).toHaveAttribute(
              "href",
              `/2023/02/24/test-article-${i + 1}`
            );

            // Checking Category
            await expect(articleLinks.nth(1)).toHaveAttribute(
              "href",
              `/testCategory1`
            );
            await expect(articleLinks.nth(1)).toHaveText("Test");
            await expect(articleLinks.nth(1)).toHaveCSS(
              "color",
              "rgb(237, 179, 33)"
            ); // Playwright doesn't support hex values for toHaveCSS.

            // Checking Headline
            await expect(articleLinks.nth(2)).toHaveAttribute(
              "href",
              `/2023/02/24/test-article-${i + 1}`
            );
            await expect(articleLinks.nth(2)).toHaveText(
              `Article Draft ${i + 1}`
            );

            // Checking Author
            await expect(articleLinks.nth(3)).toHaveAttribute(
              "href",
              `/author/1`
            );
            await expect(articleLinks.nth(3)).toHaveText(`By John Doe`);

            // Checking Excerpt
            await expect(articleLinks.nth(4)).toHaveAttribute(
              "href",
              `/2023/02/24/test-article-${i + 1}`
            );
            await expect(articleLinks.nth(4)).toHaveText(
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
