import { NextResponse } from "next/server";
import { db } from "@/db";
import { gerarSlotsDia } from "@/lib/slots";

const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const ISO_HORA = /^\d{2}:\d{2}$/;

// PATCH público /api/agendamentos/remarcar
// Body: { tokenAcesso, novaData, novaHora }
// Remarca um agendamento do cliente usando o token de acesso enviado por WhatsApp.
export async function PATCH(req: Request) {
  try {
    const { tokenAcesso, novaData, novaHora } = await req.json();
    if (!tokenAcesso)
      return NextResponse.json({ erro: "Token de acesso é obrigatório" }, { status: 400 });
    if (!novaData || !novaHora)
      return NextResponse.json({ erro: "Informe nova data e horário" }, { status: 400 });
    if (!ISO_DATA.test(novaData) || !ISO_HORA.test(novaHora))
      return NextResponse.json({ erro: "Use data yyyy-mm-dd e hora HH:mm" }, { status: 400 });

    const ag = await db.agendamento.findFirst({
      where: { tokenAcesso, status: { not: "cancelado" } },
    });
    if (!ag)
      return NextResponse.json({ erro: "Agendamento não encontrado ou já cancelado" }, { status: 404 });

    // Valida que o novo dia está aberto e o horário é um slot válido
    const dias = await db.disponibilidade.findMany({ where: { dataISO: novaData } });
    if (dias.length === 0)
      return NextResponse.json({ erro: "Este dia está fechado" }, { status: 409 });
    const horaValida = (dias as { inicio: string; fim: string; slotMin: number | null }[]).some((d) =>
      gerarSlotsDia(d.inicio, d.fim, d.slotMin ?? 60).includes(novaHora)
    );
    if (!horaValida)
      return NextResponse.json({ erro: "Novo horário fora do expediente" }, { status: 409 });

    // Valida que o novo slot está livre
    const ocupado = await db.agendamento.findUnique({
      where: { dataISO_hora: { dataISO: novaData, hora: novaHora } },
    });
    if (ocupado && ocupado.status !== "cancelado")
      return NextResponse.json({ erro: "Este novo horário já está ocupado" }, { status: 409 });
    if (ocupado) await db.agendamento.delete({ where: { id: ocupado.id } });

    const atualizado = await db.agendamento.update({
      where: { id: ag.id },
      data: { dataISO: novaData, hora: novaHora },
      include: { servico: true, cliente: true },
    });

    return NextResponse.json({ ok: true, agendamento: atualizado });
  } catch (e) {
    console.error("[api/agendamentos/remarcar]", e);
    return NextResponse.json({ erro: "Falha ao remarcar" }, { status: 500 });
  }
}
