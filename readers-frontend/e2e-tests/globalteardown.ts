import type { FullConfig } from "@playwright/test";
import prisma from "../src/prisma.js";

async function dbGlobalTeardown(config: FullConfig) {
  const deleteCategories = prisma.categories.deleteMany();
  const deleteFeaturedHome = prisma.featuredHome.deleteMany();
  const deleteEditions = prisma.editions.deleteMany();
  const deleteS3FILES = prisma.s3files.deleteMany();
  const deleteArticlesDrafts = prisma.articlesDrafts.deleteMany();
  const deleteArticles = prisma.articles.deleteMany();
  const deleteUsers = prisma.users.deleteMany();
  const deleteArticleCategories = prisma.articlesCategories.deleteMany();

  await prisma.$transaction([
    deleteEditions,
    deleteS3FILES,
    deleteArticleCategories,
    deleteArticlesDrafts,
    deleteArticles,
    deleteFeaturedHome,
    deleteUsers,
    deleteCategories,
  ]);

  await prisma.$disconnect();
}

export default dbGlobalTeardown;
