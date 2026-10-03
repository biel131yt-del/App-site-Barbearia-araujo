import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarSlotsDia } from "@/lib/slots";

const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const ISO_HORA = /^\d{2}:\d{2}$/;

// GET /api/disponibilidade?de=2026-10-01&ate=2026-10-14
// Retorna dias ABERTOS com slots e ocupação real (só mostra o que está livre no app).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const de = searchParams.get("de") ?? new Date().toISOString().slice(0, 10);
  const ate = searchParams.get("ate") ?? de;
  try {
    const dias = await db.disponibilidade.findMany({
      where: { dataISO: { gte: de, lte: ate } },
      orderBy: [{ dataISO: "asc" }, { inicio: "asc" }],
    });
    const ags = await db.agendamento.findMany({
      where: { dataISO: { gte: de, lte: ate }, status: { not: "cancelado" } },
      select: { dataISO: true, hora: true },
    });
    const ocupados = new Set(ags.map((a) => `${a.dataISO}|${a.hora}`));

    // FASE 5 (avançado): bloqueia slots que conflitam com a agenda pessoal do dono.
    // Best-effort — se o Google falhar, vale só a ocupação do banco.
    let ocupacaoGoogle: { inicioMs: number; fimMs: number }[] = [];
    try {
      const { googleConectado, listarOcupacaoGoogle } = await import("@/lib/google");
      if (await googleConectado()) ocupacaoGoogle = await listarOcupacaoGoogle(de, ate);
    } catch {
      ocupacaoGoogle = [];
    }
    const { slotConflitaGoogle } = await import("@/lib/google");

    const resultado = dias.map((d) => {
      const horas = gerarSlotsDia(d.inicio, d.fim);
      return {
        ...d,
        slots: horas.map((hora) => ({
          hora,
          disponivel:
            !ocupados.has(`${d.dataISO}|${hora}`) &&
            (ocupacaoGoogle.length === 0 || !slotConflitaGoogle(ocupacaoGoogle, d.dataISO, hora)),
        })),
      };
    });
    return NextResponse.json(resultado);
  } catch (e) {
    console.error("[api/disponibilidade GET]", e);
    return NextResponse.json({ erro: "Falha ao listar disponibilidade" }, { status: 500 });
  }
}

// POST /api/disponibilidade { dataISO, inicio, fim } — "Adicionar dia disponível"
export async function POST(req: Request) {
  try {
    const { dataISO, inicio, fim } = await req.json();
    if (!ISO_DATA.test(dataISO ?? "") || !ISO_HORA.test(inicio ?? "") || !ISO_HORA.test(fim ?? ""))
      return NextResponse.json({ erro: "Use data yyyy-mm-dd e horas HH:mm" }, { status: 400 });
    if (gerarSlotsDia(inicio, fim).length === 0)
      return NextResponse.json({ erro: "Intervalo inválido (fim deve ser após início)" }, { status: 400 });

    const dia = await db.disponibilidade.create({ data: { dataISO, inicio, fim } });
    return NextResponse.json(dia, { status: 201 });
  } catch (e: unknown) {
    // dia+hora duplicados
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002")
      return NextResponse.json({ erro: "Este intervalo já foi cadastrado" }, { status: 409 });
    console.error("[api/disponibilidade POST]", e);
    return NextResponse.json({ erro: "Falha ao salvar disponibilidade" }, { status: 500 });
  }
}

// DELETE /api/disponibilidade?dataISO=2026-10-27 — "Fechar o dia" (apaga tudo do dia)
// Com &inicio=19:00 apaga só aquele intervalo.
// Com &de=2026-12-20&ate=2027-01-05 apaga o período ("Modo Férias").
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const dataISO = searchParams.get("dataISO") ?? "";
  const inicio = searchParams.get("inicio");
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");
  if (de || ate) {
    if (!ISO_DATA.test(de ?? "") || !ISO_DATA.test(ate ?? ""))
      return NextResponse.json({ erro: "Informe de/ate em yyyy-mm-dd" }, { status: 400 });
    try {
      const r = await db.disponibilidade.deleteMany({
        where: { dataISO: { gte: de as string, lte: ate as string } },
      });
      return NextResponse.json({ removidos: r.count });
    } catch (e) {
      console.error("[api/disponibilidade DELETE range]", e);
      return NextResponse.json({ erro: "Falha no modo férias" }, { status: 500 });
    }
  }
  if (!ISO_DATA.test(dataISO))
    return NextResponse.json({ erro: "Informe dataISO yyyy-mm-dd" }, { status: 400 });
  try {
    const r = await db.disponibilidade.deleteMany({
      where: inicio ? { dataISO, inicio } : { dataISO },
    });
    return NextResponse.json({ removidos: r.count });
  } catch (e) {
    console.error("[api/disponibilidade DELETE]", e);
    return NextResponse.json({ erro: "Falha ao fechar o dia" }, { status: 500 });
  }
}
