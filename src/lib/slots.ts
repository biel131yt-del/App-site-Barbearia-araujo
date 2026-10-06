// Geração de slots — regra do negócio (ex: 19:00–22:00 de 1h → 19,20,21h)
// Arquivo puro (sem dependência cliente) — usado pela API e pelo seed.

export function gerarSlotsDia(inicio: string, fim: string, passo = 60): string[] {
  const paraMin = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + (mm || 0);
  };
  if (passo !== 30 && passo !== 60) passo = 60;
  const ini = paraMin(inicio);
  const end = paraMin(fim);
  if (!(ini >= 0 && end > ini)) return [];
  const slots: string[] = [];
  for (let t = ini; t + passo <= end; t += passo) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
