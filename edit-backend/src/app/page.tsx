import Sidebar from "@/components/Navbar";
import type { Metadata } from "next";
import UserData from "@/components/UserData";

export const metadata: Metadata = {
    title: "Home",
};

export default function Home() {
  return (
      <div className="lg:flex min-h-screen bg-gray-200 text-gray-900">
          <Sidebar />
          <main className="flg:lex-1 p-6 transition-all duration-300">
              <div className={"lg:flex-2 shadow-md rounded-lg p-4 min-w-64 max-w-128 bg-gray-50 border-t-emerald-400 border-t-2"}>
                  <h1 className={"text-2xl font-semibold mb-4 text-center"}>Welcome to the Nouse Backend</h1>
                  <p>
                      Welcome to the Nouse Backend where you will be able to administer articles, editions, committee and more...
                  </p>
                  <br/>
                  <p>
                      If you have any issues using the website then please reach out to <code>#tech</code> on Slack for guidance or help or to report an issue
                  </p>
              </div>
              <UserData />
          </main>
      </div>
  );
}
