import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/servicos — lista serviços ativos (ordenados por preço)
// ?todos=1 (login) inclui inativos p/ o painel
export async function GET(req: Request) {
  try {
    const todos = new URL(req.url).searchParams.get("todos") === "1";
    if (todos) {
      const sess = await getServerSession(authOptions);
      if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });
    }
    const servicos = await db.servico.findMany({
      where: todos ? {} : { ativo: true },
      orderBy: { precoCentavos: "asc" },
    });
    return NextResponse.json(servicos);
  } catch (e) {
    console.error("[api/servicos]", e);
    return NextResponse.json({ erro: "Falha ao listar serviços" }, { status: 500 });
  }
}

async function exigirDono() {
  const sess = await getServerSession(authOptions);
  return (sess?.user as { papel?: string } | undefined)?.papel === "super_admin";
}

// POST /api/servicos — criar (só dono)
export async function POST(req: Request) {
  if (!(await exigirDono())) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  try {
    const { nome, precoReais, duracaoMin, descricao, fotoUrl, faixa } = await req.json();
    if (!nome?.trim() || !(precoReais > 0))
      return NextResponse.json({ erro: "Nome e preço são obrigatórios" }, { status: 400 });
    const s = await db.servico.create({
      data: {
        nome: nome.trim(),
        precoCentavos: Math.round(precoReais * 100),
        duracaoMin: duracaoMin || 40,
        descricao: (descricao ?? "").slice(0, 200),
        fotoUrl: (fotoUrl ?? "").slice(0, 500) || null,
        faixa: faixa === "infantil" ? "infantil" : "adulto",
      },
    });
    return NextResponse.json(s, { status: 201 });
  } catch (e) {
    console.error("[servicos POST]", e);
    return NextResponse.json({ erro: "Falha ao criar" }, { status: 500 });
  }
}

// PATCH /api/servicos { id, ... } — editar / ativar-desativar (só dono)
export async function PATCH(req: Request) {
  if (!(await exigirDono())) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  try {
    const { id, nome, precoReais, duracaoMin, descricao, fotoUrl, faixa, ativo } = await req.json();
    if (!id) return NextResponse.json({ erro: "Informe id" }, { status: 400 });
    const dados: Record<string, unknown> = {};
    if (typeof nome === "string" && nome.trim()) dados.nome = nome.trim();
    if (precoReais > 0) dados.precoCentavos = Math.round(precoReais * 100);
    if (duracaoMin > 0) dados.duracaoMin = duracaoMin;
    if (typeof descricao === "string") dados.descricao = descricao.slice(0, 200);
    if (typeof fotoUrl === "string") dados.fotoUrl = fotoUrl.slice(0, 500) || null;
    if (faixa === "adulto" || faixa === "infantil") dados.faixa = faixa;
    if (typeof ativo === "boolean") dados.ativo = ativo;
    const s = await db.servico.update({ where: { id }, data: dados });
    return NextResponse.json(s);
  } catch (e) {
    console.error("[servicos PATCH]", e);
    return NextResponse.json({ erro: "Falha ao salvar" }, { status: 500 });
  }
}

// DELETE /api/servicos?id= — remove (só dono; com histórico, prefira desativar)
export async function DELETE(req: Request) {
  if (!(await exigirDono())) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  try {
    await db.servico.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { erro: "Tem agendamento ligado a ele — desative em vez de excluir." },
      { status: 409 }
    );
  }
}
