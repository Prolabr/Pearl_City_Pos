import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/libs/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) return null;

        return { id: user.id.toString(), email: user.email };
      }
    })
  ],

  callbacks: {
    // 1. JWT Callback: Runs whenever a JWT is created (on sign-in)
    async jwt({ token, user }) {
      if (user) {
        // user is available on sign in
        token.id = user.id;
        token.email = user.email || "";
      }
      return token;
    },
    // 2. Session Callback: Runs whenever a session is checked
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    },
  },
  // --- END CALLACKS BLOCK ---

  pages: {
    signIn: "/login"
  },

  session: { strategy: "jwt" },
});


export { handler as GET, handler as POST };
