import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  ArticleAuthor,
  ArticleCategory,
  IArticle,
  IAuthorArticles,
} from "@/lib/types";
import { getArticleImage } from "@/lib/articles";
import dateFormatter from "@/lib/dateFormatter";
import { getCategoryLink, getParentCategory } from "@/lib/categories";
import he from "he";

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

  const { authorId, page = "1", limit = "10" } = req.query;

  const authorIdNumber = Number(authorId);
  if (Number.isNaN(authorIdNumber)) {
    return res.status(400).json({ message: "Invalid authorId" });
  }

  let pageNumber = Number(page);
  let articlesPerPage = Number(limit);

  if (Number.isNaN(pageNumber) || pageNumber < 1) pageNumber = 1;
  if (
    Number.isNaN(articlesPerPage) ||
    articlesPerPage < 1 ||
    articlesPerPage > 100
  ) {
    articlesPerPage = 10;
  }

  const authorArticles = await prisma.articlesAuthors.findMany({
    where: {
      users_userid: authorIdNumber,
    },
  });

  let articles: IArticle[];
  let pages: number;

  if (!authorArticles) {
    articles = [];
    pages = 0;
  } else {
    pages = Math.ceil(authorArticles.length / articlesPerPage);
    const articlesIds = authorArticles.reduce((accumulator, authorArticle) => {
      accumulator.push(authorArticle.articles_id);

      return accumulator;
    }, [] as number[]);

    const articlesRaw = await prisma.articles.findMany({
      where: {
        articles_id: {
          in: articlesIds,
        },
        articles_showInLists: true,
      },
      orderBy: {
        articles_published: "desc",
      },
      take: articlesPerPage,
      skip: pageNumber ? (pageNumber - 1) * articlesPerPage : 0,
      include: {
        articlesDrafts: {
          orderBy: {
            articlesDrafts_timestamp: "desc",
          },
          take: 1,
        },
        categories: {
          include: { category: true },
        },
        users: {
          include: { users: true },
        },
      },
    });

    type Category = {
      id: number;
      name: string;
      displayName: string | null;
      colour: string | null;
      nestUnder: number | null;
    };

    const categories = new Map(
      articlesRaw.map((article) => {
        const temp = getParentCategory(article.categories);
        const cat: Category = {
          id: temp.categories_id,
          name: temp.categories_name,
          displayName: temp.categories_displayName,
          colour: temp.categories_backgroundColor,
          nestUnder: temp.categories_nestUnder,
        };
        return [article.articles_id, cat];
      }),
    );

    articles = await Promise.all(
      articlesRaw.map(async (article1) => {
        const s3url = await getArticleImage(article1);

        const authors: ArticleAuthor[] = article1.users.map(({ users }) => {
          const author: ArticleAuthor = {
            users_userid: users.users_userid,
            users_name1: he.decode(users.users_name1 || ""),
            users_name2: he.decode(users.users_name2 || ""),
          };

          return author;
        });

        const category: ArticleCategory = {
          id: Number(categories.get(article1.articles_id)?.id),
          name: String(categories.get(article1.articles_id)?.name),
          displayName: String(
            categories.get(article1.articles_id)?.displayName,
          ),
          colour: String(categories.get(article1.articles_id)?.colour),
          link: getCategoryLink(
            String(categories.get(article1.articles_id)?.name),
            Number(categories.get(article1.articles_id)?.nestUnder),
          ),
          nestUnder: categories.get(article1.articles_id)!.nestUnder,
        };

        const article: IArticle = {
          id: article1.articles_id,
          articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
            .format(article1.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
            .split("/")
            .reverse()
            .join("/")}/${String(article1.articles_slug)}`,
          thumbnailURL: s3url,
          isThumbnailPortrait: article1.articles_isThumbnailPortrait,
          thumbnailCredit:
            article1.articlesDrafts[0].articlesDrafts_thumbnailCredit,
          headline:
            article1.articlesDrafts.length != 0
              ? article1.articlesDrafts[0].articlesDrafts_headline
              : "Unknown",
          excerpt:
            article1.articlesDrafts.length != 0
              ? article1.articlesDrafts[0].articlesDrafts_excerpt
              : "Unknown",
          published: dateFormatter
            .format(article1.articles_published || new Date(0))
            .split("/")
            .reverse()
            .join("/"),
          displayImages: Boolean(article1.articles_displayImages),
          text: null,
          articleType: null,
          authors: authors,
          parentCategory: category,
          categories: null,
          similarArticles: null,
        };

        return article;
      }),
    );
  }

  const authorArticlesReturn: IAuthorArticles = {
    pages: pages,
    articles: articles,
  };

  res.status(200).json(authorArticlesReturn);
}
