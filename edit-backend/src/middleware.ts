import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/auth/signin", // Redirect here if not logged in
    },
});

export const config = {
    matcher: [
        // Protect all routes except the sign-in and auth routes
        "/((?!api/auth|api/s3url|api/frontend|auth/signin|_next|favicon.ico|images|public).*)",
    ],
};
