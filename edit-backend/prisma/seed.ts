import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOSTNAME,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Only run in development
  if (process.env.NODE_ENV !== "development") {
    console.log("Skipping seed in non-development environment");
    return;
  }

  console.log("Seeding database...");

  await prisma.$transaction(async (tx) => {
    await tx.positionsGroups.createMany({
      data: [
        {
          positionsGroups_id: 1,
          positionsGroups_name: "Administrator",
          positionsGroups_actions:
            "11,12,4,5,6,7,9,10,13,2,3,14,20,30,21,22,40,41,42,15,43,44,45,46,47,48,49,50,51,52,53,54,32,31,33,55,56,57,58",
        },
        {
          positionsGroups_id: 2,
          positionsGroups_name: "Managerial Committee",
          positionsGroups_actions:
            "3,11,2,6,20,4,30,21,22,40,44,45,48,49,50,51,52,53,54,32,31,33,57,58",
        },
        {
          positionsGroups_id: 3,
          positionsGroups_name: "Editor",
          positionsGroups_actions:
            "2,20,4,30,21,11,40,44,45,49,32,31,33,57,51,50,52",
        },
      ],
      skipDuplicates: true,
    });

    await tx.positions.createMany({
      data: [
        {
          positions_displayName: "Muse Radio Editor",
          positions_positionsGroups: "3",
          positions_rank: 51,
          positions_teamPageGroup: 1,
        },
        {
          positions_displayName: "Nouse Radio Editor",
          positions_positionsGroups: "3",
          positions_rank: 52,
          positions_teamPageGroup: 1,
        },
        {
          positions_displayName: "Puzzles Editor",
          positions_positionsGroups: "3",
          positions_rank: 53,
          positions_teamPageGroup: 1,
        },
        {
          positions_displayName: "Technical Director",
          positions_positionsGroups: "1",
          positions_rank: 35,
          positions_teamPageGroup: 4,
        },
      ],
      skipDuplicates: true,
    });

    await tx.categories.createMany({
      data: [
        {
          categories_id: 2,
          categories_showHome: true,
          categories_displayName: "News",
          categories_showMenu: true,
          categories_name: "news",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: 1,
          categories_nestUnder: null,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: "#173B88",
          categories_backgroundColorContrast: "ffffff",
          categories_customTheme: null,
          categories_socialMediaOverlay: "news",
        },
        {
          categories_id: 4,
          categories_showHome: true,
          categories_displayName: "Muse",
          categories_showMenu: true,
          categories_name: "muse",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: 3,
          categories_nestUnder: null,
          categories_showSub: true,
          categories_facebook: "https://www.facebook.com/nousemuse/?ref=br_rs",
          categories_twitter: "https://twitter.com/NouseMuse",
          categories_instagram: "https://www.instagram.com/yorkmuse/",
          categories_backgroundColor: "#000000",
          categories_backgroundColorContrast: "ffffff",
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        },
        {
          categories_id: 7,
          categories_showHome: true,
          categories_displayName: "Sport",
          categories_showMenu: true,
          categories_name: "sport",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: 7,
          categories_nestUnder: null,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: "https://www.instagram.com/nousesport/",
          categories_backgroundColor: "#FDC300",
          categories_backgroundColorContrast: "000000",
          categories_customTheme: null,
          categories_socialMediaOverlay: "sport",
        },
        {
          categories_id: 8,
          categories_showHome: true,
          categories_displayName: "Investigation",
          categories_showMenu: true,
          categories_name: "investigation",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: null,
          categories_nestUnder: 2,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: null,
          categories_backgroundColorContrast: null,
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        },
        {
          categories_id: 9,
          categories_showHome: true,
          categories_displayName: "Gaming",
          categories_showMenu: true,
          categories_name: "gaming",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: null,
          categories_nestUnder: 4,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: null,
          categories_backgroundColorContrast: null,
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        },
        {
          categories_id: 10,
          categories_showHome: true,
          categories_displayName: "College Sport",
          categories_showMenu: true,
          categories_name: "college-sport",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: null,
          categories_nestUnder: 7,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: null,
          categories_backgroundColorContrast: null,
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        },
        {
          categories_id: 11,
          categories_showHome: true,
          categories_displayName: "University Sport",
          categories_showMenu: true,
          categories_name: "university-sport",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: null,
          categories_nestUnder: 7,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: null,
          categories_backgroundColorContrast: null,
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        },
        {
          categories_id: 12,
          categories_showHome: true,
          categories_displayName: "National Sport",
          categories_showMenu: true,
          categories_name: "national-sport",
          categories_showPublic: true,
          categories_showAdmin: true,
          categories_featured: null,
          categories_order: null,
          categories_nestUnder: 7,
          categories_showSub: true,
          categories_facebook: null,
          categories_twitter: null,
          categories_instagram: null,
          categories_backgroundColor: null,
          categories_backgroundColorContrast: null,
          categories_customTheme: null,
          categories_socialMediaOverlay: null,
        },
      ],
      skipDuplicates: true,
    });

    await tx.s3files.createMany({
      data: [
        {
          s3files_id: 1,
          s3files_path: "db/webUploads/public/ARTICLE-THUMBNAIL",
          s3files_filename:
            "1750089812382-88602768069951200000-1224434610845949882308974206644579337500187ojpgpng",
          s3files_extension: "png",
          s3files_original_name:
            "12244346_1084594988230897_4206644579337500187_o.jpg.png",
          s3files_region: "eu-central-003",
          s3files_endpoint: "s3.eu-central-003.backblazeb2.com",
          s3files_cdn_endpoint:
            "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads",
          s3files_bucket: "nousePublicBackendUploads",
          s3files_compressed: true,
          s3files_meta_size: 57596,
          s3files_meta_public: true,
          s3files_meta_type: 3,
          s3files_meta_uploaded: new Date("2025-06-16 16:03:45"),
          s3files_meta_physicallyStored: true,
        },
      ],
      skipDuplicates: true,
    });

    await tx.articles.createMany({
      data: [
        {
          articles_id: 1,
          articles_published: new Date("2025-06-16T15:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 2,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-muse",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 3,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-sport",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 4,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-investigation",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 5,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-gaming",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 6,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-college-sport",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 7,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-university-sport",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
        {
          articles_id: 8,
          articles_published: new Date("2025-06-16T16:59:19"),
          articles_showInLists: true,
          articles_showInSearch: true,
          articles_showInAdmin: true,
          articles_type: 6,
          articles_slug: "testing-national-sport",
          articles_thumbnail: "1",
          articles_lifetimeViews: 0,
          articles_socialConfig: "1,1,1,1",
        },
      ],
      skipDuplicates: true,
    });

    await tx.articlesCategories.createMany({
      data: [
        { articles_id: 1, categories_id: 2 },
        { articles_id: 2, categories_id: 4 },
        { articles_id: 3, categories_id: 7 },
        { articles_id: 4, categories_id: 8 },
        { articles_id: 5, categories_id: 9 },
        { articles_id: 6, categories_id: 10 },
        { articles_id: 7, categories_id: 11 },
        { articles_id: 8, categories_id: 12 },
      ],
      skipDuplicates: true,
    });

    await tx.users.createMany({
      data: [
        {
          users_userid: 1,
          users_name1: "Test",
          users_name2: "Testing",
          users_changepass: false,
          users_suspended: false,
        },
      ],
      skipDuplicates: true,
    });

    await tx.articlesAuthors.createMany({
      data: [
        { articles_id: 1, users_userid: 1 },
        { articles_id: 2, users_userid: 1 },
        { articles_id: 3, users_userid: 1 },
        { articles_id: 4, users_userid: 1 },
        { articles_id: 5, users_userid: 1 },
        { articles_id: 6, users_userid: 1 },
        { articles_id: 7, users_userid: 1 },
        { articles_id: 8, users_userid: 1 },
      ],
      skipDuplicates: true,
    });

    await tx.articlesDrafts.createMany({
      data: [
        {
          articles_id: 1,
          articlesDrafts_timestamp: new Date("2025-06-16T17:54:18"),
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing",
          articlesDrafts_excerpt: "testing",
          articlesDrafts_text: "<p>testing</p>",
          articlesDrafts_markdown: "testing",
          articlesDrafts_thumbnailCredit: "Nouse",
        },
        {
          articles_id: 2,
          articlesDrafts_timestamp: new Date("2025-06-16T18:54:18"),
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing muse",
          articlesDrafts_excerpt: "testing muse",
          articlesDrafts_text: "<p>testing muse</p>",
          articlesDrafts_markdown: "testing muse",
          articlesDrafts_thumbnailCredit: "Muse",
        },
        {
          articles_id: 3,
          articlesDrafts_timestamp: new Date("2025-06-16T18:54:18"),
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing sport",
          articlesDrafts_excerpt: "testing sport",
          articlesDrafts_text: "<p>testing sport</p>",
          articlesDrafts_markdown: "testing sport",
          articlesDrafts_thumbnailCredit: "Nouse Sport",
        },
        {
          articles_id: 4,
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing investigation",
          articlesDrafts_excerpt: "testing investigation",
          articlesDrafts_text: "<p>testing investigation</p>",
          articlesDrafts_markdown: "testing investigation",
          articlesDrafts_thumbnailCredit: "Nouse",
        },
        {
          articles_id: 5,
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing gaming",
          articlesDrafts_excerpt: "testing gaming",
          articlesDrafts_text: "<p>testing gaming</p>",
          articlesDrafts_markdown: "testing gaming",
          articlesDrafts_thumbnailCredit: "Nouse",
        },
        {
          articles_id: 6,
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing college sport",
          articlesDrafts_excerpt: "testing college sport",
          articlesDrafts_text: "<p>testing college sport</p>",
          articlesDrafts_markdown: "testing college sport",
          articlesDrafts_thumbnailCredit: "Nouse Sport",
        },
        {
          articles_id: 7,
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing university sport",
          articlesDrafts_excerpt: "testing university sport",
          articlesDrafts_text: "<p>testing university sport</p>",
          articlesDrafts_markdown: "testing university sport",
          articlesDrafts_thumbnailCredit: "Nouse Sport",
        },
        {
          articles_id: 8,
          articlesDrafts_userid: 1,
          articlesDrafts_headline: "testing national sport",
          articlesDrafts_excerpt: "testing national sport",
          articlesDrafts_text: "<p>testing national sport</p>",
          articlesDrafts_markdown: "testing national sport",
          articlesDrafts_thumbnailCredit: "Nouse Sport",
        },
      ],
      skipDuplicates: true,
    });

    await tx.featuredHome.createMany({
      data: [
        {
          featuredHome_articles: "1",
          users_userid: 1,
        },
      ],
      skipDuplicates: true,
    });

    await tx.editions.createMany({
      data: [
        {
          editions_id: 1,
          editions_name: "Test edition",
          editions_slug: "test",
          editions_show: true,
          editions_showHome: true,
          editions_thumbnail: 1,
          editions_type: "Print Edition",
        },
      ],
      skipDuplicates: true,
    });

    await tx.categories.update({
      where: { categories_id: 2 },
      data: { categories_featured: "1" },
    });

    await tx.categories.update({
      where: { categories_id: 4 },
      data: { categories_featured: "2" },
    });

    await tx.categories.update({
      where: { categories_id: 7 },
      data: { categories_featured: "3" },
    });

    await tx.categories.update({
      where: { categories_id: 8 },
      data: { categories_featured: "4" },
    });

    await tx.categories.update({
      where: { categories_id: 9 },
      data: { categories_featured: "5" },
    });

    await tx.categories.update({
      where: { categories_id: 10 },
      data: { categories_featured: "6" },
    });

    await tx.categories.update({
      where: { categories_id: 11 },
      data: { categories_featured: "7" },
    });

    await tx.categories.update({
      where: { categories_id: 12 },
      data: { categories_featured: "8" },
    });
  });

  console.log("Seeding complete");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
