import NextAuth from "next-auth";
import {authOption} from "@/lib/helper";

const handler = NextAuth(authOption);
export {handler as GET, handler as POST};