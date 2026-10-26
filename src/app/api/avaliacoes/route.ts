import { NextResponse } from "next/server";
import { db } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const NOTA_MIN = 1;
const NOTA_MAX = 5;

// GET /api/avaliacoes — lista avaliações (público, só aprovadas? aqui mostra todas)
// Admin pode usar ?todos=1 para ver todas com dados do agendamento
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agendamentoId = searchParams.get("agendamentoId");
  const todos = searchParams.get("todos") === "1";

  try {
    if (todos) {
      const sess = await getServerSession(authOptions);
      if (!sess)
        return NextResponse.json({ erro: "Login necessário" }, { status: 401 });
    }

    const lista = await db.avaliacao.findMany({
      where: agendamentoId ? { agendamentoId } : {},
      include: {
        agendamento: {
          include: { cliente: true, servico: true },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: 200,
    });
    return NextResponse.json(lista);
  } catch (e) {
    console.error("[api/avaliacoes GET]", e);
    return NextResponse.json({ erro: "Falha ao listar avaliações" }, { status: 500 });
  }
}

// POST /api/avaliacoes — cliente avalia o corte após o atendimento
// Body: { agendamentoId, nota (1-5), comentario? }
export async function POST(req: Request) {
  try {
    const { agendamentoId, nota, comentario } = await req.json();
    if (!agendamentoId)
      return NextResponse.json({ erro: "Informe o agendamento" }, { status: 400 });
    const n = Number(nota);
    if (!Number.isInteger(n) || n < NOTA_MIN || n > NOTA_MAX)
      return NextResponse.json({ erro: "Nota deve ser entre 1 e 5" }, { status: 400 });

    const ag = await db.agendamento.findUnique({ where: { id: agendamentoId } });
    if (!ag) return NextResponse.json({ erro: "Agendamento não encontrado" }, { status: 404 });
    if (ag.status !== "concluido")
      return NextResponse.json({ erro: "Só é possível avaliar após o corte ser concluído" }, { status: 409 });

    // Evita avaliação duplicada (o @unique no schema já protege, mas damos uma mensagem clara)
    const existente = await db.avaliacao.findUnique({ where: { agendamentoId } });
    if (existente)
      return NextResponse.json({ erro: "Este agendamento já foi avaliado" }, { status: 409 });

    const avaliacao = await db.avaliacao.create({
      data: { agendamentoId, nota: n, comentario: comentario ?? null },
      include: { agendamento: { include: { cliente: true, servico: true } } },
    });
    return NextResponse.json(avaliacao, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ erro: "Este agendamento já foi avaliado" }, { status: 409 });
    }
    console.error("[api/avaliacoes POST]", e);
    return NextResponse.json({ erro: "Falha ao salvar avaliação" }, { status: 500 });
  }
}
