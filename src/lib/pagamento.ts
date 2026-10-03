// Pagamento PIX via Mercado Pago — FASE 7
// Cliente escolhe "PIX agora" → geramos QR dinâmico → webhook confirma → status=pago.
// "Pagar no local" agenda com status=confirmado (aparece como pendente no caixa).
// Sem MERCADOPAGO_ACCESS_TOKEN: PIX indisponível (frontend cai p/ "no local").

import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "./db";

export function pixConfigurado() {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").length > 0;
}

function client() {
  return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string });
}

export type PixGerado = { pagamentoId: string; qrBase64: string; qrTexto: string };

// Gera cobrança PIX p/ um agendamento e marca como "aguardando".
export async function gerarPix(agendamentoId: string): Promise<PixGerado> {
  if (!pixConfigurado()) throw new Error("PIX não configurado (MERCADOPAGO_ACCESS_TOKEN)");
  const ag = await db.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { servico: true, cliente: true },
  });
  if (!ag) throw new Error("Agendamento não encontrado");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const payment = new Payment(client());
  const res = await payment.create({
    body: {
      transaction_amount: ag.servico.precoCentavos / 100,
      description: `${ag.servico.nome} — ${ag.cliente.nome} (${ag.dataISO} ${ag.hora})`,
      payment_method_id: "pix",
      payer: { email: "cliente@barbearia-araujo.local", first_name: ag.cliente.nome },
      notification_url: `${baseUrl}/api/pagamentos/webhook`,
      metadata: { agendamentoId: ag.id },
    },
  });

  const info = res.point_of_interaction?.transaction_data;
  if (!res.id || !info?.qr_code_base64 || !info?.qr_code)
    throw new Error("Mercado Pago não devolveu o QR Code");

  await db.agendamento.update({
    where: { id: ag.id },
    data: { pagamento: "pix", status: "aguardando", pagamentoId: String(res.id), qrTexto: info.qr_code },
  });
  return { pagamentoId: String(res.id), qrBase64: info.qr_code_base64, qrTexto: info.qr_code };
}

// Consulta o status atual no Mercado Pago (usado pelo polling + webhook).
export async function consultarPix(pagamentoId: string) {
  const payment = new Payment(client());
  const res = await payment.get({ id: pagamentoId });
  return res.status ?? "unknown"; // approved | pending | rejected ...
}

// Marca pago se aprovado. Retorna true quando aprovou agora.
export async function confirmarSeAprovado(pagamentoId: string) {
  const status = await consultarPix(pagamentoId);
  if (status !== "approved") return false;
  const ag = await db.agendamento.findFirst({ where: { pagamentoId } });
  if (ag && ag.status !== "pago") {
    await db.agendamento.update({ where: { id: ag.id }, data: { status: "pago" } });
    return true;
  }
  return ag?.status === "pago";
}
