import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { ArticleAuthor, ArticleCategory, IArticle } from "@/lib/types";
import { getArticleImage, getSimilarArticles } from "@/lib/articles";
import dateFormatter from "@/lib/dateFormatter";
import { getCategoryLink, getParentCategory } from "@/lib/categories";
import crypto from "crypto";
import he from "he";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  const { slug, preview, post, key } = req.query;

  const isPreview = preview && post && key;

  const slugSanitised = sanitiseSearchTerm(slug);

  const cleanSlug = decodeURIComponent(slugSanitised || "");

  const articleRaw = await prisma.articles.findFirst({
    where: {
      articles_showInLists: !isPreview,
      articles_slug: cleanSlug,
    },
    include: {
      articlesDrafts: {
        // Get the latest draft for every featured article
        orderBy: {
          articlesDrafts_timestamp: "desc",
        },
        take: 1,
      },
      categories: {
        where: {
          category: {
            categories_showPublic: true,
          },
        },
        include: {
          category: true,
        },
      },
      users: {
        include: { users: true },
      },
    },
  });

  if (!articleRaw) {
    res.status(404).json({ message: "Article not found" });
    return;
  }

  if (isPreview) {
    const expectedHash = crypto
      .createHash("md5")
      .update(articleRaw.articles_id.toString())
      .digest("hex");
    if (expectedHash !== post) {
      res.status(404).json({ message: "Article not found" });
      return;
    }
  }
  if (articleRaw.articlesDrafts.length <= 0) {
    res.status(404).json({ message: "Article not found" });
    return;
  }
  if (!articleRaw.articlesDrafts![0]) {
    res.status(404).json({ message: "Article not found" });
    return;
  }

  const imageURL = await getArticleImage(articleRaw);

  const authors: ArticleAuthor[] = articleRaw.users.map(({ users }) => {
    const author: ArticleAuthor = {
      users_userid: users.users_userid,
      users_name1: he.decode(users.users_name1 || ""),
      users_name2: he.decode(users.users_name2 || ""),
    };

    return author;
  });

  const categories: ArticleCategory[] = articleRaw.categories.map(
    ({ category }) => {
      const cat: ArticleCategory = {
        id: category.categories_id,
        name: category.categories_name,
        displayName: category.categories_displayName,
        colour: category.categories_backgroundColor,
        link: getCategoryLink(
          String(category.categories_name),
          Number(category.categories_nestUnder),
        ),
        nestUnder: category.categories_nestUnder,
      };
      return cat;
    },
  );

  const temp = getParentCategory(articleRaw.categories);

  const category: ArticleCategory = {
    id: temp.categories_id,
    name: temp.categories_name,
    displayName: temp.categories_displayName,
    colour: String(temp.categories_backgroundColor),
    link: getCategoryLink(
      String(temp.categories_name),
      Number(temp.categories_nestUnder),
    ),
    nestUnder: temp.categories_nestUnder,
  };

  const similarRaw = await getSimilarArticles(
    category.id,
    articleRaw.articles_id,
  );
  const similar = await Promise.all(
    similarRaw.map(async (similarArticle) => {
      const authorsSimilar: ArticleAuthor[] = similarArticle.users.map(
        ({ users }) => {
          const author: ArticleAuthor = {
            users_userid: users.users_userid,
            users_name1: he.decode(users.users_name1 || ""),
            users_name2: he.decode(users.users_name2 || ""),
          };

          return author;
        },
      );

      const temp = getParentCategory(similarArticle.categories);

      const imageURL1 = await getArticleImage(similarArticle);

      const category: ArticleCategory = {
        id: temp.categories_id,
        name: temp.categories_name,
        displayName: temp.categories_displayName,
        colour: String(temp.categories_backgroundColor),
        link: getCategoryLink(
          String(temp.categories_name),
          Number(temp.categories_nestUnder),
        ),
        nestUnder: temp.categories_nestUnder,
      };

      const similar: IArticle = {
        id: similarArticle.articles_id,
        headline:
          similarArticle.articlesDrafts.length != 0
            ? similarArticle.articlesDrafts[0].articlesDrafts_headline
            : "Unknown",
        excerpt:
          similarArticle.articlesDrafts.length != 0
            ? similarArticle.articlesDrafts[0].articlesDrafts_excerpt
            : "Unknown",
        articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
          .format(similarArticle.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
          .split("/")
          .reverse()
          .join("/")}/${String(similarArticle.articles_slug)}`,
        thumbnailURL: imageURL1,
        isThumbnailPortrait: similarArticle.articles_isThumbnailPortrait,
        authors: authorsSimilar,
        parentCategory: category,
        displayImages: Boolean(similarArticle.articles_displayImages),
        categories: null,
        text: null,
        thumbnailCredit: null,
        articleType: null,
        published: null,
        similarArticles: null,
      };
      return similar;
    }),
  );

  const article: IArticle = {
    id: articleRaw.articles_id,
    articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
      .format(articleRaw.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
      .split("/")
      .reverse()
      .join("/")}/${String(articleRaw.articles_slug)}`,
    thumbnailURL: imageURL,
    isThumbnailPortrait: articleRaw.articles_isThumbnailPortrait,
    thumbnailCredit:
      articleRaw.articlesDrafts![0].articlesDrafts_thumbnailCredit,
    headline:
      articleRaw.articlesDrafts.length != 0
        ? articleRaw.articlesDrafts![0].articlesDrafts_headline
        : "Unknown",
    excerpt:
      articleRaw.articlesDrafts.length != 0
        ? articleRaw.articlesDrafts![0].articlesDrafts_excerpt
        : "Unknown",
    published: dateFormatter
      .format(articleRaw.articles_published || new Date(0))
      .split("/")
      .reverse()
      .join("/"),
    text: articleRaw.articlesDrafts![0].articlesDrafts_text,
    articleType: articleRaw.articles_type,
    authors: authors,
    parentCategory: category,
    categories: categories,
    similarArticles: similar,
    displayImages: articleRaw.articles_displayImages!,
  };

  res.status(200).json(article);
}
