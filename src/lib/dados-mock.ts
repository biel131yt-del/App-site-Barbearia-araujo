// Dados mock — na FASE 3 virão do banco (Supabase/Postgres)
export type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracaoMin: number;
  descricao: string;
  icone: string; // nome do ícone lucide
  faixa: string; // adulto | infantil
};

export const SERVICOS_MOCK: Servico[] = [
  {
    id: "degrade",
    nome: "Degradê",
    preco: 30,
    duracaoMin: 40,
    descricao: "Degradê na máquina + acabamento",
    icone: "scissors",
    faixa: "adulto",
  },
  {
    id: "degrade-navalhado",
    nome: "Degradê Navalhado",
    preco: 35,
    duracaoMin: 50,
    descricao: "Degradê + navalha no detalhe",
    icone: "sparkles",
    faixa: "adulto",
  },
  {
    id: "barba",
    nome: "Barba",
    preco: 17,
    duracaoMin: 30,
    descricao: "Toalha quente + navalha",
    icone: "razor",
    faixa: "adulto",
  },
];

export function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
