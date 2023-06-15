import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./articles/2023/02/24/test-article-1");
});

test("Has correct title", async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Article Draft 1 - Nouse");
});

test("Article content is correct", async ({ page }) => {
  // Title is correct
  const title = page.locator("[id=article-title]");
  await expect(title).toHaveText("Article Draft 1");

  // Timestamp is correct
  const timeStamp = page.locator("[id=article-timestamp]");
  await expect(timeStamp).toHaveText("24/02/2023");

  // Excerpt is correct
  const excerpt = page.locator("[id=article-excerpt]");
  await expect(excerpt).toHaveText("Article 1 Excerpt");

  // Image is correct
  const image = page.locator("[id=article-image]");
  await expect(image).toHaveAttribute(
    "src",
    "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/1673190924591-33954450307270480000-jullietesspotifywrappedjpg_large.jpg"
  );

  // Content is correct
  const content = page.locator("[id=article-content]");
  const contentTree = content.locator("p");
  await expect(contentTree).toHaveCount(1);
  await expect(contentTree).toHaveText(
    "This is raw HTML, as it comes from the backend."
  );
});

test("Styles are assigned correctly", async ({ page }) => {
  const credits = page.locator("[id=article-credits]");
  await expect(credits).toHaveClass(/category-color-testCategory1/);
});

test("Similar articles are correct", async ({ page }) => {
  const container = page.locator("[id=similar-articles-container]");
  await expect(container).toHaveText(/Article Draft 4/);
  await expect(container).toHaveText(/Article Draft 5/);
  await expect(container).toHaveText(/Article Draft 6/);
  await expect(container).toHaveText(/Article Draft 7/);

  const images = await container.locator("img").all();

  for (let i = 0; i < images.length; i++) {
    if (i === 0) await expect(images[i]).toHaveClass(/aspect-portrait-video/);
    else await expect(images[i]).toHaveClass(/aspect-video/);
  }
});
