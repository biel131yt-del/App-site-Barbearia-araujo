import { NextResponse } from "next/server";
import { googleConectado, googleConfigurado } from "@/lib/google";

// GET /api/google/status — painel consulta se já conectou (sem expor o token)
export async function GET() {
  try {
    const conta = await googleConectado();
    return NextResponse.json({
      configurado: googleConfigurado(),
      conectado: !!conta,
      email: conta?.email ?? null,
    });
  } catch {
    return NextResponse.json({ configurado: false, conectado: false, email: null });
  }
}
