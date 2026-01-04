import type { Metadata } from "next";
import UserData from "@/components/UserData";
import { GetUserData } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Home",
};

export default async function Home() {
  const userData = await GetUserData();
  if (!userData) {
    return <p>Unauthorised</p>;
  }
  return (
    <div>
      <div
        className={
          "lg:flex-2 shadow-md rounded-lg p-4 min-w-64 max-w-128 bg-gray-50 border-t-emerald-400 border-t-2"
        }
      >
        <h1 className={"text-2xl font-semibold mb-4 text-center"}>
          Welcome to the Nouse Backend
        </h1>
        <p>
          Welcome to the Nouse Backend where you will be able to administer
          articles, editions, committee and more...
        </p>
        <br />
        <p>
          If you have any issues using the website then please reach out to{" "}
          <code>#tech</code> on Slack for guidance or help or to report an issue
        </p>
      </div>
      <UserData props={{ userData: userData }} />
    </div>
  );
}
