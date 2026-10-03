// E-mail de backup — FASE 6 (Resend)
// Só envia se RESEND_API_KEY + EMAIL_DONO estiverem no .env.
// Sem chave = desligado silenciosamente, resto do app funciona normal.

import { Resend } from "resend";

export function emailConfigurado() {
  return (process.env.RESEND_API_KEY ?? "").length > 0 && (process.env.EMAIL_DONO ?? "").length > 0;
}

export async function emailNovoAgendamento(info: {
  cliente: string;
  telefone: string;
  servico: string;
  dataISO: string;
  hora: string;
  pagamento: string;
}) {
  if (!emailConfigurado()) return null;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string);
    const { dataISO, hora } = info;
    const [a, m, d] = dataISO.split("-");
    const dataBR = a && m && d ? `${d}/${m}/${a}` : dataISO;
    const { data } = await resend.emails.send({
      from: "Barbearia Araujo <agendamentos@resend.dev>",
      to: [process.env.EMAIL_DONO as string],
      subject: `Novo agendamento: ${info.cliente} — ${info.dataISO} ${info.hora}`,
      text: [
        "Novo agendamento na Barbearia Araujo",
        "",
        `Cliente: ${info.cliente}`,
        `Telefone: ${info.telefone}`,
        `Serviço: ${info.servico}`,
        `Quando: ${dataBR} às ${hora}`,
        `Pagamento: ${info.pagamento === "pix" ? "PIX antecipado" : "No local"}`,
      ].join("\n"),
    });
    return data?.id ?? null;
  } catch (e) {
    console.warn("[email] não enviado", (e as Error)?.message);
    return null;
  }
}
