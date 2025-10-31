import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      internalId?: number;
      internalToken?: string;
      positions?: (string | null)[];
      actions?: Map<number, boolean>;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    internalId?: number;
    internalToken?: string;
    positions?: (string | null)[];
    actions?: Map<number, boolean>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    internalId?: number;
    internalToken?: string;
    positions?: (string | null)[];
    actions?: Map<number, boolean> | { [k: string]: boolean };
  }
}
