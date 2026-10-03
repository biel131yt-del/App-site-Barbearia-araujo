// Integração WhatsApp — SEM WhatsApp Business (só wa.me + push + futuro Evolution/Z-API)
// Estratégia em camadas (ver especificação atualizada):
// - HOJE (Fase 6a): link wa.me pré-preenchido — cliente clica e envia ao dono.
// - FASE 6b: push notification via PWA (não depende do cliente clicar).
// - FUTURO: Evolution API / Z-API via QR Code (WhatsApp normal, envio automático).
// Código modular: quando migrar, só trocar o "provedor" aqui.

import { WHATSAPP_DONO } from "./config";
import { SERVICOS_MOCK } from "./dados-mock";
import { formatarDataBR } from "./agendamento";
import type { Agendamento } from "./agendamento";

export type ProvedorWhatsApp = "link" | "push" | "evolution" | "zapi";

// Monta o texto do agendamento (reutilizado pelo link e pelo futuro envio automático)
export function montarMensagemAgendamento(a: Agendamento) {
  const serv = SERVICOS_MOCK.find((s) => s.id === a.servicoId);
  const linhas = [
    "Novo agendamento — Barbearia Araujo",
    "",
    `Cliente: ${a.nome}`,
    `Serviço: ${serv?.nome ?? a.servicoId}`,
    `Data: ${formatarDataBR(a.dataISO)} às ${a.hora}`,
    `Tel: ${a.whatsapp}`,
    `Pagamento: ${a.pagamento === "pix" ? "PIX antecipado" : "No local"}`,
  ];
  return linhas.join("\n");
}

// FASE atual: gera link wa.me para o DONO (WhatsApp pessoal/normal)
export function linkWhatsAppDono(a: Agendamento, numero = WHATSAPP_DONO) {
  const texto = encodeURIComponent(montarMensagemAgendamento(a));
  return `https://wa.me/${numero}?text=${texto}`;
}

// Modelo padrão da mensagem p/ o cliente. Variáveis: {nome} {servico} {data} {hora}
// O dono personaliza em Ajustes (texto livre — conversa ou marketing).
export const MENSAGEM_PADRAO =
  "Olá {nome}! Aqui é da Barbearia Araujo ✂️ — confirmando seu {servico} em {data} às {hora}.";

export function aplicarModelo(modelo: string, vars: Record<string, string>) {
  let texto = modelo && modelo.trim() ? modelo : MENSAGEM_PADRAO;
  for (const [chave, valor] of Object.entries(vars)) {
    texto = texto.replaceAll(`{${chave}}`, valor);
  }
  return texto;
}

// Link wa.me para falar COM O CLIENTE (usado no painel admin — FASE 4)
// Passe o modelo salvo em /api/config para usar o texto do dono.
export function linkWhatsAppCliente(telefoneCliente: string, mensagem: string) {
  const tel = `55${telefoneCliente.replace(/\D/g, "")}`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`;
}

// ── Placeholders futuros (não executar ainda) ──
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function enviarPushDono(_titulo: string, _corpo: string): Promise<void> {
  // TODO FASE 6b: Web Push via service worker (next-pwa + web-push)
  console.info("[push] ainda não implementado — FASE 6b");
}

export async function enviarViaEvolutionAPI(_a: Agendamento): Promise<void> {
  // TODO FUTURO: POST para Evolution/Z-API com QR do WhatsApp normal do dono
  throw new Error("Evolution API ainda não configurada — usar link wa.me por enquanto.");
}
