import { NextResponse } from "next/server";

// POST /api/pagamentos/webhook — Mercado Pago avisa aqui quando o PIX é pago.
// Formatos: ?topic=payment&id=123 ou JSON { type:"payment", data:{ id:"123" } }.
// Localhost não recebe (precisa URL pública: Vercel/ngrok) — o polling cobre o dev.
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    let paymentId =
      url.searchParams.get("id") ?? url.searchParams.get("data.id") ?? "";
    const topic = url.searchParams.get("topic") ?? url.searchParams.get("type") ?? "";
    if (!paymentId) {
      const body = await req.json().catch(() => null);
      paymentId = String(body?.data?.id ?? "");
    }
    if (!paymentId || (topic && topic !== "payment" && topic !== "test"))
      return NextResponse.json({ ok: true });

    const { confirmarSeAprovado } = await import("@/lib/pagamento");
    await confirmarSeAprovado(String(paymentId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook]", e);
    return NextResponse.json({ ok: true }); // sempre 200 p/ o MP não retentar à toa
  }
}
