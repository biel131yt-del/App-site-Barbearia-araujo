// Papéis do painel — FASE extra (separação radical cliente × admin)
export type Papel = "super_admin" | "admin" | "barbeiro";

// Rotas legadas do MVP (fase 9) mapeadas p/ os novos papéis.
// "expirado" (acesso temporário vencido) não entra em nada.
function normalizar(papel?: string): Papel | null {
  if (papel === "super_admin") return "super_admin";
  if (papel === "barbeiro") return "barbeiro";
  if (papel === "caixa" || papel === "agenda") return "admin";
  if (papel === "admin") return "admin";
  return null;
}

// super_admin: tudo | admin: dashboard, agenda, clientes, caixa | barbeiro: agenda, clientes
export function podeAcessar(papelBruto: string | undefined, rota: string): boolean {
  const papel = normalizar(papelBruto);
  if (!papel) return false;
  if (papel === "super_admin") return true;
  if (rota.startsWith("/admin/equipe") || rota.startsWith("/admin/config") || rota.startsWith("/admin/servicos"))
    return false;
  if (rota.startsWith("/admin/caixa")) return papel === "admin";
  return true; // dashboard, agenda, clientes
}

export const ROTULOS_PAPEL: Record<Papel, string> = {
  super_admin: "Dono (total)",
  admin: "Equipe (geral)",
  barbeiro: "Barbeiro (agenda)",
};
