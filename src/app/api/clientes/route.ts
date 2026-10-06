import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizarNome, telefoneCanonico } from "@/lib/cliente";
import { db } from "@/lib/db";

// GET /api/clientes — ?telefone=... (bem-vindo de volta) ou ?todos=1 (painel, requer login)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("todos") === "1") return listarTodos();
  const telefone = telefoneCanonico(searchParams.get("telefone") ?? "");
  if (telefone.length < 8)
    return NextResponse.json({ cliente: null, totalAgendamentos: 0, ultimoServico: null, ultimoDataISO: null });

  try {
    const cliente = await db.cliente.findUnique({ where: { telefone } });
    if (!cliente)
      return NextResponse.json({ cliente: null, totalAgendamentos: 0, ultimoServico: null, ultimoDataISO: null });

    const agendamentos = await db.agendamento.findMany({
      where: {
        clienteId: cliente.id,
        status: { not: "cancelado" },
        ...(cliente.bonusResetEm ? { criadoEm: { gt: cliente.bonusResetEm } } : {}),
      },
      include: { servico: true },
      orderBy: { criadoEm: "desc" },
      take: 20,
    });
    return NextResponse.json({
      cliente,
      totalAgendamentos: agendamentos.length,
      ultimoServico: agendamentos[0]?.servico.nome ?? null,
      ultimoDataISO: agendamentos[0]?.dataISO ?? null,
    });
  } catch (e) {
    console.error("[api/clientes GET]", e);
    return NextResponse.json({ erro: "Falha ao buscar cliente" }, { status: 500 });
  }
}

// Lista geral p/ o painel (requer login)
async function listarTodos() {
  const sess = await getServerSession(authOptions);
  if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });
  const lista = await db.cliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      agendamentos: {
        where: { status: { not: "cancelado" } },
        include: { servico: true },
        orderBy: { criadoEm: "desc" },
        take: 5,
      },
    },
    take: 200,
  });
  return NextResponse.json(
    lista.map((c) => ({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      total: c.bonusResetEm
        ? c.agendamentos.filter((a) => a.criadoEm > (c.bonusResetEm as Date)).length
        : c.agendamentos.length,
      ultimoServico: c.agendamentos[0]?.servico.nome ?? null,
      ultimoDataISO: c.agendamentos[0]?.dataISO ?? null,
    }))
  );
}

// PATCH /api/clientes { telefone, reset: true } — zera a contagem de fidelidade
export async function PATCH(req: Request) {
  const sess = await getServerSession(authOptions);
  const papel = (sess?.user as { papel?: string } | undefined)?.papel;
  if (papel !== "super_admin" && papel !== "admin")
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  try {
    const { telefone } = await req.json();
    const tel = telefoneCanonico(telefone ?? "");
    if (!tel) return NextResponse.json({ erro: "Informe telefone" }, { status: 400 });
    await db.cliente.update({ where: { telefone: tel }, data: { bonusResetEm: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[clientes PATCH]", e);
    return NextResponse.json({ erro: "Falha ao resetar" }, { status: 500 });
  }
}

// POST /api/clientes { nome, telefone } — cria ou atualiza nome (upsert)
export async function POST(req: Request) {
  try {
    const { nome, telefone } = await req.json();
    const tel = telefoneCanonico(telefone ?? "");
    if (!nome?.trim() || tel.length < 10)
      return NextResponse.json({ erro: "Nome e WhatsApp com DDD são obrigatórios" }, { status: 400 });

    const cliente = await db.cliente.upsert({
      where: { telefone: tel },
      update: { nome: normalizarNome(nome) },
      create: { nome: normalizarNome(nome), telefone: tel },
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (e) {
    console.error("[api/clientes POST]", e);
    return NextResponse.json({ erro: "Falha ao salvar cliente" }, { status: 500 });
  }
}
