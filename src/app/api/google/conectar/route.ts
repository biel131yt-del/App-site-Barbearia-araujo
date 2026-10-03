import { NextResponse } from "next/server";
import { googleConfigurado, urlAutorizacaoGoogle } from "@/lib/google";

// GET /api/google/conectar — redireciona o dono p/ autorizar no Google (1x)
export async function GET() {
  if (!googleConfigurado())
    return NextResponse.json(
      { erro: "Faltam GOOGLE_CLIENT_ID/SECRET no .env — veja .env.example" },
      { status: 500 }
    );
  return NextResponse.redirect(urlAutorizacaoGoogle());
}
