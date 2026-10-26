import { NextResponse } from "next/server";
import { db } from "@/db";

// PATCH público /api/agendamentos/confirmar-whatsapp
// Body: { tokenAcesso }
// Marca o agendamento como confirmado via WhatsApp pelo próprio cliente.
// Serve de aviso p/ o barbeiro que o cliente já enviou a confirmação.
export async function PATCH(req: Request) {
  try {
    const { tokenAcesso } = await req.json();
    if (!tokenAcesso)
      return NextResponse.json({ erro: "Token de acesso é obrigatório" }, { status: 400 });

    const ag = await db.agendamento.findFirst({
      where: { tokenAcesso, status: { not: "cancelado" } },
    });
    if (!ag)
      return NextResponse.json({ erro: "Agendamento não encontrado" }, { status: 404 });

    const atualizado = await db.agendamento.update({
      where: { id: ag.id },
      data: { confirmadoWhatsApp: true },
      include: { servico: true, cliente: true },
    });

    return NextResponse.json({ ok: true, confirmadoWhatsApp: atualizado.confirmadoWhatsApp });
  } catch (e) {
    console.error("[api/agendamentos/confirmar-whatsapp]", e);
    return NextResponse.json({ erro: "Falha ao confirmar WhatsApp" }, { status: 500 });
  }
}
