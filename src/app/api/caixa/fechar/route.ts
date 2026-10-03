import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/caixa/fechar { dataISO } — "Fechar Caixa do Dia" (foto p/ relatório mensal)
export async function POST(req: Request) {
  const sess = await getServerSession(authOptions);
  const papel = (sess?.user as { papel?: string } | undefined)?.papel;
  if (!sess || (papel !== "super_admin" && papel !== "admin"))
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  try {
    const { dataISO } = await req.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO ?? ""))
      return NextResponse.json({ erro: "Informe dataISO" }, { status: 400 });
    const ags = await db.agendamento.findMany({
      where: { dataISO, status: { not: "cancelado" } },
      include: { servico: true },
    });
    const soma = (f: (a: (typeof ags)[number]) => boolean) =>
      ags.filter(f).reduce((s, a) => s + a.servico.precoCentavos, 0);
    const foto = {
      totalCentavos: soma(() => true),
      totalPix: soma((a) => a.pagamento === "pix" && a.status === "pago"),
      totalDinheiro: soma((a) => !(a.pagamento === "pix" && a.status === "pago")),
      qtd: ags.length,
    };
    const fech = await db.caixaFechamento.upsert({
      where: { dataISO },
      update: foto,
      create: { dataISO, ...foto },
    });
    return NextResponse.json(fech, { status: 201 });
  } catch (e) {
    console.error("[caixa/fechar]", e);
    return NextResponse.json({ erro: "Falha ao fechar caixa" }, { status: 500 });
  }
}

// GET /api/caixa/fechar?mes=2026-10 — relatório mensal (quantos atendeu no mês)
export async function GET(req: Request) {
  const sess = await getServerSession(authOptions);
  if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") ?? "";
  if (!/^\d{4}-\d{2}$/.test(mes)) return NextResponse.json({ erro: "Informe mes yyyy-MM" }, { status: 400 });
  const dias = await db.caixaFechamento.findMany({
    where: { dataISO: { startsWith: mes } },
    orderBy: { dataISO: "asc" },
  });
  const total = dias.reduce(
    (s, d) => ({
      totalCentavos: s.totalCentavos + d.totalCentavos,
      totalPix: s.totalPix + d.totalPix,
      totalDinheiro: s.totalDinheiro + d.totalDinheiro,
      qtd: s.qtd + d.qtd,
    }),
    { totalCentavos: 0, totalPix: 0, totalDinheiro: 0, qtd: 0 }
  );
  return NextResponse.json({ mes, dias, total });
}
