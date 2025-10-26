import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function IsLoggedIn() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GetUserData() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  return {
    id: session.user.internalId,
    name: session.user.name,
    email: session.user.email,
    photo: session.user.image,
  };
}
