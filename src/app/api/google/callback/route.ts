import { NextResponse } from "next/server";
import { salvarContaGoogle } from "@/lib/google";

// GET /api/google/callback?code=... — Google redireciona p/ cá após autorizar.
// Salva o refresh_token e volta ao painel com status na URL.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const base = new URL(req.url).origin;
  if (!code) return NextResponse.redirect(`${base}/admin/config?google=erro`);
  try {
    await salvarContaGoogle(code);
    return NextResponse.redirect(`${base}/admin/config?google=ok`);
  } catch (e) {
    console.error("[google/callback]", e);
    return NextResponse.redirect(`${base}/admin/config?google=erro`);
  }
}
