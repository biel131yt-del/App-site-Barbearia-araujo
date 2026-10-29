import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = "dono";
  const senha = "araujo123";

  // Verifica se já existe
  const existente = await db.usuario.findUnique({ where: { login: email } });

  if (existente) {
    console.log(`Usuário '${email}' já existe.`);
    return;
  }

  // Cria o usuário
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

  console.log(`Usuário criado com sucesso:`, usuario.nome);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
