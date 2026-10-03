import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/push/subscrever { endpoint, keys: { p256dh, auth } } — salva aparelho do dono
export async function POST(req: Request) {
  try {
    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return NextResponse.json({ erro: "Inscrição inválida" }, { status: 400 });
    await db.pushInscricao.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/subscrever]", e);
    return NextResponse.json({ erro: "Falha ao salvar inscrição" }, { status: 500 });
  }
}

// DELETE /api/push/subscrever { endpoint } — desliga o aparelho
export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) await db.pushInscricao.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/desligar]", e);
    return NextResponse.json({ erro: "Falha ao remover inscrição" }, { status: 500 });
  }
}
