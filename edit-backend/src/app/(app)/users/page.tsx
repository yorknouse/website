import type { Metadata } from "next";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import SearchBar from "@/components/SearchBar";
import { Hand, Hourglass, PenLine, Trash } from "lucide-react";
import UserDeleteButton from "@/components/UserDeleteButton";
import Pagination from "@/components/Pagination";
import { getUsers } from "@/lib/users";
import UserSuspendUnsuspendButton from "@/components/UserSuspendUnsuspendButton";
import UserEndAllPositionsButton from "@/components/UserEndAllPositionsButton";

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

  const canEdit = checkUserPermissions(5, userData.actions);
  const canSuspend = checkUserPermissions(9, userData.actions);
  const canEndAllRolesNow = checkUserPermissions(13, userData.actions);
  const canDelete = checkUserPermissions(15, userData.actions);

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
              <th className={"px-4 py-2"}>ID</th>
              <th className={"px-4 py-2"}>First name</th>
              <th className={"px-4 py-2"}>Last name</th>
              <th className={"px-4 py-2"}>York username</th>
              <th className={"px-4 py-2"}>Nouse username</th>
              <th className={"px-4 py-2"}>Roles</th>
              <th></th>
              <th className={"px-4 py-2"}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.users.map((user) => {
              i++;
              return (
                <tr
                  key={user.users_userid}
                  className={`
                  ${user.users_suspended && i % 2 != 0 ? "bg-red-300" : user.users_suspended ? "bg-red-200" : (!user.userPositions || user.userPositions.length < 1) && i % 2 != 0 ? "bg-amber-100" : !user.userPositions || user.userPositions.length < 1 ? "bg-amber-50" : i % 2 != 0 ? "bg-gray-100" : ""}`}
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
                  <td className={"px-4 py-2"}>
                    {user.userPositions &&
                      user.userPositions.map((userPosition) => (
                        <div key={userPosition.userPositions_id}>
                          {userPosition.positions.positions_displayName}
                        </div>
                      ))}
                  </td>
                  <td className={"px-4 py-2"}>
                    {user.users_suspended ? (
                      <span className={"px-1"}>
                        <span
                          className={
                            "inline-block rounded-full shadow-sm bg-red-400 px-2 py-0.5 text-xs text-white font-medium mb-1 mr-1"
                          }
                        >
                          Suspended
                        </span>
                      </span>
                    ) : (
                      <></>
                    )}
                    {(!user.userPositions || user.userPositions.length < 1) && (
                      <span className={"px-1"}>
                        <span
                          className={
                            "inline-block rounded-full shadow-sm bg-orange-300 px-2 py-0.5 text-xs font-medium mb-1 mr-1"
                          }
                        >
                          Cannot log in
                        </span>
                      </span>
                    )}
                  </td>
                  <td className={"px-2 py-2"}>
                    {canEdit && (
                      <span className={"px-2 py-2"}>
                        <a
                          href={`/users/${user.users_userid}`}
                          className={
                            "inline-block rounded-sm px-2 py-2 shadow-sm bg-gray-200 hover:bg-gray-300 transition"
                          }
                          title={"Edit User"}
                        >
                          <PenLine />
                        </a>
                      </span>
                    )}
                    {canEndAllRolesNow && (
                      <UserEndAllPositionsButton
                        props={{
                          userToID: user.users_userid,
                          userName: user.users_name1 + " " + user.users_name2,
                          userID: Number(userData.id),
                          userActions: userData.actions,
                        }}
                      >
                        <span className={"px-2 py-2"}>
                          <a
                            className={`inline-block rounded-sm px-2 py-2 shadow-sm text-white bg-orange-300 hover:bg-orange-400 transition`}
                            title={`End all Positions now`}
                          >
                            <Hourglass />
                          </a>
                        </span>
                      </UserEndAllPositionsButton>
                    )}
                    {canSuspend && (
                      <UserSuspendUnsuspendButton
                        props={{
                          suspendUnsuspend: user.users_suspended
                            ? "unsuspend"
                            : "suspend",
                          userToID: user.users_userid,
                          userName: user.users_name1 + " " + user.users_name2,
                          userID: Number(userData.id),
                          userActions: userData.actions,
                        }}
                      >
                        <span className={"px-2 py-2"}>
                          <a
                            className={`inline-block rounded-sm px-2 py-2 shadow-sm text-white ${user.users_suspended ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} transition`}
                            title={`${user.users_suspended ? "Unsuspend" : "Suspend"} user`}
                          >
                            <Hand />
                          </a>
                        </span>
                      </UserSuspendUnsuspendButton>
                    )}
                    {canDelete && (
                      <UserDeleteButton
                        props={{
                          userToID: user.users_userid,
                          userName: user.users_name1 + " " + user.users_name2,
                          userID: Number(userData.id),
                          userActions: userData.actions,
                        }}
                      >
                        <span className={"px-2 py-2"}>
                          <a
                            className="inline-block rounded-sm px-2 py-2 shadow-sm bg-red-500 text-white hover:bg-red-600 transition"
                            title="Delete user"
                          >
                            <Trash />
                          </a>
                        </span>
                      </UserDeleteButton>
                    )}
                  </td>
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
