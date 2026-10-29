const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const DATABASE_URL = "postgresql://neondb_owner:npg_N2PzDkrvofE0@ep-wandering-waterfall-b5wm0vkz-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const db = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const usuario = await db.usuario.findUnique({ where: { login: "dono" } });

  if (!usuario) {
    console.log("❌ Usuário 'dono' não encontrado no banco.");
    return;
  }

  console.log("Usuário encontrado:");
  console.log("  Nome:", usuario.nome);
  console.log("  Login:", usuario.login);
  console.log("  Papel:", usuario.papel);
  console.log("  Ativo:", usuario.ativo);
  console.log("  SenhaHash:", usuario.senhaHash ? usuario.senhaHash.substring(0, 40) + "..." : "NENHUM");

  const match = await bcrypt.compare("araujo123", usuario.senhaHash);
  console.log("Senha 'araujo123' está correta?", match);
}

main().catch((e) => console.error("Erro:", e.message)).finally(async () => {
  await db.$disconnect();
});
