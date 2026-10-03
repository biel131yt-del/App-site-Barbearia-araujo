// Seed inicial — popula serviços + disponibilidade de exemplo
// Rode com: npx prisma migrate dev + npx tsx prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  // Serviços reais (preço em centavos) — cria se não existir
  const servicos = [
    { nome: "Degradê", precoCentavos: 3000, duracaoMin: 40, descricao: "Degradê na máquina + acabamento" },
    { nome: "Degradê Navalhado", precoCentavos: 3500, duracaoMin: 50, descricao: "Degradê + navalha no detalhe" },
    { nome: "Barba", precoCentavos: 1700, duracaoMin: 30, descricao: "Toalha quente + navalha" },
  ];
  for (const s of servicos) {
    const existe = await db.servico.findFirst({ where: { nome: s.nome } });
    if (!existe) await db.servico.create({ data: s });
  }
  // Sincroniza preço da Barba com a tabela real
  await db.servico.updateMany({ where: { nome: "Barba" }, data: { precoCentavos: 1700 } });
  for (const antigo of ["Corte Masculino", "Corte + Barba"]) {
    const temHist = await db.agendamento.count({
      where: { servico: { nome: antigo } },
    });
    if (temHist === 0) await db.servico.deleteMany({ where: { nome: antigo } });
  }

  // Disponibilidade: próximos 14 dias (seg–sex 09–19h, sáb 08–12h, dom fechado)
  const hoje = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if (d.getDay() === 0) continue; // domingo fechado
    const dataISO = toISO(d);
    const intervalo = d.getDay() === 6 ? { inicio: "08:00", fim: "12:00" } : { inicio: "09:00", fim: "19:00" };
    const existe = await db.disponibilidade.findFirst({
      where: { dataISO, inicio: intervalo.inicio },
    });
    if (!existe) await db.disponibilidade.create({ data: { dataISO, ...intervalo } });
  }

  console.log("Seed OK: serviços + 14 dias de disponibilidade");

  // Dono inicial — login "dono" / senha "araujo123" (TROQUE a senha depois!)
  const dono = await db.usuario.findUnique({ where: { login: "dono" } });
  if (!dono) {
    await db.usuario.create({
      data: { nome: "Dono", login: "dono", senhaHash: await bcrypt.hash("araujo123", 10), papel: "super_admin" },
    });
    console.log("Seed OK: usuário dono/araujo123 criado");
  } else if (dono.papel !== "super_admin") {
    await db.usuario.update({ where: { login: "dono" }, data: { papel: "super_admin" } });
    console.log("Seed OK: dono promovido a super_admin");
  }

  const cfg = await db.configuracao.findUnique({ where: { id: "global" } });
  if (!cfg) {
    await db.configuracao.create({ data: { id: "global" } });
    console.log("Seed OK: configurações padrão (fidelidade ON, meta 10)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
