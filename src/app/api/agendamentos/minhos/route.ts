import { NextResponse } from "next/server";
import { telefoneCanonico } from "@/lib/cliente";
import { db } from "@/db";

// GET /api/agendamentos/minhos?token=... ou ?telefone=...
// Lista agendamentos ativos (não cancelados) de um cliente.
// Pode ser consultado por token de acesso (mais seguro) ou por telefone.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";
  const telefoneRaw = searchParams.get("telefone") ?? "";

  try {
    // Prioridade 1: busca por token (mais seguro)
    if (token.trim()) {
      const ags = await db.agendamento.findMany({
        where: {
          tokenAcesso: token.trim(),
          status: { not: "cancelado" },
        },
        include: { servico: true, cliente: true },
        orderBy: [{ dataISO: "asc" }, { hora: "asc" }],
        take: 50,
      });
      return NextResponse.json({ agendamentos: ags });
    }

    // Prioridade 2: busca por telefone (compatibilidade)
    const telefone = telefoneCanonico(telefoneRaw);
    if (telefone.length < 10) {
      return NextResponse.json({ agendamentos: [] });
    }

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
