import { NextResponse } from "next/server";
import { gerarPix, pixConfigurado } from "@/lib/pagamento";

// POST /api/pagamentos/pix { agendamentoId } — gera QR dinâmico (dono gera link manual aqui também)
export async function POST(req: Request) {
  if (!pixConfigurado())
    return NextResponse.json(
      { erro: "PIX indisponível no momento — escolha pagar no local." },
      { status: 503 }
    );
  try {
    const { agendamentoId } = await req.json();
    if (!agendamentoId) return NextResponse.json({ erro: "Informe agendamentoId" }, { status: 400 });
    const pix = await gerarPix(agendamentoId);
    return NextResponse.json(pix, { status: 201 });
  } catch (e) {
    console.error("[pix POST]", e);
    return NextResponse.json({ erro: (e as Error)?.message ?? "Falha ao gerar PIX" }, { status: 500 });
  }
}

// GET /api/pagamentos/pix?agendamentoId= — polling: já pagou? (sem expor QR de novo)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agendamentoId = searchParams.get("agendamentoId") ?? "";
  try {
    const { db } = await import("@/lib/db");
    const ag = await db.agendamento.findUnique({ where: { id: agendamentoId } });
    if (!ag) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
    if (ag.status === "pago") return NextResponse.json({ status: "pago" });
    if (!pixConfigurado() || !ag.pagamentoId)
      return NextResponse.json({ status: ag.status });
    const { confirmarSeAprovado } = await import("@/lib/pagamento");
    const pago = await confirmarSeAprovado(ag.pagamentoId);
    return NextResponse.json({ status: pago ? "pago" : "aguardando" });
  } catch (e) {
    console.error("[pix GET]", e);
    return NextResponse.json({ erro: "Falha ao consultar" }, { status: 500 });
  }
}
