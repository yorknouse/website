import { test, expect } from "@playwright/test";
import prisma from "../src/prisma.js";

test.beforeAll(async () => {
  // Adding Categories
  await prisma.categories.createMany({
    data: [
      {
        categories_name: "testCategory1", // A Category that should appear
        categories_displayName: "Test",
        categories_showHome: true,
        categories_showMenu: true,
        categories_backgroundColor: "edb321",
        categories_nestUnder: null
      },
      {
        categories_name: "nouse", // A Category that should appear with Nouse picture
        categories_displayName: "Nouse",
        categories_showHome: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: null
      },
      {
        categories_name: "muse", // A Category that should appear with Muse picture
        categories_displayName: "Muse",
        categories_showHome: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: null
      },
    ]
  });

  await prisma.editions.create({
    data: {
      editions_name: "Test Edition",
      editions_slug: "test-edition",
      editions_deleted: false,
      editions_thumbnail: 1
    }
  });
  await prisma.s3files.create({
    data: {
      s3files_id: 1,
      s3files_path: "db/webUploads/public/EDITION-THUMBNAIL",
      s3files_filename: "1676037110155-67511536907255130000-503jpg",
      s3files_extension: "jpg",
      s3files_region: "eu-central-003",
      s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
      s3files_cdn_endpoint: "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
      s3files_bucket: "nousePublicBackendUploads",
      s3files_meta_size: 176845,
    }
  });
});

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("has title", async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Welcome to Astro.");
});

test.describe('Navbar', () => {
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
    await expect(page.locator("body > nav > ul > li:nth-child(5) > a > img")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/kingfisher.svg"
    );
    // Checking Muse button Picture
    await expect(page.locator("body > nav > ul > li:nth-child(7) > a > img")).toHaveAttribute(
      "src",
      "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/MUSE%20Logo%20White%20small.png"
    );
  });
  
  test("Has the correct links", async ({
    page,
  }) => {
    // Home Button
    await expect(page.locator("body > nav > ul > li:nth-child(1) > a")).toHaveAttribute("href", "/website/");
    // Test category Button
    await expect(page.locator("body > nav > ul > li:nth-child(3) > a")).toHaveAttribute("href", "/testCategory1");
    // Nouse Button
    await expect(page.locator("body > nav > ul > li:nth-child(5) > a")).toHaveAttribute("href", "/website/");
    // Muse Button
    await expect(page.locator("body > nav > ul > li:nth-child(7) > a")).toHaveAttribute("href", "/muse");
  });
});

test("banner and edition display correct information", async ({ page }) => {
  const join = page.locator("[id='join_nouse']");
  await expect(join.locator("img")).toHaveAttribute(
    "src",
    "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/headerImages/join_nouse.png"
  );

  const edition = page.locator("[id='edition']");
  await expect(edition.locator("div > p")).toHaveCount(2);
  await expect(edition.locator("img")).toHaveAttribute(
    "src", 
    "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/EDITION-THUMBNAIL/1676037110155-67511536907255130000-503jpg_medium.jpg");
});

test.afterAll(async () => {
  const deleteCategories = prisma.categories.deleteMany();
  const deleteUsers = prisma.users.deleteMany();
  const deleteFeaturedHome = prisma.featuredHome.deleteMany();
  const deleteEditions = prisma.editions.deleteMany();
  const deleteS3FILES = prisma.s3files.deleteMany();
  
  await prisma.$transaction([
    deleteCategories,
    deleteUsers,
    deleteFeaturedHome,
    deleteEditions,
    deleteS3FILES
  ]);

  await prisma.$disconnect();
})
