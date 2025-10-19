import NextAuth, {AuthOptions} from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt", // or "database" if you want session persistence
    },
    pages: {
        signIn: "/auth/signin", // Optional: custom login page
    },
    callbacks: {
        async jwt({ token, account, profile }) {
            // When user signs in for the first time, attach profile info to token
            if (account && profile) {
                token.id = profile.sub;
                token.name = profile.name;
                token.email = profile.email;
            }
            return token;
        },
        async session({ session, token }) {
            // Pass data from token to session
            if (token) {
                session.user = {
                    name: token.name,
                    email: token.email,
                };
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
