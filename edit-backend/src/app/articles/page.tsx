import type { Metadata } from "next";
import { getArticles } from "@/lib/articles";
import { Check, EyeIcon, ChartLine, PenLine, Trash } from "lucide-react";
import dateFormatter from "@/lib/dateFormatter";
import ArticleDeleteButton from "@/components/ArticleDeleteButton";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import Pagination from "@/components/Pagination";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";

export const metadata: Metadata = {
  title: "Articles",
};

export default async function Articles({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; user?: string }>;
}) {
  const awaitedSearchParams = await searchParams;
  const pageRaw = awaitedSearchParams.page ?? "1";
  const searchRaw = awaitedSearchParams.search ?? null;
  const userRaw = awaitedSearchParams.user ?? null;
  const page = isNaN(Number(pageRaw)) ? 1 : Number(pageRaw);
  const user = isNaN(Number(userRaw)) ? undefined : Number(userRaw);
  let search: string | null | undefined = sanitiseSearchTerm(searchRaw);
  if (search === null) {
    search = undefined;
  }
  const articles = await getArticles({
    page: page,
    authorId: user,
    search: search,
  });

  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(30, userData.actions)) {
    return {};
  }

  const canEdit = checkUserPermissions(32, userData.actions);
  const canDelete = checkUserPermissions(33, userData.actions);

  let i = -1;

  return (
    <div className="lg:flex min-h-screen bg-gray-200 text-gray-900">
      <div className={"flex flex-col"}>
        <h1 className={"text-2xl font-semibold"}>Articles</h1>
        <br />
        <table className={"table-auto bg-white"}>
          <thead className={"border-b-4 border-gray-600"}>
            <tr>
              <th>ID</th>
              <th>Headline</th>
              <th>Categories</th>
              <th>Edition</th>
              <th>Published</th>
              <th>Updated</th>
              <th>Published author(s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.articles.map((article) => {
              i++;
              return (
                <tr
                  key={article.articles_id}
                  className={`
                  ${
                    !article.articles_showInLists &&
                    !article.articles_showInSearch
                      ? "bg-red-300"
                      : !article.articles_showInLists
                        ? "bg-amber-300"
                        : i % 2 != 0
                          ? "bg-gray-100"
                          : ""
                  }`}
                >
                  <th className={"px-4 py-2"}>{article.articles_id}</th>
                  <td className={"px-4 py-2"}>
                    {article.articlesDrafts[0].articlesDrafts_headline}
                    {!article.articles_showInLists &&
                    !article.articles_showInSearch ? (
                      <span className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm bg-red-500 text-white ml-2">
                        Draft
                      </span>
                    ) : !article.articles_showInLists ? (
                      <span className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm bg-amber-500 text-white ml-2">
                        Show in search only
                      </span>
                    ) : (
                      <></>
                    )}
                  </td>
                  <td className={"px-4 py-2"}>
                    {article.articles_categories.map((category) => (
                      <span
                        key={category.categories_id}
                        className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm"
                        style={{
                          backgroundColor:
                            category.category.categories_backgroundColor ||
                            "#3B82F6", // default blue if none
                          color: category.category
                            .categories_backgroundColorContrast
                            ? `#${category.category.categories_backgroundColorContrast}`
                            : "#fff",
                        }}
                      >
                        {category.category.categories_displayName}
                      </span>
                    ))}
                  </td>
                  <td className={"px-4 py-2"}>
                    {article.edition && (
                      <a href={`/editions/${article.editions_id}`}>
                        {article.edition.editions_printNumber !== null ? (
                          <>№{article.edition.editions_printNumber}</>
                        ) : (
                          <Check />
                        )}
                      </a>
                    )}
                  </td>
                  <td className={"px-4 py-2"}>
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(article.articles_published!)}
                  </td>
                  <td className={"px-4 py-2"}>
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(article.articles_updated!)}
                  </td>
                  <td className={"px-4 py-2"}>
                    {article.users.map((author) => (
                      <p key={author.users.users_userid}>
                        <a href={`/articles/user/${author.users.users_userid}`}>
                          {author.users.users_name1} {author.users.users_name2}
                        </a>
                      </p>
                    ))}
                  </td>
                  <td className={"px-2 py-2"}>
                    {article.articles_showInSearch &&
                      article.articles_published &&
                      article.articles_published < new Date() && (
                        <>
                          <span className={"px-2 py-2"}>
                            <a
                              href={`${process.env.FRONTEND_URL}articles/${dateFormatter
                                .format(
                                  article.articles_published || new Date(0),
                                ) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
                                .split("/")
                                .reverse()
                                .join("/")}/${String(article.articles_slug)}`}
                              target={"_blank"}
                              className={
                                "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"
                              }
                              title={"View on website"}
                            >
                              <EyeIcon />
                            </a>
                          </span>
                          <span className={"px-2 py-2"}>
                            <a
                              href={`${process.env.GRAFANA_URL}d/article/article-stats?var-articleid=${article.articles_id}&from=${(article.articles_published.valueOf() - 7200) * 1000}&to=now`}
                              target={"_blank"}
                              className={
                                "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"
                              }
                              title={"View article stats"}
                            >
                              <ChartLine />
                            </a>
                          </span>
                        </>
                      )}
                    {canEdit && (
                      <span className={"px-2 py-2"}>
                        <a
                          href={`/articles/${article.articles_id}`}
                          className={
                            "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"
                          }
                          title={"Edit article"}
                        >
                          <PenLine />
                        </a>
                      </span>
                    )}
                    {canDelete && (
                      <ArticleDeleteButton
                        props={{
                          articleID: article.articles_id,
                          headline:
                            article.articlesDrafts[0].articlesDrafts_headline,
                          userID: Number(userData.id),
                          userActions: userData.actions,
                        }}
                      >
                        <span className={"px-2 py-2"}>
                          <a
                            className="inline-block rounded-sm px-2 py-2 shadow-sm bg-red-500 text-white hover:bg-red-600 transition"
                            title="Delete article"
                          >
                            <Trash />
                          </a>
                        </span>
                      </ArticleDeleteButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={articles.pagination.page}
          totalPages={articles.pagination.totalPages}
        />
      </div>
    </div>
  );
}
