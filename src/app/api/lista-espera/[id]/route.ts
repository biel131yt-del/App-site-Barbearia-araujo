import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";

// PATCH /api/lista-espera/[id] — marca como atendido/notificado (só admin)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sess = await getServerSession(authOptions);
  if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });

  try {
    const { atendido, notificado } = await req.json();
    const dados: { atendido?: boolean; notificado?: boolean } = {};
    if (typeof atendido === "boolean") dados.atendido = atendido;
    if (typeof notificado === "boolean") dados.notificado = notificado;

    if (Object.keys(dados).length === 0) {
      return NextResponse.json({ erro: "Nada para atualizar" }, { status: 400 });
    }

    const item = await db.listaEspera.update({
      where: { id: params.id },
      data: dados,
    });

    return NextResponse.json(item);
  } catch (e) {
    console.error("[api/lista-espera/[id] PATCH]", e);
    return NextResponse.json({ erro: "Falha ao atualizar" }, { status: 500 });
  }
}
