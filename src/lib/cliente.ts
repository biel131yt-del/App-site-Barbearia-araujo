// Normalização antiduplicado de clientes — regras num lugar só.

export function soDigitos(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

// Telefone canônico: sem 0 inicial, sem DDI 55 (55119.. → 119..). Une cadastros duplicados.
export function telefoneCanonico(v: string) {
  let d = soDigitos(v).replace(/^0+/, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  return d;
}

// Nome sempre igual: sem espaços duplos, capitalizado ("gabriel  aguiar" → "Gabriel Aguiar")
const PARTICULAS = ["da", "de", "do", "das", "dos", "e"];
export function normalizarNome(nome: string) {
  return (nome ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((p, i) =>
      i > 0 && PARTICULAS.includes(p.toLowerCase())
        ? p.toLowerCase()
        : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )
    .join(" ");
}
