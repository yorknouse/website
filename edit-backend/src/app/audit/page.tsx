import type { Metadata } from "next";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import { getAuditLog } from "@/lib/auditLog";
import { getUser } from "@/lib/users";
import he from "he";
import { checkUserPermissions, GetUserData } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    userId?: string;
    actionUserId?: string;
  }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(48, userData.actions)) {
    return <p>Unauthorised</p>;
  }
  const awaitedSearchParams = await searchParams;
  const pageRaw = awaitedSearchParams.page ?? "1";
  const searchRaw = awaitedSearchParams.search ?? null;
  const userIdRaw = awaitedSearchParams.userId ?? null;
  const actionUserIdRaw = awaitedSearchParams.actionUserId ?? null;
  const page = isNaN(Number(pageRaw)) ? 1 : Number(pageRaw);
  const userId = isNaN(Number(userIdRaw)) ? undefined : Number(userIdRaw);
  const actionUserId = isNaN(Number(actionUserIdRaw))
    ? undefined
    : Number(actionUserIdRaw);
  let search: string | null | undefined = sanitiseSearchTerm(searchRaw);
  if (search === null) {
    search = undefined;
  }

  const auditLog = await getAuditLog({
    search: search,
    userId: userId,
    actionUserId: actionUserId,
    page: page,
  });

  let userBy = null;
  if (userId !== undefined) {
    userBy = await getUser(userId);
  }

  let userTo = null;
  if (actionUserId !== undefined) {
    userTo = await getUser(actionUserId);
  }

  let i = -1;
  return (
    <div className="lg:flex min-h-screen bg-gray-200 text-gray-900">
      <div className={"flex flex-col"}>
        <h1 className={"text-2xl font-semibold"}>
          Audit Log
          {userBy !== null
            ? ': User By "' +
              (userBy.users_name1 ?? "") +
              " " +
              userBy.users_name2 +
              '"'
            : ""}
          {userTo !== null
            ? ': Action User To "' +
              (userTo.users_name1 ?? "") +
              " " +
              userTo.users_name2 +
              '"'
            : ""}
          {search !== undefined ? ': Search "' + search + '"' : ""}
        </h1>
        <br />
        {(userBy !== null || userTo !== null || search !== undefined) && (
          <a href={"/audit"}>Clear filters</a>
        )}
        <SearchBar placeholder={"Search audit log..."} />
        <table className={"table-auto bg-white max-w-dvw"}>
          <thead className={"border-b-4 border-gray-600"}>
            <tr>
              <th className={"px-4 py-2"}>ID</th>
              <th className={"px-4 py-2"}>Type</th>
              <th className={"px-4 py-2"}>Table Affected</th>
              <th className={"px-4 py-2"}>Data</th>
              <th className={"px-4 py-2"}>Timestamp</th>
              <th className={"px-4 py-2"}>Action performed by</th>
              <th className={"px-4 py-2"}>Action performed against user</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.auditLog.map((log) => {
              i++;
              return (
                <tr
                  key={log.auditLog_id}
                  className={`${i % 2 != 0 ? "bg-gray-100" : ""}`}
                >
                  <th className={"px-4 py-2"}>{log.auditLog_id}</th>
                  <td className={"px-4 py-2"}>
                    <code>{log.auditLog_actionType}</code>
                  </td>
                  <td className={"px-4 py-2"}>{log.auditLog_actionTable}</td>
                  <td className={"px-4 py-2"}>
                    <code
                      className={
                        "block max-w-[50vw] whitespace-pre-wrap wrap-break-word"
                      }
                    >
                      {he.decode(String(log.auditLog_actionData))}
                    </code>
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
                    }).format(log.auditLog_timestamp)}
                  </td>
                  <td className={"px-4 py-2"}>
                    {log.users_auditLog_users_useridTousers !== null && (
                      <a
                        href={`/users/${log.users_auditLog_users_useridTousers.users_userid}`}
                      >
                        {log.users_auditLog_users_useridTousers.users_name1}{" "}
                        {log.users_auditLog_users_useridTousers.users_name2}
                      </a>
                    )}
                  </td>
                  <td className={"px-4 py-2"}>
                    {log.users_auditLog_auditLog_actionUseridTousers !==
                      null && (
                      <a
                        href={`/users/${log.users_auditLog_auditLog_actionUseridTousers.users_userid}`}
                      >
                        {
                          log.users_auditLog_auditLog_actionUseridTousers
                            .users_name1
                        }{" "}
                        {
                          log.users_auditLog_auditLog_actionUseridTousers
                            .users_name2
                        }
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={auditLog.pagination.page}
          totalPages={auditLog.pagination.totalPages}
        />
      </div>
    </div>
  );
}
