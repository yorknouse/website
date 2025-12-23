import type { Metadata } from "next";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import SearchBar from "@/components/SearchBar";
import { ChartLine, Check, EyeIcon, PenLine, Trash } from "lucide-react";
import dateFormatter from "@/lib/dateFormatter";
import ArticleDeleteButton from "@/components/ArticleDeleteButton";
import Pagination from "@/components/Pagination";
import { getUsers } from "@/lib/users";

export const metadata: Metadata = {
  title: "Users",
};

export default async function Users({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(2, userData.actions)) {
    return <p>Unauthorised</p>;
  }

  const awaitedSearchParams = await searchParams;
  const pageRaw = awaitedSearchParams.page ?? "1";
  const searchRaw = awaitedSearchParams.search ?? null;
  const page = isNaN(Number(pageRaw)) ? 1 : Number(pageRaw);
  let search: string | null | undefined = sanitiseSearchTerm(searchRaw);
  if (search === null) {
    search = undefined;
  }

  const users = await getUsers({
    page: page,
    search: search,
  });

  let i = -1;

  return (
    <div className="lg:flex min-h-screen bg-gray-200 text-gray-900">
      <div className={"flex flex-col"}>
        <h1 className={"text-2xl font-semibold"}>
          Users
          {search !== undefined ? ': Search "' + search + '"' : ""}
        </h1>
        <br />
        {search !== undefined && <a href={"/users"}>Clear filters</a>}
        <SearchBar placeholder={"Search users..."} />
        <table className={"table-auto bg-white"}>
          <thead className={"border-b-4 border-gray-600"}>
            <tr>
              <th>ID</th>
              <th>First name</th>
              <th>Last name</th>
              <th>York username</th>
              <th>Nouse username</th>
              <th>Roles No.</th>
              {/*<th>Published author(s)</th>*/}
              {/*<th>Actions</th>*/}
            </tr>
          </thead>
          <tbody>
            {users.users.map((user) => {
              i++;
              return (
                <tr
                  key={user.users_userid}
                  //             className={`
                  // ${
                  //                 !article.articles_showInLists &&
                  //                 !article.articles_showInSearch
                  //                     ? "bg-red-300"
                  //                     : !article.articles_showInLists
                  //                         ? "bg-amber-300"
                  //                         : i % 2 != 0
                  //                             ? "bg-gray-100"
                  //                             : ""
                  //             }`}
                >
                  <th className={"px-4 py-2"}>{user.users_userid}</th>
                  <td className={"px-4 py-2"}>{user.users_name1}</td>
                  <td className={"px-4 py-2"}>{user.users_name2}</td>
                  <td className={"px-4 py-2"}>
                    {user.users_googleAppsUsernameYork}
                  </td>
                  <td className={"px-4 py-2"}>
                    {user.users_googleAppsUsernameNouse}
                  </td>
                  <td className={"px-4 py-2"}>{user.userPositions.length}</td>
                  {/*        <td className={"px-4 py-2"}>*/}
                  {/*            {article.articlesDrafts[0].articlesDrafts_headline}*/}
                  {/*            {!article.articles_showInLists &&*/}
                  {/*            !article.articles_showInSearch ? (*/}
                  {/*                <span className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm bg-red-500 text-white ml-2">*/}
                  {/*  Draft*/}
                  {/*</span>*/}
                  {/*            ) : !article.articles_showInLists ? (*/}
                  {/*                <span className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm bg-amber-500 text-white ml-2">*/}
                  {/*  Show in search only*/}
                  {/*</span>*/}
                  {/*            ) : (*/}
                  {/*                <></>*/}
                  {/*            )}*/}
                  {/*        </td>*/}
                  {/*        <td className={"px-4 py-2"}>*/}
                  {/*            {article.articles_categories.map((category) => (*/}
                  {/*                <span*/}
                  {/*                    key={category.categories_id}*/}
                  {/*                    className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-1 mr-1 shadow-sm"*/}
                  {/*                    style={{*/}
                  {/*                        backgroundColor:*/}
                  {/*                            category.category.categories_backgroundColor ||*/}
                  {/*                            "#3B82F6", // default blue if none*/}
                  {/*                        color: category.category*/}
                  {/*                            .categories_backgroundColorContrast*/}
                  {/*                            ? `#${category.category.categories_backgroundColorContrast}`*/}
                  {/*                            : "#fff",*/}
                  {/*                    }}*/}
                  {/*                >*/}
                  {/*  {category.category.categories_displayName}*/}
                  {/*</span>*/}
                  {/*            ))}*/}
                  {/*        </td>*/}
                  {/*        <td className={"px-4 py-2"}>*/}
                  {/*            {article.edition && (*/}
                  {/*                <a href={`/editions/${article.editions_id}`}>*/}
                  {/*                    {article.edition.editions_printNumber !== null ? (*/}
                  {/*                        <>№{article.edition.editions_printNumber}</>*/}
                  {/*                    ) : (*/}
                  {/*                        <Check />*/}
                  {/*                    )}*/}
                  {/*                </a>*/}
                  {/*            )}*/}
                  {/*        </td>*/}
                  {/*        <td className={"px-4 py-2"}>*/}
                  {/*            {new Intl.DateTimeFormat("en-GB", {*/}
                  {/*                weekday: "short",*/}
                  {/*                day: "2-digit",*/}
                  {/*                month: "short",*/}
                  {/*                year: "numeric",*/}
                  {/*            }).format(article.articles_published!)}*/}
                  {/*        </td>*/}
                  {/*        <td className={"px-4 py-2"}>*/}
                  {/*            {new Intl.DateTimeFormat("en-GB", {*/}
                  {/*                weekday: "short",*/}
                  {/*                day: "2-digit",*/}
                  {/*                month: "short",*/}
                  {/*                year: "numeric",*/}
                  {/*                hour: "2-digit",*/}
                  {/*                minute: "2-digit",*/}
                  {/*                second: "2-digit",*/}
                  {/*            }).format(article.articles_updated!)}*/}
                  {/*        </td>*/}
                  {/*        <td className={"px-4 py-2"}>*/}
                  {/*            {article.users.map((author) => (*/}
                  {/*                <p key={author.users.users_userid}>*/}
                  {/*                    <a href={`/articles?user=${author.users.users_userid}`}>*/}
                  {/*                        {author.users.users_name1} {author.users.users_name2}*/}
                  {/*                    </a>*/}
                  {/*                </p>*/}
                  {/*            ))}*/}
                  {/*        </td>*/}
                  {/*        <td className={"px-2 py-2"}>*/}
                  {/*            {article.articles_showInSearch &&*/}
                  {/*                article.articles_published &&*/}
                  {/*                article.articles_published < new Date() && (*/}
                  {/*                    <>*/}
                  {/*    <span className={"px-2 py-2"}>*/}
                  {/*      <a*/}
                  {/*          href={`${process.env.FRONTEND_URL}articles/${dateFormatter*/}
                  {/*              .format(*/}
                  {/*                  article.articles_published || new Date(0),*/}
                  {/*              ) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD*/}
                  {/*              .split("/")*/}
                  {/*              .reverse()*/}
                  {/*              .join("/")}/${String(article.articles_slug)}`}*/}
                  {/*          target={"_blank"}*/}
                  {/*          className={*/}
                  {/*              "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"*/}
                  {/*          }*/}
                  {/*          title={"View on website"}*/}
                  {/*      >*/}
                  {/*        <EyeIcon />*/}
                  {/*      </a>*/}
                  {/*    </span>*/}
                  {/*                        <span className={"px-2 py-2"}>*/}
                  {/*      <a*/}
                  {/*          href={`${process.env.GRAFANA_URL}d/article/article-stats?var-articleid=${article.articles_id}&from=${(article.articles_published.valueOf() - 7200) * 1000}&to=now`}*/}
                  {/*          target={"_blank"}*/}
                  {/*          className={*/}
                  {/*              "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"*/}
                  {/*          }*/}
                  {/*          title={"View article stats"}*/}
                  {/*      >*/}
                  {/*        <ChartLine />*/}
                  {/*      </a>*/}
                  {/*    </span>*/}
                  {/*                    </>*/}
                  {/*                )}*/}
                  {/*            {canEdit && (*/}
                  {/*                <span className={"px-2 py-2"}>*/}
                  {/*  <a*/}
                  {/*      href={`/articles/${article.articles_id}`}*/}
                  {/*      className={*/}
                  {/*          "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"*/}
                  {/*      }*/}
                  {/*      title={"Edit article"}*/}
                  {/*  >*/}
                  {/*    <PenLine />*/}
                  {/*  </a>*/}
                  {/*</span>*/}
                  {/*            )}*/}
                  {/*            {canDelete && (*/}
                  {/*                <ArticleDeleteButton*/}
                  {/*                    props={{*/}
                  {/*                        articleID: article.articles_id,*/}
                  {/*                        headline:*/}
                  {/*                        article.articlesDrafts[0].articlesDrafts_headline,*/}
                  {/*                        userID: Number(userData.id),*/}
                  {/*                        userActions: userData.actions,*/}
                  {/*                    }}*/}
                  {/*                >*/}
                  {/*  <span className={"px-2 py-2"}>*/}
                  {/*    <a*/}
                  {/*        className="inline-block rounded-sm px-2 py-2 shadow-sm bg-red-500 text-white hover:bg-red-600 transition"*/}
                  {/*        title="Delete article"*/}
                  {/*    >*/}
                  {/*      <Trash />*/}
                  {/*    </a>*/}
                  {/*  </span>*/}
                  {/*                </ArticleDeleteButton>*/}
                  {/*            )}*/}
                  {/*        </td>*/}
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={users.pagination.page}
          totalPages={users.pagination.totalPages}
        />
      </div>
    </div>
  );
}
