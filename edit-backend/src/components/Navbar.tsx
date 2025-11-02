"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Home,
  BookOpen,
  NewspaperIcon,
  IdCard,
  Users,
  LogOut,
  Files,
  FileChartPie,
  Gavel,
  SquareUserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar({
  props: { name },
}: {
  props: { name: string };
}) {
  async function handleLogout() {
    try {
      // Invalidate the auth token in DB
      await fetch("/api/auth/logout", { method: "POST" });

      // Clear NextAuth session & redirect
      await signOut({ callbackUrl: "/auth/signin" });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      setUserId(Number(session.user.internalId));
    }
  }, [status, session]);

  const [isOpen, setIsOpen] = useState(false);
  const userRole = "admin"; // replace with real auth/role logic

  const toggleSidebar = () => setIsOpen(!isOpen);

  const linkStyle =
    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors";
  const iconStyle = "flex-shrink-0 w-5 h-5";
  const separatorStyle = "truncate text-gray-500 p-4";

  return (
    <>
      {/* --- Small floating menu button (mobile only) --- */}
      {!isOpen && (
        <div className={"lg:hidden h-16 min-w-screen bg-gray-50"}>
          <button
            onClick={toggleSidebar}
            className="lg:hidden fixed top-3 left-3 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-md hover:bg-gray-800 transition"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <h1 className={"text-2xl p-4 text-center"}>
            <span className={"font-extrabold"}>Nouse</span> Admin
          </h1>
        </div>
      )}

      {/* --- Sidebar --- */}
      <aside
        className={`fixed lg:static top-0 left-0 min-h-screen w-64 bg-gray-900 text-gray-200 flex flex-col justify-between shadow-xl transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0 flex" : "-translate-x-full lg:translate-x-0 lg:flex"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Image
              src={"/favicon.svg"}
              alt={"Nouse Kingfisher"}
              width={32}
              height={32}
              className={"rounded-lg"}
            />
            <span className={"text-lg"}>
              <span className={"font-extrabold"}>Nouse</span> Admin
            </span>
          </div>

          {/* Close button (mobile) */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <Link href="/" className={linkStyle}>
            <Home className={iconStyle} />
            <span className="truncate">Home</span>
          </Link>

          <Link href="/account" className={linkStyle}>
            <SquareUserRound className={iconStyle} />
            <span className="truncate">Account</span>
          </Link>

          <Link href="/editions" className={linkStyle}>
            <NewspaperIcon className={iconStyle} />
            <span className="truncate">Editions</span>
          </Link>

          <span className={separatorStyle}>Articles</span>

          <Link
            href={userId ? `/articles/user/${userId}` : "/articles"}
            className={linkStyle}
          >
            <IdCard className={iconStyle} />
            <span className="truncate">My Articles</span>
          </Link>

          <Link href="/articles" className={linkStyle}>
            <Files className={iconStyle} />
            <span className="truncate">All Articles</span>
          </Link>

          <Link href="/featured" className={linkStyle}>
            <FileChartPie className={iconStyle} />
            <span className="truncate">Featured Articles</span>
          </Link>

          <span className={separatorStyle}>Admin</span>

          {userRole === "admin" && (
            <Link href="/users" className={linkStyle}>
              <Users className={iconStyle} />
              <span className="truncate">Users</span>
            </Link>
          )}

          {(userRole === "admin" || userRole === "editor") && (
            <Link href="/audit" className={linkStyle}>
              <Gavel className={iconStyle} />
              <span className="truncate">Audit Log</span>
            </Link>
          )}

          <Link
            href="https://docs.nouse.co.uk"
            className={linkStyle}
            target={"_blank"}
          >
            <BookOpen className={iconStyle} />
            <span className="truncate">Docs</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <button
            className={`${linkStyle} w-full text-left text-gray-400 hover:text-white`}
            onClick={() => handleLogout()}
          >
            <LogOut className={iconStyle} />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay (click to close) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30"
            onClick={toggleSidebar}
          />
          <div className={"lg:hidden h-16 min-w-screen bg-gray-50"}>
            <h1 className={"text-2xl p-4 text-center"}>
              <span className={"font-extrabold"}>Nouse</span> Admin
            </h1>
          </div>
        </>
      )}
    </>
  );
}
