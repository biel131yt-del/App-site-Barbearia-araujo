import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/push/testar — manda um push de teste p/ todos os aparelhos (requer login)
export async function POST() {
  const sess = await getServerSession(authOptions);
  if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });
  try {
    const { notificarDono } = await import("@/lib/push");
    const n = await notificarDono("Teste da Barbearia Araujo", "Se chegou, o push está funcionando!", "/admin");
    return NextResponse.json({ enviadas: n });
  } catch (e) {
    console.error("[push/testar]", e);
    return NextResponse.json({ erro: "Falha ao enviar" }, { status: 500 });
  }
}
