// Geração de slots de 1h — regra do negócio (ex: 19:00–22:00 → 19,20,21h)
// Arquivo puro (sem dependência cliente) — usado pela API e pelo seed.

export function gerarSlotsDia(inicio: string, fim: string): string[] {
  const paraMin = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + (mm || 0);
  };
  const ini = paraMin(inicio);
  const end = paraMin(fim);
  if (!(ini >= 0 && end > ini)) return [];
  const slots: string[] = [];
  for (let t = ini; t + 60 <= end; t += 60) {
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
