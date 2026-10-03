// Tipos + contas do dashboard — reutilizado pela agenda se precisar.
export type AgendamentoAdmin = {
  id: string;
  dataISO: string;
  hora: string;
  pagamento: string;
  status: string;
  pushStatus: string;
  googleStatus: string;
  emailStatus: string;
  servico: { nome: string; precoCentavos: number };
  cliente: { nome: string; telefone: string };
};

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Só entra no caixa/faturamento o que foi CONCLUÍDO ou PAGO (reserva sozinha não conta).
// confirmado = reservado | aguardando = PIX gerado | pago = PIX aprovado | concluido = feito
const VALE_CAIXA = ["concluido", "pago"];

// Soma faturamento (ignora cancelados E pendentes) dentro de um filtro de data
export function somar(ags: AgendamentoAdmin[], filtro: (iso: string) => boolean) {
  return ags
    .filter((a) => VALE_CAIXA.includes(a.status) && filtro(a.dataISO))
    .reduce((s, a) => s + a.servico.precoCentavos, 0);
}

export function contar(ags: AgendamentoAdmin[], filtro: (iso: string) => boolean) {
  return ags.filter((a) => VALE_CAIXA.includes(a.status) && filtro(a.dataISO)).length;
}

// Reservas ainda não confirmadas como feitas
export function pendentes(ags: AgendamentoAdmin[], filtro: (iso: string) => boolean) {
  return ags.filter((a) => !VALE_CAIXA.includes(a.status) && a.status !== "cancelado" && filtro(a.dataISO)).length;
}

// ISO yyyy-mm-dd compara como string (funciona p/ ordem cronológica)
export function semanaISO(): { de: string; ate: string } {
  const h = new Date();
  const de = new Date(h.getFullYear(), h.getMonth(), h.getDate() - 6);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { de: iso(de), ate: hojeISO() };
}
