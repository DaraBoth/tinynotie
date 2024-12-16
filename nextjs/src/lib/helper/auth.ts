// src/lib/helper/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session, getServerSession } from "next-auth";
import { fetchJson } from "@/lib/helper";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { Token, Users } from "@/types/auth";

// Use it in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOption);
}

// JWT Callback
export const jwt = async ({ token, user }: { token: JWT; user?: any }) => {
  if (user) {
    token.user = user; // Attach user to the token
    token.accessToken = user.token.accessToken; // Attach access token
    token.expiresAt = user.token.expiresAt; // Attach token expiration
  }
  return token;
};

// Session Callback
export const session = async ({ session, token }: { session: Session; token: JWT }) => {
  if (token) {
    session.user = token.user; // Attach user to the session
    session.token = { // Attach token info to the session
      accessToken: token.accessToken,
      expiresAt: token.expiresAt,
    };
  }
  return session;
};

// NextAuth Options
export const authOption: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const authRequest = {
          usernm: credentials?.username,
          passwd: credentials?.password,
        };

        const response: any = await fetchJson(
          process.env.NEXT_APIURL + "/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(authRequest),
          }
        );

        if (response.status) {
          console.log({response});
          return {
            id: response._id,
            usernm: response.usernm,
            token: {
              accessToken: response.token,
              expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Example expiration of 24 hours
            },
          };
        }

        throw new Error(response?.message || "Invalid username or password");
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT strategy for session management
    maxAge: 24 * 60 * 60, // Set maxAge to 24 hours
  },
  callbacks: {
    jwt,
    session,
  },
  pages: {
    signIn: "/login",  // Ensure this points to your login page
  },
};

// Declare TypeScript Types for NextAuth
declare module "next-auth" {
  interface Session {
    token?: Token;
    user?: Users;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: Users;
    accessToken: string;
    expiresAt: number;
  }
}
