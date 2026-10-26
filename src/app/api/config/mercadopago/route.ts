import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pixConfigurado } from "@/lib/pagamento";

// GET /api/config/mercadopago — verifica se o Mercado Pago está configurado (não expõe o token)
// Requer login de super_admin
export async function GET() {
  const sess = await getServerSession(authOptions);
  const papel = (sess?.user as { papel?: string } | undefined)?.papel;
  if (papel !== "super_admin")
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  return NextResponse.json({
    configurado: pixConfigurado(),
    mensagem: pixConfigurado()
      ? "Credenciais do Mercado Pago estão configuradas no servidor."
      : "Mercado Pago não configurado. PIX indisponível até que o dono adicione MERCADOPAGO_ACCESS_TOKEN nas Environment Variables do Vercel.",
  });
}
