import { NextResponse } from "next/server";
import { telefoneCanonico } from "@/lib/cliente";
import { db } from "@/db";

// PATCH público /api/agendamentos/cancelar
// Body: { telefone, dataISO, hora, motivo? }
// Cancela um agendamento do cliente (sem login). Valida que o telefone+bem da reserva batem.
export async function PATCH(req: Request) {
  try {
    const { telefone, dataISO, hora, motivo } = await req.json();
    const tel = telefoneCanonico(telefone ?? "");
    if (!tel || tel.length < 10)
      return NextResponse.json({ erro: "WhatsApp com DDD é obrigatório" }, { status: 400 });
    if (!dataISO || !hora)
      return NextResponse.json({ erro: "Informe data e horário do agendamento" }, { status: 400 });

    // Busca o agendamento pelo telefone do cliente + data + hora
    const cliente = await db.cliente.findUnique({ where: { telefone: tel } });
    if (!cliente)
      return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });

    const ag = await db.agendamento.findFirst({
      where: { clienteId: cliente.id, dataISO, hora, status: { not: "cancelado" } },
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
