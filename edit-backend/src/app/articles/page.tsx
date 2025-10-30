import type { Metadata } from "next";
import { getArticles } from "@/lib/articles";
import { Check, EyeIcon } from "lucide-react";
import dateFormatter from "@/lib/dateFormatter";

export const metadata: Metadata = {
  title: "Articles",
};

export default async function Articles() {
  const articles = await getArticles({page:2});

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
            {articles.articles.map((article) => (
              <tr
                key={article.articles_id}
                className={`
                  ${!article.articles_showInLists &&
                  !article.articles_showInSearch
                    ? "bg-red-300"
                    : !article.articles_showInLists
                      ? "bg-amber-300"
                      : ""}`}
              >
                <th className={"px-4 py-2"}>{article.articles_id}</th>
                <td className={"px-4 py-2"}>{article.articlesDrafts[0].articlesDrafts_headline}
                    {!article.articles_showInLists &&
                    !article.articles_showInSearch
                        ?
                    <span
                        className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm bg-red-500 text-white ml-2"
                    >
                      Draft
                    </span>
                    : !article.articles_showInLists
                        ?
                            <span
                                className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm bg-amber-500 text-white ml-2"
                            >
                      Show in search only
                    </span>
                            :
                            <></>
                }
                </td>
                <td className={"px-4 py-2"}>
                  {article.articles_categories.map((category) => (
                    <span
                      key={category.categories_id}
                      className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm"
                      style={{
                          backgroundColor: category.category.categories_backgroundColor || "#3B82F6", // default blue if none
                          color: category.category.categories_backgroundColorContrast
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
                          {article.edition.editions_printNumber !== null ?
                          <>№{article.edition.editions_printNumber}</>
                              : <Check/>
                          }
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
                  <td className={"px-4 py-2"}>
                      {article.articles_showInSearch && article.articles_published && article.articles_published < new Date() && (
                      <a href={`${process.env.FRONTEND_URL}articles/${dateFormatter
                          .format(article.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
                          .split("/")
                          .reverse()
                          .join("/")}/${String(article.articles_slug)}`} target={"_blank"}
                         className={"inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200"} title={"View on website"}>
                          <EyeIcon/>
                      </a>
                      )}
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
