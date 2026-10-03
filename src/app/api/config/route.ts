import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/config — público (o site precisa saber se fidelidade aparece)
export async function GET() {
  let cfg = await db.configuracao.findUnique({ where: { id: "global" } }).catch(() => null);
  if (!cfg) {
    cfg = await db.configuracao
      .create({ data: { id: "global" } })
      .catch(() => ({ id: "global", fidelidadeAtiva: true, cortesParaGratis: 10, instagramUrl: "", mensagemWhats: "" }));
  }
  return NextResponse.json(cfg);
}

// PATCH /api/config — só dono (toggle fidelidade, meta de cortes, instagram)
export async function PATCH(req: Request) {
  const sess = await getServerSession(authOptions);
  const papel = (sess?.user as { papel?: string } | undefined)?.papel;
  if (papel !== "super_admin")
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  try {
    const { fidelidadeAtiva, cortesParaGratis, instagramUrl, mensagemWhats } = await req.json();
    const dados: { fidelidadeAtiva?: boolean; cortesParaGratis?: number; instagramUrl?: string; mensagemWhats?: string } = {};
    if (typeof fidelidadeAtiva === "boolean") dados.fidelidadeAtiva = fidelidadeAtiva;
    if (Number.isInteger(cortesParaGratis) && cortesParaGratis >= 2 && cortesParaGratis <= 30)
      dados.cortesParaGratis = cortesParaGratis;
    if (typeof instagramUrl === "string") dados.instagramUrl = instagramUrl.slice(0, 200);
    if (typeof mensagemWhats === "string") dados.mensagemWhats = mensagemWhats.slice(0, 500);
    const cfg = await db.configuracao.upsert({ where: { id: "global" }, update: dados, create: { id: "global", ...dados } });
    return NextResponse.json(cfg);
  } catch (e) {
    console.error("[config PATCH]", e);
    return NextResponse.json({ erro: "Falha ao salvar" }, { status: 500 });
  }
}
