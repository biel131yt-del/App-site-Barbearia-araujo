// Lógica de agendamento (MOCK) — FASE 2
// Na FASE 3 tudo isso virá do banco (disponibilidade real do dono).
import { SERVICOS_MOCK } from "./dados-mock";

export type Pagamento = "pix" | "local";

export type Slot = { hora: string; disponivel: boolean };

export type DiaAberto = {
  iso: string; // yyyy-mm-dd
  date: Date;
  aberto: boolean;
  motivo?: string;
};

export type Agendamento = {
  id: string;
  servicoId: string;
  dataISO: string;
  hora: string;
  nome: string;
  whatsapp: string;
  pagamento: Pagamento;
  trocoPara?: string | null;
  criadoEm: string;
  tokenAcesso?: string | null;
};

// ── datas ─────────────────────────────────────────
export function toISODate(d: Date) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataLonga(iso: string) {  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// dd/mm/yyyy p/ mensagens (WhatsApp, e-mail) — nunca yyyy-mm-dd
export function formatarDataBR(iso: string) {
  const [a, m, d] = iso.split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

const DIA_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export function diaSemanaCurto(date: Date) {
  return DIA_SEMANA[date.getDay()];
}

// Gera próximos N dias. Regra mock: domingo fechado + 1 dia fechado de exemplo.
// Espelha a regra real: dono abre manualmente; aqui simulamos dias abertos.
export function gerarDiasAbertos(qtd = 14): DiaAberto[] {
  const hoje = new Date();
  const dias: DiaAberto[] = [];
  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const iso = toISODate(d);
    const domingo = d.getDay() === 0;
    // simula um dia fechado manualmente (ex: daqui 5 dias)
    const fechadoExemplo = i === 5;
    dias.push({
      iso,
      date: d,
      aberto: !domingo && !fechadoExemplo,
      motivo: domingo ? "Fechado aos domingos" : fechadoExemplo ? "Dono indisponível" : undefined,
    });
  }
  return dias;
}

// Gera slots de 1h. Regra mock:
// seg–sex: 09:00–19:00 | sáb: 08:00–12:00 | exemplo tardio: se dia 26 → 19,20,21h
// Ocupação pseudo-aleatória determinística (mesmo resultado sempre).
export function gerarSlots(dataISO: string): Slot[] {
  const [a, m, d] = dataISO.split("-").map(Number);
  const data = new Date(a, m - 1, d);
  const dia = data.getDate();
  const diaSemana = data.getDay();

  let horas: string[] = [];
  if (dia === 26) {
    // exemplo real do dono: dia 26, 19h–22h → 3 slots
    horas = ["19:00", "20:00", "21:00"];
  } else if (diaSemana === 6) {
    horas = ["08:00", "09:00", "10:00", "11:00", "12:00"];
  } else {
    horas = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  }

  return horas.map((hora) => {
    // hash simples p/ simular ocupação sem aleatoriedade real
    const seed = (dataISO + hora).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    return { hora, disponivel: seed % 4 !== 0 };
  });
}

// ── clientes mock (bem-vindo de volta + fidelidade) ──
export type ClienteMock = { telefone: string; nome: string; ultimoCorte: string; totalCortes: number };

export const CLIENTES_MOCK: ClienteMock[] = [
  { telefone: "11999990000", nome: "Carlos Silva", ultimoCorte: "Corte Masculino", totalCortes: 9 },
  { telefone: "11988880000", nome: "João Pedro", ultimoCorte: "Corte + Barba", totalCortes: 4 },
];

export function apenasDigitos(tel: string) {
  return tel.replace(/\D/g, "");
}

export function buscarClientePorTelefone(tel: string): ClienteMock | null {
  const dig = apenasDigitos(tel);
  if (dig.length < 8) return null;
  return CLIENTES_MOCK.find((c) => apenasDigitos(c.telefone).endsWith(dig.slice(-8))) ?? null;
}

export function mascararTelefone(v: string) {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function telefoneValido(tel: string) {
  return apenasDigitos(tel).length >= 10;
}

// ── links externos ────────────────────────────────
// WhatsApp via wa.me (WhatsApp NORMAL do dono — sem Business).
// Função real mora em @/lib/whatsapp (modular p/ futura Evolution/Z-API).
// Re-export aqui para não quebrar imports existentes.
export { linkWhatsAppDono } from "./whatsapp";

// Google Calendar template (sem API — FASE 5 usa API direta)
export function linkGoogleCalendar(a: Agendamento) {
  const serv = SERVICOS_MOCK.find((s) => s.id === a.servicoId);
  const [h, min] = a.hora.split(":").map(Number);
  const [ano, mes, dia] = a.dataISO.split("-").map(Number);
  const inicio = new Date(ano, mes - 1, dia, h, min);
  const fim = new Date(inicio.getTime() + (serv?.duracaoMin ?? 40) * 60000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Corte: ${a.nome} — ${serv?.nome ?? ""}`,
    dates: `${fmt(inicio)}/${fmt(fim)}`,
    details: `Cliente: ${a.nome} | Tel: ${a.whatsapp} | Pagamento: ${a.pagamento}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── persistência local (mock da FASE 3) ─────────────
const CHAVE = "barbearia_araujo_agendamentos";

export function salvarAgendamentoLocal(a: Agendamento) {
  try {
    const atual = listarAgendamentosLocais();
    localStorage.setItem(CHAVE, JSON.stringify([...atual, a]));
  } catch {
    /* ignora */
  }
}

export function listarAgendamentosLocais(): Agendamento[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? (JSON.parse(raw) as Agendamento[]) : [];
  } catch {
    return [];
  }
}
