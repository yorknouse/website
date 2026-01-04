import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../css/globals.css";
import React from "react";
import Providers from "../providers";
import Sidebar from "@/components/Navbar";
import { GetUserName } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "Nouse Backend | %s",
    default: "Nouse Backend",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let name = "Unknown";
  const userName = await GetUserName();
  if (userName !== null) {
    name = userName;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="lg:flex min-h-screen bg-gray-200 text-gray-900">
            <Sidebar props={{ name: name }} />
            <main className="flg:lex-1 p-6 transition-all duration-300">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
