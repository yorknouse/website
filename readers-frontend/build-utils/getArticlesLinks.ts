// import { getArticleLink } from "@components/utils/articles.ts";
// import prisma from "../src/prisma";
// import baseUrl from "./baseUrl";
// import type { IArticle } from "@components/types.ts";
//
// export default async function getArticlesLinks() {
//   const nArticles = await prisma.articles.count();
//
//   // Split retrieval in blocks so that Node does not take
//   // too much memory.
//   const blockSize = 1000;
//
//   const articles: IArticle[] = [];
//
//   for (let i = 0; i < Math.ceil(nArticles / blockSize); i++) {
//     const block: IArticle[] = await prisma.articles.findMany({
//       where: {
//         articles_showInLists: true,
//       },
//       take: blockSize,
//       skip: i * blockSize,
//     });
//     articles.push(...block);
//   }
//
//   return articles.map((article) => getArticleLink(article, baseUrl));
// }
