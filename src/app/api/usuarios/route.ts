import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Só o dono lista/cria equipe — FASE extra
async function exigirDono() {
  const sess = await getServerSession(authOptions);
  const papel = (sess?.user as { papel?: string } | undefined)?.papel;
  return papel === "super_admin" ? sess : null;
}

export async function GET() {
  if (!(await exigirDono())) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  const usuarios = await db.usuario.findMany({
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, login: true, papel: true, ativo: true, expiraEm: true },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  if (!(await exigirDono())) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  try {
    const { nome, login, senha, papel, diasTemporario } = await req.json();
    const lg = (login ?? "").trim().toLowerCase();
    if (!nome?.trim() || !lg || !senha || senha.length < 4)
      return NextResponse.json({ erro: "Nome, login e senha (4+ letras) são obrigatórios" }, { status: 400 });
    if (!["super_admin", "admin", "barbeiro"].includes(papel))
      return NextResponse.json({ erro: "Papel inválido" }, { status: 400 });
    // Acesso temporário: expira em N dias (ex: amigo testando)
    const dias = Number(diasTemporario);
    const expiraEm =
      Number.isInteger(dias) && dias > 0 && dias <= 90
        ? new Date(Date.now() + dias * 86400000)
        : null;
    const senhaHash = await bcrypt.hash(senha, 10);
    const u = await db.usuario.create({
      data: { nome: nome.trim(), login: lg, senhaHash, papel, expiraEm },
      select: { id: true, nome: true, login: true, papel: true, ativo: true, expiraEm: true },
    });
    return NextResponse.json(u, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002")
      return NextResponse.json({ erro: "Login já existe" }, { status: 409 });
    console.error("[usuarios POST]", e);
    return NextResponse.json({ erro: "Falha ao criar usuário" }, { status: 500 });
  }
}
