// Auth do painel — NextAuth v4 + Credentials
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Painel",
      credentials: {
        login: { label: "Login", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(creds) {
        const login = (creds?.login ?? "").trim().toLowerCase();
        const senha = creds?.senha ?? "";
        if (!login || !senha) return null;

        const user = await db.usuario.findUnique({ where: { login } });
        if (!user || !user.ativo) return null;

        const ok = await bcrypt.compare(senha, user.senhaHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.nome,
          papel: user.papel,
        } as { id: string; name: string; papel: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.papel = (user as { papel: string }).papel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { papel?: string }).papel = token.papel as string;
      }
      return session;
    },
  },
};
