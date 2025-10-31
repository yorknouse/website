import prisma from "@/lib/prisma";
import { checkUserPermissions, GetUserData } from "@/lib/auth";

export default async function FeaturedArticles() {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(20, userData.actions)) {
    return {};
  }

  const categories = await prisma.categories.findMany({
    where: {
      categories_showAdmin: true,
      categories_showMenu: true,
      OR: [{ categories_nestUnder: null }, { categories_nestUnder: 4 }],
    },
    orderBy: [
      { categories_nestUnder: "asc" },
      { categories_order: "asc" },
      { categories_displayName: "asc" },
    ],
    select: {
      categories_id: true,
      categories_displayName: true,
      categories_featured: true,
      parent: {
        select: { categories_displayName: true },
      },
    },
  });

  // 2️⃣ For each category, pull the featured articles (if any)
  const categoriesWithArticles = await Promise.all(
    categories.map(async (cat) => {
      if (!cat.categories_featured) {
        return { ...cat, ARTICLES: null };
      }

      const articleIds = cat.categories_featured
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      const articles = await Promise.all(
        articleIds.map(async (articleId) => {
          return prisma.articles.findFirst({
            where: {
              articles_id: articleId,
              articles_showInLists: true,
            },
            include: {
              articlesDrafts: {
                orderBy: { articlesDrafts_timestamp: "desc" },
                take: 1,
                select: {
                  articlesDrafts_headline: true,
                },
              },
            },
          });
        }),
      );

      return {
        ...cat,
        ARTICLES: articles
          .filter((a) => !!a)
          .map((a) => ({
            id: a!.articles_id,
            headline: a!.articlesDrafts[0]?.articlesDrafts_headline ?? null,
          })),
      };
    }),
  );

  // 3️⃣ Homepage featured articles
  const latestFeaturedHome = await prisma.featuredHome.findFirst({
    orderBy: { featuredHome_timestamp: "desc" },
  });

  let featuredHomeArticles = null;
  if (latestFeaturedHome?.featuredHome_articles) {
    const articleIds = latestFeaturedHome.featuredHome_articles
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    const articles = await Promise.all(
      articleIds.map(async (articleId) => {
        return prisma.articles.findFirst({
          where: {
            articles_id: articleId,
            articles_showInLists: true,
          },
          include: {
            articlesDrafts: {
              orderBy: { articlesDrafts_timestamp: "desc" },
              take: 1,
              select: { articlesDrafts_headline: true },
            },
          },
        });
      }),
    );

    featuredHomeArticles = articles
      .filter((a) => !!a)
      .map((a) => ({
        id: a!.articles_id,
        headline: a!.articlesDrafts[0]?.articlesDrafts_headline ?? null,
      }));
  }
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Featured Articles</h1>

      <section>
        <h2 className="text-2xl mb-4">Homepage Featured</h2>
        {featuredHomeArticles?.length && featuredHomeArticles !== null ? (
          <ul className={"list-disc ml-6"}>
            {featuredHomeArticles.map((a) => (
              <li key={a.id}>
                {a.id} - {a.headline}
              </li>
            ))}
          </ul>
        ) : (
          <p>No homepage featured articles.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl mb-4">Categories</h2>
        {categoriesWithArticles.map((cat) => (
          <div key={cat.categories_id} className="mb-6">
            <h3 className="text-xl font-semibold">
              {cat.parent?.categories_displayName && (
                <span className="text-gray-500">
                  ({cat.parent?.categories_displayName}){" "}
                </span>
              )}
              {cat.categories_displayName}
            </h3>
            {cat.ARTICLES && cat.ARTICLES.length > 0 ? (
              <ul className={"list-disc ml-6"}>
                {cat.ARTICLES.map((a) => (
                  <li key={a.id}>
                    {a.id} - {a.headline}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No featured articles.</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
