// Protege o painel — login + papel por rota (separação radical cliente × admin).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { podeAcessar } from "@/lib/permissoes";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sempre libera a tela de login
  if (pathname === "/admin/login") return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Se não tem token, redireciona para login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Verifica papel
  if (!podeAcessar(token.papel as string, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Tudo do /admin EXCETO a tela de login
export const config = { matcher: ["/admin", "/admin/:path*"] };
