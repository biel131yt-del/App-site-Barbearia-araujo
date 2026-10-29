import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const login = "dono";
  const senha = "araujo123";

  // Verifica se já existe
  const existente = await db.usuario.findUnique({ where: { login } });
  
  if (existente) {
    console.log(`✅ Usuário '${login}' já existe no banco de produção.`);
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

  console.log(`✅ Usuário criado com sucesso:`);
  console.log(`   Login: ${usuario.login}`);
  console.log(`   Nome: ${usuario.nome}`);
  console.log(`   Papel: ${usuario.papel}`);
  console.log(`   Ativo: ${usuario.ativo}`);
}

main().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
