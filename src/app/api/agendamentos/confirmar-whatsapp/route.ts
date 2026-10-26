import { NextResponse } from "next/server";
import { telefoneCanonico } from "@/lib/cliente";
import { db } from "@/db";

// PATCH público /api/agendamentos/confirmar-whatsapp
// Body: { telefone, dataISO, hora }
// Marca o agendamento como confirmado via WhatsApp pelo próprio cliente.
// Serve de aviso p/ o barbeiro que o cliente já enviou a confirmação.
export async function PATCH(req: Request) {
  try {
    const { telefone, dataISO, hora } = await req.json();
    const tel = telefoneCanonico(telefone ?? "");
    if (!tel || tel.length < 10)
      return NextResponse.json({ erro: "WhatsApp com DDD é obrigatório" }, { status: 400 });
    if (!dataISO || !hora)
      return NextResponse.json({ erro: "Informe data e horário do agendamento" }, { status: 400 });

    const cliente = await db.cliente.findUnique({ where: { telefone: tel } });
    if (!cliente)
      return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });

    const ag = await db.agendamento.findFirst({
      where: { clienteId: cliente.id, dataISO, hora, status: { not: "cancelado" } },
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
