import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const senhaHash = await bcrypt.hash("Araujo123", 10);
  
  await db.usuario.upsert({
    where: { login: "felipe" },
    update: { senhaHash, ativo: true, papel: "super_admin", nome: "Felipe" },
    create: {
      nome: "Felipe",
      login: "felipe",
      senhaHash,
      papel: "super_admin",
      ativo: true,
    },
  });
  
  console.log("✅ Usuário felipe configurado com sucesso!");
  await db.$disconnect();
}

main().catch(e => { console.error("Erro:", e.message); process.exit(1); });
