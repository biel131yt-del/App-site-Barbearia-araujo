import { NextResponse } from "next/server";

// GET /api/push/public-key — cliente busca a chave VAPID pública p/ se inscrever
export async function GET() {
  const key = process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY ?? "";
  if (!key) return NextResponse.json({ erro: "Push não configurado" }, { status: 500 });
  return NextResponse.json({ publicKey: key });
}
