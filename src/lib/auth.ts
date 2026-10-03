// Auth do painel (NextAuth v4 + Credentials) — FASE 9
// Login simples do dono/equipe; papéis: admin | agenda | caixa.
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Painel",
      credentials: { login: { label: "Login", type: "text" }, senha: { label: "Senha", type: "password" } },
      async authorize(creds) {
        const login = (creds?.login ?? "").trim().toLowerCase();
        const senha = creds?.senha ?? "";
        if (!login || !senha) return null;
        const user = await db.usuario.findUnique({ where: { login } });
        if (!user || !user.ativo) return null;
        // Acesso temporário vencido → bloqueia
        if (user.expiraEm && user.expiraEm.getTime() < Date.now()) return null;
        const ok = await bcrypt.compare(senha, user.senhaHash);
        if (!ok) return null;
        return { id: user.id, name: user.nome, papel: user.papel } as { id: string; name: string; papel: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as unknown as { id: string }).id;
        token.papel = (user as unknown as { papel: string }).papel;
      }
      // Revalida o papel no banco a cada requisição (promoção/rebaixamento vale na hora,
      // sem precisar sair e entrar de novo). Expirado/bloqueado vira "expirado"
      // e o middleware + permissões barram tudo.
      try {
        if (token.uid) {
          const atual = await db.usuario.findUnique({
            where: { id: token.uid as string },
            select: { papel: true, ativo: true, expiraEm: true },
          });
          const vencido = atual?.expiraEm && atual.expiraEm.getTime() < Date.now();
          if (!atual || !atual.ativo || vencido) {
            token.papel = "expirado";
            return token;
          }
          token.papel = atual.papel;
        }
      } catch {
        /* mantém o papel do token */
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
