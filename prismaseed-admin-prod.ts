import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const login = "dono";
  const senha = "araujo123";

  const existente = await db.usuario.findUnique({ where: { login } });

  if (existente) {
    console.log("✅ Usuário 'dono' já existe no banco.");
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await db.usuario.create({
    data: {
      nome: "Dono",
      login: "dono",
      senhaHash,
      papel: "super_admin",
      ativo: true,
    },
  });

  console.log("✅ Usuário criado com sucesso!");
  console.log("   Login: " + usuario.login);
  console.log("   Senha: araujo123");
}

main().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});