// Config central da Barbearia Araujo — FASE 2 (atualização)
// TODO FASE 3+: mover segredos para .env / banco (tabela configuracoes).

export const EMPRESA = {
  nome: "Barbearia Araujo",
  tagline: "Corte • Barba • Estilo",
  endereco: "Manoel Olavo da Rosa, 1044",
} as const;

// Número do dono (WhatsApp NORMAL/pessoal — sem Business).
// Formato: DDI+DDD+número, só dígitos.
// Dono informou: +55 51 9682-4286 → 555196824286 (se faltar um 9, me avise).
export const WHATSAPP_DONO =
  process.env.NEXT_PUBLIC_WHATSAPP_DONO ?? "555196824286";

export const PAGAMENTO = {
  // TODO FASE 7: chave PIX real + token Mercado Pago (MERCADOPAGO_ACCESS_TOKEN)
  chavePix: "sua-chave-pix-aqui",
} as const;
