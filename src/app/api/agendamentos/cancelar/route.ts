import { NextResponse } from "next/server";
import { db } from "@/db";

// PATCH público /api/agendamentos/cancelar
// Body: { tokenAcesso, motivo? }
// Cancela um agendamento do cliente usando o token de acesso enviado por WhatsApp.
export async function PATCH(req: Request) {
  try {
    const { tokenAcesso, motivo } = await req.json();
    if (!tokenAcesso)
      return NextResponse.json({ erro: "Token de acesso é obrigatório" }, { status: 400 });

    const ag = await db.agendamento.findFirst({
      where: { tokenAcesso, status: { not: "cancelado" } },
    });
    if (!ag)
      return NextResponse.json({ erro: "Agendamento não encontrado ou já cancelado" }, { status: 404 });

    const atualizado = await db.agendamento.update({
      where: { id: ag.id },
      data: {
        status: "cancelado",
        motivoCancelamento: motivo ?? null,
        canceladoEm: new Date(),
      },
    });

    return NextResponse.json({ ok: true, agendamento: atualizado });
  } catch (e) {
    console.error("[api/agendamentos/cancelar]", e);
    return NextResponse.json({ erro: "Falha ao cancelar" }, { status: 500 });
  }
}
