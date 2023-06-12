import type { FullConfig } from "@playwright/test";
import prisma from "../src/prisma.js";

async function dbGlobalSetup(config: FullConfig) {
  // Adding Categories
  await prisma.categories.createMany({
    data: [
      {
        categories_id: 1,
        categories_name: "testCategory1", // A Category that should appear
        categories_displayName: "Test",
        categories_showHome: true,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: "#edb321",
        categories_nestUnder: null,
        categories_featured: "1,2,3,4,5",
      },
      {
        categories_id: 2,
        categories_name: "nouse", // A Category that should appear with Nouse picture
        categories_displayName: "Nouse",
        categories_showHome: true,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: null,
      },
      {
        // Muse has an ID of 4 in production database, replicated here
        categories_id: 4,
        categories_name: "muse", // A Category that should appear with Muse picture
        categories_displayName: "Muse",
        categories_showHome: true,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: null,
        categories_featured: "8, 9",
      },
      {
        categories_id: 5,
        categories_name: "features",
        categories_displayName: "Features",
        categories_showHome: true,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: 4,
        categories_featured: "8, 9",
      },
      {
        categories_id: 6,
        categories_name: "muse-columns",
        categories_displayName: "Columns",
        categories_showHome: true,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: 4,
        categories_featured: "10, 11",
      },
      {
        categories_id: 7,
        categories_name: "testNestedCategory",
        categories_displayName: "Nested category",
        categories_showHome: false,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: 1,
        categories_featured: null,
      },
      {
        categories_id: 8,
        categories_name: "testMuseNestedCategory",
        categories_displayName: "Muse Nested category",
        categories_showHome: false,
        categories_showPublic: true,
        categories_showMenu: true,
        categories_backgroundColor: null,
        categories_nestUnder: 5,
        categories_featured: null,
      },
    ],
  });

  // Adding an Edition
  await prisma.editions.createMany({
    data: [
      {
        editions_name: "Test Edition", // A print edition with a print number
        editions_slug: "test-edition",
        editions_deleted: false,
        editions_thumbnail: 1,
        editions_printNumber: 1,
        editions_show: true,
        editions_type: "Print Edition",
        editions_published: new Date("2023-02-24 12:00:00"),
        editions_pdf: 3,
      },
      {
        editions_name: "3 January 2023", // A print edition with the date as the name and no print number
        editions_slug: "test-edition-2",
        editions_deleted: false,
        editions_thumbnail: 4,
        editions_show: true,
        editions_type: "Print Edition",
        editions_published: new Date("2023-01-03 12:00:00"),
        editions_pdfOriginal: 5,
      },
      {
        editions_name: "Test Web Edition", // A web edition
        editions_slug: "test-web-edition",
        editions_deleted: false,
        editions_thumbnail: 6,
        editions_show: true,
        editions_type: "Web Edition",
        editions_published: new Date("2023-01-01 12:00:00"),
        editions_featuredHighlights:
          '{ "sections": [ { "name": "Nouse", "articles": [ "1", "2", "3" ], "headerImage": false, "customBoxes": [ { "type": "text", "text": "Custom Box Text 1", "title": "Custom Box 1" }, { "type": "text", "text": "Custom Box Text 2", "title": "Custom Box 2" } ], "customBoxHeader": { "title": "", "text": "" } }, { "name": "Muse", "articles": ["8", "9"], "headerImage": 2, "customBoxes": [], "customBoxHeader": { "type": "text", "text": "Custom Box Text", "title": "Custom Box Header" } } ] }',
      },
    ],
  });

  // Adding Images
  await prisma.s3files.createMany({
    data: [
      {
        s3files_id: 1,
        s3files_path: "db/webUploads/public/EDITION-THUMBNAIL",
        s3files_filename: "1676037110155-67511536907255130000-503jpg",
        s3files_extension: "jpg",
        s3files_region: "eu-central-003",
        s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
        s3files_cdn_endpoint:
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
        s3files_bucket: "nousePublicBackendUploads",
        s3files_meta_size: 176845,
      },
      {
        s3files_id: 2,
        s3files_path: "db/webUploads/public/ARTICLE-THUMBNAIL",
        s3files_filename:
          "1673190924591-33954450307270480000-jullietesspotifywrappedjpg",
        s3files_extension: "jpg",
        s3files_region: "eu-central-003",
        s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
        s3files_cdn_endpoint:
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
        s3files_bucket: "nousePublicBackendUploads",
        s3files_meta_size: 32848,
      },
      {
        s3files_id: 3,
        s3files_path: "db/webUploads/public/EDITION-PDF",
        s3files_filename: "1676036977957-53461650533729990000-nouse503pdf",
        s3files_extension: "pdf",
        s3files_region: "eu-central-003",
        s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
        s3files_cdn_endpoint:
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
        s3files_bucket: "nousePublicBackendUploads",
        s3files_meta_size: 6541998,
      },
      {
        s3files_id: 4,
        s3files_path: "db/webUploads/public/EDITION-THUMBNAIL",
        s3files_filename: "1668680604820-51650241314374140000-502jpg",
        s3files_extension: "jpg",
        s3files_region: "eu-central-003",
        s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
        s3files_cdn_endpoint:
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
        s3files_bucket: "nousePublicBackendUploads",
        s3files_meta_size: 155311,
      },
      {
        s3files_id: 5,
        s3files_path: "db/webUploads/public/EDITION-PDF",
        s3files_filename: "1668680182051-68589577660991020000-502pdf",
        s3files_extension: "pdf",
        s3files_region: "eu-central-003",
        s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
        s3files_cdn_endpoint:
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
        s3files_bucket: "nousePublicBackendUploads",
        s3files_meta_size: 5819475,
      },
      {
        s3files_id: 6,
        s3files_path: "db/webUploads/public/EDITION-THUMBNAIL",
        s3files_filename:
          "1677873768325-93595571150116960000-nouseinbrief2jpeg",
        s3files_extension: "jpeg",
        s3files_region: "eu-central-003",
        s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
        s3files_cdn_endpoint:
          "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
        s3files_bucket: "nousePublicBackendUploads",
        s3files_meta_size: 789043,
      },
    ],
  });

  // Creating a User
  await prisma.users.createMany({
    data: [
      {
        users_userid: 1,
        users_name1: "John",
        users_name2: "Doe",
        users_thumbnail: "2",
        articles_featured: "1,2",
        users_bio: "Hi there. Hope you like my articles",
        users_pronouns: "he/him",
        users_googleAppsUsernameNouse: "john.doe",
      },
      {
        users_userid: 2,
        users_name1: "Jane",
        users_name2: "Doe",
        users_thumbnail: "2",
        users_bio: "Hi there. Hope you like my articles",
        users_pronouns: "she/her",
        users_googleAppsUsernameNouse: "jane.doe",
      },
    ],
  });

  // Creating Featured Articles
  await prisma.featuredHome.createMany({
    data: [
      {
        featuredHome_id: 1,
        featuredHome_articles: "",
        users_userid: 1,
      },
    ],
  });

  // Creating Articles
  await prisma.articles.createMany({
    data: [
      {
        articles_id: 1, // Landscape article with custom thumbnail
        articles_slug: "test-article-1",
        articles_categories: "1",
        articles_isThumbnailPortrait: false,
        articles_displayImages: true,
        articles_showInLists: true,
        articles_thumbnail: "2",
        articles_published: new Date("2023-02-24 12:00:00"),
      },
      {
        articles_id: 2, // Landscape article with no thumbnail
        articles_slug: "test-article-2",
        articles_categories: "1",
        articles_isThumbnailPortrait: false,
        articles_displayImages: false,
        articles_showInLists: true,
        articles_published: new Date("2023-02-24 9:00:00"),
      },
      {
        articles_id: 3,
        articles_slug: "test-article-3",
        articles_categories: "1",
        articles_isThumbnailPortrait: false,
        articles_displayImages: false,
        articles_showInLists: true,
        articles_published: new Date("2023-02-24 10:00:00"),
      },
      {
        articles_id: 4,
        articles_slug: "test-article-4",
        articles_categories: "1",
        articles_isThumbnailPortrait: false,
        articles_displayImages: false,
        articles_showInLists: true,
        articles_published: new Date("2023-02-24 11:00:00"),
      },
      {
        articles_id: 5,
        articles_slug: "test-article-5",
        articles_categories: "1",
        articles_isThumbnailPortrait: false,
        articles_displayImages: false,
        articles_showInLists: true,
        articles_published: new Date("2023-02-24 12:00:00"),
      },
      {
        articles_id: 6,
        articles_slug: "test-article-6",
        articles_categories: "1",
        articles_isThumbnailPortrait: false,
        articles_displayImages: false,
        articles_showInLists: true,
        articles_published: new Date("2023-02-24 13:00:00"),
      },
      {
        articles_id: 7, // Portrait article with custom thumbnail
        articles_slug: "test-article-7",
        articles_categories: "1",
        articles_isThumbnailPortrait: true,
        articles_displayImages: true,
        articles_thumbnail: "2",
        articles_showInLists: true,
        articles_published: new Date("2023-02-24 14:00:00"),
      },
      {
        articles_id: 8, // Landscape article with custom thumbnail
        articles_slug: "test-article-8",
        articles_categories: "",
        articles_isThumbnailPortrait: false,
        articles_displayImages: true,
        articles_showInLists: true,
        articles_thumbnail: "2",
        articles_published: new Date("2023-02-24 12:00:00"),
      },
      {
        articles_id: 9, // Landscape article with custom thumbnail
        articles_slug: "test-article-9",
        articles_categories: "",
        articles_isThumbnailPortrait: false,
        articles_displayImages: true,
        articles_showInLists: true,
        articles_thumbnail: "2",
        articles_published: new Date("2023-02-24 12:00:00"),
      },
      {
        articles_id: 10, // Landscape article with custom thumbnail
        articles_slug: "test-article-10",
        articles_categories: "",
        articles_isThumbnailPortrait: false,
        articles_displayImages: true,
        articles_showInLists: true,
        articles_thumbnail: "2",
        articles_published: new Date("2023-02-24 12:00:00"),
      },
      {
        articles_id: 11, // Landscape article with custom thumbnail
        articles_slug: "test-article-11",
        articles_categories: "",
        articles_isThumbnailPortrait: false,
        articles_displayImages: true,
        articles_showInLists: true,
        articles_thumbnail: "2",
        articles_published: new Date("2023-02-24 12:00:00"),
      },
    ],
  });

  // Creating Article Drafts
  await prisma.articlesDrafts.createMany({
    data: [
      {
        articles_id: 1,
        articlesDrafts_headline: "Article Draft 1",
        articlesDrafts_excerpt: "Article 1 Excerpt",
        articlesDrafts_userid: 1,
        articlesDrafts_text:
          "<p>This is raw HTML, as it comes from the backend.</p>",
      },
      {
        articles_id: 2,
        articlesDrafts_headline: "Article Draft 2",
        articlesDrafts_excerpt: "Article 2 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 3,
        articlesDrafts_headline: "Article Draft 3",
        articlesDrafts_excerpt: "Article 3 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 4,
        articlesDrafts_headline: "Article Draft 4",
        articlesDrafts_excerpt: "Article 4 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 5,
        articlesDrafts_headline: "Article Draft 5",
        articlesDrafts_excerpt: "Article 5 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 6,
        articlesDrafts_headline: "Article Draft 6",
        articlesDrafts_excerpt: "Article 6 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 7,
        articlesDrafts_headline: "Article Draft 7",
        articlesDrafts_excerpt: "Article 7 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 8,
        articlesDrafts_headline: "Article Draft 8",
        articlesDrafts_excerpt: "Article 8 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 9,
        articlesDrafts_headline: "Article Draft 9",
        articlesDrafts_excerpt: "Article 9 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 10,
        articlesDrafts_headline: "Article Draft 10",
        articlesDrafts_excerpt: "Article 10 Excerpt",
        articlesDrafts_userid: 1,
      },
      {
        articles_id: 11,
        articlesDrafts_headline: "Article Draft 11",
        articlesDrafts_excerpt: "Article 11 Excerpt",
        articlesDrafts_userid: 1,
      },
    ],
  });

  // Creating Article Categories
  await prisma.articlesCategories.createMany({
    data: [
      {
        articles_id: 1,
        categories_id: 1,
      },
      {
        articles_id: 2,
        categories_id: 1,
      },
      {
        articles_id: 3,
        categories_id: 1,
      },
      {
        articles_id: 4,
        categories_id: 1,
      },
      {
        articles_id: 5,
        categories_id: 1,
      },
      {
        articles_id: 6,
        categories_id: 1,
      },
      {
        articles_id: 7,
        categories_id: 1,
      },
      {
        articles_id: 8,
        categories_id: 4,
      },
      {
        articles_id: 8,
        categories_id: 5,
      },
      {
        articles_id: 9,
        categories_id: 4,
      },
      {
        articles_id: 9,
        categories_id: 5,
      },
      {
        articles_id: 10,
        categories_id: 4,
      },
      {
        articles_id: 10,
        categories_id: 6,
      },
      {
        articles_id: 11,
        categories_id: 4,
      },
      {
        articles_id: 11,
        categories_id: 6,
      },
    ],
  });

  await prisma.articlesAuthors.createMany({
    data: [
      {
        articles_id: 1,
        users_userid: 1,
      },
      {
        articles_id: 1,
        users_userid: 2,
      },
      {
        articles_id: 2,
        users_userid: 1,
      },
      {
        articles_id: 3,
        users_userid: 1,
      },
      {
        articles_id: 4,
        users_userid: 1,
      },
      {
        articles_id: 5,
        users_userid: 1,
      },
      {
        articles_id: 6,
        users_userid: 1,
      },
      {
        articles_id: 7,
        users_userid: 1,
      },
      {
        articles_id: 8,
        users_userid: 1,
      },
      {
        articles_id: 9,
        users_userid: 1,
      },
      {
        articles_id: 10,
        users_userid: 1,
      },
      {
        articles_id: 11,
        users_userid: 1,
      },
    ],
  });

  await prisma.positions.createMany({
    data: [
      {
        positions_id: 1,
        positions_displayName: "Editor",
        positions_rank: 1,
        positions_teamPageGroup: 1,
      },
      {
        positions_id: 2,
        positions_displayName: "Deputy Editor",
        positions_rank: 2,
        positions_teamPageGroup: 1,
      },
      {
        positions_id: 3,
        positions_displayName: "News Editor",
        positions_rank: 7,
        positions_teamPageGroup: 2,
      },
    ],
  });

  await prisma.userPositions.createMany({
    data: [
      {
        userPositions_id: 1,
        userPositions_start: new Date("2023-02-24 12:00:00"),
        userPositions_end: new Date("2033-02-24 12:00:00"),
        userPositions_show: true,
        positions_id: 1,
        users_userid: 1,
      },
      {
        userPositions_id: 2,
        userPositions_start: new Date("2022-02-24 12:00:00"),
        userPositions_end: new Date("2023-02-24 12:00:00"),
        userPositions_show: true,
        positions_id: 2,
        users_userid: 1,
      },
      {
        userPositions_id: 3,
        userPositions_start: new Date("2022-02-24 12:00:00"),
        userPositions_end: new Date("2033-02-24 12:00:00"),
        userPositions_show: true,
        positions_id: 3,
        users_userid: 2,
      },
    ],
  });
}

export default dbGlobalSetup;
