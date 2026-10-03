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

// Monta o texto do agendamento com VOZ DO CLIENTE (1ª pessoa, natural).
// Ex: "Fala! Aqui é o José, quero confirmar meu corte: Barba — 03/10/2026 às 11:00..."
export function montarMensagemAgendamento(a: Agendamento, servicoNome?: string) {
  const serv =
    servicoNome ?? SERVICOS_MOCK.find((s) => s.id === a.servicoId)?.nome ?? a.servicoId;
  const linhas = [
    `Fala! Aqui é ${a.nome}, quero confirmar meu horário:`,
    "",
    `${serv} — ${formatarDataBR(a.dataISO)} às ${a.hora}`,
    `Meu número: ${a.whatsapp}`,
    `Pagamento: ${a.pagamento === "pix" ? "PIX (já pago)" : "no local"}`,
    "",
    "Pode confirmar? Valeu!",
  ];
  return linhas.join("\n");
}

// FASE atual: gera link wa.me para o DONO (WhatsApp pessoal/normal)
export function linkWhatsAppDono(a: Agendamento, servicoNome?: string, numero = WHATSAPP_DONO) {
  const texto = encodeURIComponent(montarMensagemAgendamento(a, servicoNome));
  return `https://wa.me/${numero}?text=${texto}`;
}

// Modelo padrão da mensagem p/ o cliente. Variáveis: {nome} {servico} {data} {hora}
// O dono personaliza em Ajustes (texto livre — conversa ou marketing).
export const MENSAGEM_PADRAO =
  "Olá {nome}! Aqui é da Barbearia Araujo — confirmando seu {servico} em {data} às {hora}.";

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
  const dig = telefoneCliente.replace(/\D/g, "");
  const tel = dig.startsWith("55") ? dig : `55${dig}`; // evita 55 duplicado
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
