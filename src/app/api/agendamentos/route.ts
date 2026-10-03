import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarSlotsDia } from "@/lib/slots";

function soDigitos(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

// GET /api/agendamentos?dataISO=2026-10-26 — lista do dia (dashboard FASE 4)
// Sem filtro retorna tudo (até 1000) p/ faturamento/relatórios do painel.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dataISO = searchParams.get("dataISO");
  try {
    const lista = await db.agendamento.findMany({
      where: dataISO ? { dataISO } : {},
      include: { servico: true, cliente: true },
      orderBy: [{ dataISO: "asc" }, { hora: "asc" }],
      take: 1000,
    });
    return NextResponse.json(lista);
  } catch (e) {
    console.error("[api/agendamentos GET]", e);
    return NextResponse.json({ erro: "Falha ao listar agendamentos" }, { status: 500 });
  }
}

// PATCH /api/agendamentos { id, pagamento?, status? } — ajustes do dono/cliente
// (ex: trocar PIX p/ "pagar no local", marcar concluído/cancelado)
export async function PATCH(req: Request) {
  try {
    const { id, pagamento, status } = await req.json();
    if (!id) return NextResponse.json({ erro: "Informe id" }, { status: 400 });
    const dados: { pagamento?: string; status?: string } = {};
    if (pagamento === "pix" || pagamento === "local") dados.pagamento = pagamento;
    if (["confirmado", "aguardando", "pago", "pendente", "cancelado", "concluido"].includes(status))
      dados.status = status;
    if (Object.keys(dados).length === 0)
      return NextResponse.json({ erro: "Nada para atualizar" }, { status: 400 });
    // trocar p/ local limpa o PIX pendente
    const ag = await db.agendamento.update({
      where: { id },
      data: {
        ...dados,
        ...(dados.pagamento === "local" ? { status: "confirmado", pagamentoId: null, qrTexto: null } : {}),
      },
      include: { servico: true, cliente: true },
    });
    return NextResponse.json(ag);
  } catch (e) {
    console.error("[api/agendamentos PATCH]", e);
    return NextResponse.json({ erro: "Falha ao atualizar" }, { status: 500 });
  }
}

// POST /api/agendamentos — cria agendamento (valida dia aberto + slot livre)
export async function POST(req: Request) {
  try {
    const { servicoId, dataISO, hora, nome, telefone, whatsapp, pagamento } = await req.json();
    const tel = soDigitos(telefone ?? whatsapp ?? "");
    const pag = pagamento === "pix" ? "pix" : "local";

    if (!servicoId || !dataISO || !hora)
      return NextResponse.json({ erro: "Serviço, data e hora são obrigatórios" }, { status: 400 });
    if (!nome?.trim() || tel.length < 10)
      return NextResponse.json({ erro: "Nome e WhatsApp com DDD são obrigatórios" }, { status: 400 });

    // 1) dia precisa estar aberto e hora dentro de algum intervalo
    const dias = await db.disponibilidade.findMany({ where: { dataISO } });
    if (dias.length === 0)
      return NextResponse.json({ erro: "Este dia está fechado" }, { status: 409 });
    const horaValida = dias.some((d) => gerarSlotsDia(d.inicio, d.fim).includes(hora));
    if (!horaValida)
      return NextResponse.json({ erro: "Horário fora do expediente deste dia" }, { status: 409 });

    // 2) slot não pode estar ocupado
    const ocupado = await db.agendamento.findUnique({
      where: { dataISO_hora: { dataISO, hora } },
    });
    if (ocupado && ocupado.status !== "cancelado")
      return NextResponse.json({ erro: "Este horário acabou de ser ocupado" }, { status: 409 });

    // 3) serviço existe?
    const servico = await db.servico.findFirst({ where: { id: servicoId, ativo: true } });
    if (!servico) return NextResponse.json({ erro: "Serviço inválido" }, { status: 400 });

    // 4) cliente (cria ou atualiza nome)
    const cliente = await db.cliente.upsert({
      where: { telefone: tel },
      update: { nome: nome.trim() },
      create: { nome: nome.trim(), telefone: tel },
    });

    const ag = await db.agendamento.create({
      data: { dataISO, hora, pagamento: pag, servicoId: servico.id, clienteId: cliente.id },
      include: { servico: true, cliente: true },
    });

    // FASE extra: registra o status de cada notificação (visível no painel)
    let pushStatus = "sem-inscricao";
    let googleStatus = "desligado";
    let emailStatus = "desligado";

    // FASE 5: espelha no Google Calendar (best-effort — nunca quebra a reserva)
    try {
      const { criarEventoAgendamento } = await import("@/lib/google");
      await criarEventoAgendamento({
        nome: cliente.nome,
        telefone: cliente.telefone,
        servico: servico.nome,
        duracaoMin: servico.duracaoMin,
        dataISO,
        hora,
        pagamento: pag,
      });
      googleStatus = "criado";
    } catch (e) {
      googleStatus = "falha";
      console.warn("[google] evento não criado (agenda não conectada?)", (e as Error)?.message);
    }

    // FASE 6: push no celular do dono + e-mail backup (best-effort)
    try {
      const { notificarDono } = await import("@/lib/push");
      const n = await notificarDono(
        "Novo agendamento ✂️",
        `${cliente.nome} — ${servico.nome} em ${dataISO} às ${hora}`,
        "/admin"
      );
      pushStatus = n > 0 ? "enviado" : "sem-inscricao";
    } catch (e) {
      pushStatus = "falha";
      console.warn("[push] não enviado", (e as Error)?.message);
    }
    try {
      const { emailNovoAgendamento, emailConfigurado } = await import("@/lib/email");
      if (!emailConfigurado()) {
        emailStatus = "desligado";
      } else {
        emailStatus = (await emailNovoAgendamento({
          cliente: cliente.nome,
          telefone: cliente.telefone,
          servico: servico.nome,
          dataISO,
          hora,
          pagamento: pag,
        }))
          ? "enviado"
          : "falha";
      }
    } catch (e) {
      emailStatus = "falha";
      console.warn("[email] não enviado", (e as Error)?.message);
    }

    const final = await db.agendamento.update({
      where: { id: ag.id },
      data: { pushStatus, googleStatus, emailStatus },
      include: { servico: true, cliente: true },
    });

    return NextResponse.json(final, { status: 201 });
  } catch (e) {
    console.error("[api/agendamentos POST]", e);
    return NextResponse.json({ erro: "Falha ao criar agendamento" }, { status: 500 });
  }
}
