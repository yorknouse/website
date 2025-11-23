import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User",
};

export default async function User() {
  return <p>User</p>;
}
