import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      internalId?: number;
      internalToken?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    internalId?: number;
    internalToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    internalId?: number;
    internalToken?: string;
  }
}
