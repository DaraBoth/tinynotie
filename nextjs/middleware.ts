import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token, // Only allow access if token exists
  },
});

export const config = { matcher: ["/(root)/**"] };  // Protect these paths
