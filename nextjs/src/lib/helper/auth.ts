import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session, getServerSession } from "next-auth";
import { fetchJson } from "@/lib/helper";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";

// Use it in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOption);
}

export const jwt = async ({ token, user }: { token: JWT; user: User }) => {
  if (user) {
    // token = user
    // token.user = user?.rec?.user;
    // token.status = user?.rec?.user?.status;
    // token.name = user.rec.user.fullname;
    // token.Token = user.rec?.token;
    // token.user.companies = user.rec?.companies;
    console.log({user});
  }
  return token;
};

export const session = ({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> => {
  if(token){
    session.user = token.user;
    session.token = token.Token;
  }
  return Promise.resolve(session);
};

export const authOption: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const authRequest = {
          username: credentials?.username,
          password: credentials?.password,
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

        if (!response.error) {
          // console.log("response = ", response);
          console.log("Login Success");

          return response;
        }

        throw new Error(response?.message || "Invalid username or password");
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours
  },
  callbacks: {
    jwt,
    session,
  },
  pages: {
    signIn: "/login",
  },
};

export type Token = {
  accessExpired: number;
  refreshExpired: number;
  access_token: string;
  refresh_token: string;
};

export type Users = {
  id: number;
  username: string;
  fullname: string;
  role: string;
  status: string;
  companies: string;
};

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as
   * a prop on the `SessionProvider` React Context
   */
  interface Session {
    token?: Token;
    user?: Users
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    Token: Token;
    user: Users;
    exp?: number;
    iat?: number;
    jti?: string;
  }
}
