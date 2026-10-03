import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Resumo de caixa de um dia — quanto PIX, quanto dinheiro, quantos atendimentos
export async function GET(req: Request) {
  const sess = await getServerSession(authOptions);
  if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const dataISO = searchParams.get("dataISO") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO))
    return NextResponse.json({ erro: "Informe dataISO" }, { status: 400 });

  const ags = await db.agendamento.findMany({
    where: { dataISO, status: { in: ["concluido", "pago"] } },
    include: { servico: true },
  });
  const soma = (f: (a: (typeof ags)[number]) => boolean) =>
    ags.filter(f).reduce((s, a) => s + a.servico.precoCentavos, 0);
  const fechamento = await db.caixaFechamento.findUnique({ where: { dataISO } }).catch(() => null);
  const pend = await db.agendamento.count({
    where: { dataISO, status: { notIn: ["concluido", "pago", "cancelado"] } },
  });
  return NextResponse.json({
    dataISO,
    qtd: ags.length,
    totalCentavos: soma(() => true),
    totalPix: soma((a) => a.pagamento === "pix" && a.status === "pago"),
    totalDinheiro: soma((a) => !(a.pagamento === "pix" && a.status === "pago")),
    pendentes: pend,
    fechado: !!fechamento,
  });
}
