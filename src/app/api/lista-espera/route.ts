import { NextResponse } from "next/server";
import { db } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { telefoneCanonico } from "@/lib/cliente";

const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const ISO_HORA = /^\d{2}:\d{2}$/;

// GET /api/lista-espera — admin lista quem está esperando (requer login)
// Query: ?atendido=0 para só os não atendidos
export async function GET(req: Request) {
  const sess = await getServerSession(authOptions);
  if (!sess) return NextResponse.json({ erro: "Login necessário" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const atendido = searchParams.get("atendido");

  try {
    const lista = await db.listaEspera.findMany({
      where: atendido !== undefined ? { atendido: atendido === "1" } : {},
      include: { servico: true },
      orderBy: { criadoEm: "desc" },
      take: 200,
    });
    return NextResponse.json(lista);
  } catch (e) {
    console.error("[api/lista-espera GET]", e);
    return NextResponse.json({ erro: "Falha ao listar lista de espera" }, { status: 500 });
  }
}

// POST /api/lista-espera — cliente entra na lista de espera quando o horário está lotado
// Body: { servicoId, dataISO, nome, telefone, horaPreferida? }
export async function POST(req: Request) {
  try {
    const { servicoId, dataISO, nome, telefone, horaPreferida } = await req.json();
    const tel = telefoneCanonico(telefone ?? "");
    if (!servicoId || !dataISO || !nome?.trim() || tel.length < 10)
      return NextResponse.json({ erro: "Serviço, data, nome e WhatsApp são obrigatórios" }, { status: 400 });
    if (!ISO_DATA.test(dataISO))
      return NextResponse.json({ erro: "Use data yyyy-mm-dd" }, { status: 400 });
    if (horaPreferida && !ISO_HORA.test(horaPreferida))
      return NextResponse.json({ erro: "Hora preferida deve ser HH:mm" }, { status: 400 });

    const servico = await db.servico.findFirst({ where: { id: servicoId, ativo: true } });
    if (!servico) return NextResponse.json({ erro: "Serviço inválido" }, { status: 400 });

    const entrada = await db.listaEspera.create({
      data: {
        servicoId,
        dataISO,
        nome: nome.trim(),
        telefone: tel,
        horaPreferida: horaPreferida ?? null,
      },
      include: { servico: true },
    });
    return NextResponse.json(entrada, { status: 201 });
  } catch (e) {
    console.error("[api/lista-espera POST]", e);
    return NextResponse.json({ erro: "Falha ao entrar na lista de espera" }, { status: 500 });
  }
}
