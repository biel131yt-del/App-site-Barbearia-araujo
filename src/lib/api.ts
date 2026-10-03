// Cliente HTTP das APIs — FASE 3 (com fallback para mock se API falhar)
// Permite o app funcionar mesmo sem banco (dev) e com banco (produção local).

import { SERVICOS_MOCK, type Servico } from "./dados-mock";
import { gerarDiasAbertos, gerarSlots, type DiaAberto, type Slot } from "./agendamento";

export type ServicoAPI = {
  id: string;
  nome: string;
  precoCentavos: number;
  duracaoMin: number;
  descricao: string;
  faixa: string;
};

export function paraServicoUI(s: ServicoAPI): Servico {
  return {
    id: s.id,
    nome: s.nome,
    preco: s.precoCentavos / 100,
    duracaoMin: s.duracaoMin,
    descricao: s.descricao,
    icone: "scissors",
    faixa: s.faixa ?? "adulto",
  };
}

export async function listarServicos(): Promise<Servico[]> {
  try {
    const r = await fetch("/api/servicos", { cache: "no-store" });
    if (!r.ok) throw new Error("api");
    const dados = (await r.json()) as ServicoAPI[];
    if (!Array.isArray(dados) || dados.length === 0) throw new Error("vazio");
    return dados.map(paraServicoUI);
  } catch {
    return SERVICOS_MOCK; // fallback mock (FASE 2)
  }
}

export type DiaAPI = {
  dataISO: string;
  inicio: string;
  fim: string;
  slots: Slot[];
};

export async function listarDisponibilidade(de: string, ate: string): Promise<DiaAPI[]> {
  const r = await fetch(`/api/disponibilidade?de=${de}&ate=${ate}`, { cache: "no-store" });
  if (!r.ok) throw new Error("Falha ao carregar dias");
  return (await r.json()) as DiaAPI[];
}

// Fallback mock convertido p/ formato da API (quando banco vazio/offline)
export function disponibilidadeMockParaAPI(): DiaAPI[] {
  const dias: DiaAberto[] = gerarDiasAbertos(14);
  return dias
    .filter((d) => d.aberto)
    .map((d) => ({ dataISO: d.iso, inicio: "", fim: "", slots: gerarSlots(d.iso) }));
}
