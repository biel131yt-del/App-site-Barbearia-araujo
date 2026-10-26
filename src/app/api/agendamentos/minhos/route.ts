import { NextResponse } from "next/server";
import { telefoneCanonico } from "@/lib/cliente";
import { db } from "@/db";

// GET /api/agendamentos/minhos?telefone=555196824286
// Lista agendamentos ativos (não cancelados) de um cliente pelo WhatsApp.
// Público (sem login) — só serve p/ o próprio cliente gerenciar seus horários.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telefone = telefoneCanonico(searchParams.get("telefone") ?? "");
  if (telefone.length < 10) {
    return NextResponse.json({ agendamentos: [] });
  }

  try {
    const cliente = await db.cliente.findUnique({ where: { telefone } });
    if (!cliente) return NextResponse.json({ agendamentos: [] });

    const ags = await db.agendamento.findMany({
      where: {
        clienteId: cliente.id,
        status: { not: "cancelado" },
      },
      include: { servico: true, cliente: true },
      orderBy: [{ dataISO: "asc" }, { hora: "asc" }],
      take: 50,
    });
    return NextResponse.json({ agendamentos: ags });
  } catch (e) {
    console.error("[api/agendamentos/minhos]", e);
    return NextResponse.json({ erro: "Falha ao buscar agendamentos" }, { status: 500 });
  }
}
