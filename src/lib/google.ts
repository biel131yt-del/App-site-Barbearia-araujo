// Google Calendar — FASE 5 (googleapis + OAuth2)
// Fluxo: dono clica "Conectar" 1x → Google autoriza → salvamos refresh_token.
// A cada agendamento, criamos evento com lembrete de 30 min (sem travar a reserva se falhar).

import { google } from "googleapis";
import { db } from "./db";

const ESCOPOS = ["https://www.googleapis.com/auth/calendar.events"];

function credenciais() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";
  return { clientId, clientSecret, redirectUri };
}

export function googleConfigurado() {
  const { clientId, clientSecret } = credenciais();
  return clientId.length > 0 && clientSecret.length > 0;
}

function oauth2() {
  const { clientId, clientSecret, redirectUri } = credenciais();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// URL p/ o dono autorizar (access_type offline = devolve refresh_token)
export function urlAutorizacaoGoogle() {
  return oauth2().generateAuthUrl({ access_type: "offline", scope: ESCOPOS, prompt: "consent" });
}

export async function salvarContaGoogle(code: string) {
  const auth = oauth2();
  const { tokens } = await auth.getToken(code);
  if (!tokens.refresh_token) throw new Error("Google não devolveu refresh_token");
  auth.setCredentials(tokens);
  // Pega o e-mail da conta p/ mostrar no painel
  let email: string | undefined;
  try {
    const { data } = await google.oauth2({ version: "v2", auth }).userinfo.get();
    email = data.email ?? undefined;
  } catch {
    /* opcional */
  }
  await db.googleConta.upsert({
    where: { id: "principal" },
    update: { refreshToken: tokens.refresh_token, email },
    create: { id: "principal", refreshToken: tokens.refresh_token, email },
  });
  return email;
}

export async function googleConectado() {
  const conta = await db.googleConta.findUnique({ where: { id: "principal" } }).catch(() => null);
  return conta;
}

async function calendario() {
  const conta = await db.googleConta.findUnique({ where: { id: "principal" } });
  if (!conta) throw new Error("Google Agenda não conectada");
  const auth = oauth2();
  auth.setCredentials({ refresh_token: conta.refreshToken });
  return google.calendar({ version: "v3", auth });
}

export type EventoAgendamento = {
  nome: string;
  telefone: string;
  servico: string;
  duracaoMin: number;
  dataISO: string; // yyyy-mm-dd
  hora: string; // HH:mm
  pagamento: string;
};

// Cria o evento. Nunca deve quebrar o agendamento — quem chama trata o erro.
export async function criarEventoAgendamento(e: EventoAgendamento) {
  const cal = await calendario();
  const [ano, mes, dia] = e.dataISO.split("-").map(Number);
  const [h, min] = e.hora.split(":").map(Number);
  const inicio = new Date(ano, mes - 1, dia, h, min);
  const fim = new Date(inicio.getTime() + e.duracaoMin * 60000);
  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `Cliente: ${e.nome} — ${e.servico}`,
      description: `Telefone: ${e.telefone}\nPagamento: ${e.pagamento === "pix" ? "PIX antecipado" : "No local"}\nAgendado pela Barbearia Araujo`,
      start: { dateTime: inicio.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: fim.toISOString(), timeZone: "America/Sao_Paulo" },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
    },
  });
  return res.data.id ?? null;
}

// Lê eventos do período (p/ bloquear horários automaticamente — opcional avançado).
// Retorna lista de { inicioMs, fimMs }. Falha → lista vazia (não bloqueia nada).
export async function listarOcupacaoGoogle(deISO: string, ateISO: string) {
  try {
    const cal = await calendario();
    const res = await cal.events.list({
      calendarId: "primary",
      timeMin: new Date(`${deISO}T00:00:00-03:00`).toISOString(),
      timeMax: new Date(`${ateISO}T23:59:59-03:00`).toISOString(),
      singleEvents: true,
      maxResults: 100,
    });
    return (res.data.items ?? [])
      .filter((ev) => ev.status !== "cancelled" && (ev.start?.dateTime || ev.start?.date))
      .map((ev) => ({
        inicioMs: new Date(ev.start!.dateTime ?? `${ev.start!.date}T00:00:00-03:00`).getTime(),
        fimMs: new Date(ev.end?.dateTime ?? `${ev.end?.date ?? ev.start!.date}T23:59:59-03:00`).getTime(),
      }));
  } catch {
    return [];
  }
}

// Diz se um slot de 1h (hora local) conflita com algum evento do Google.
export function slotConflitaGoogle(
  ocupacao: { inicioMs: number; fimMs: number }[],
  dataISO: string,
  hora: string
) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  // Constrói em horário local do servidor; compara em ms (mesma base dos eventos)
  const ini = new Date(ano, mes - 1, dia, h, min).getTime();
  const fim = ini + 60 * 60000;
  return ocupacao.some((o) => ini < o.fimMs && fim > o.inicioMs);
}
