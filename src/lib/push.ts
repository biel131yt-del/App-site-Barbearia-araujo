// Web Push para o dono — FASE 6
// Quando alguém agenda, o celular do dono toca mesmo com o app fechado
// (desde que ele tenha clicado "Ativar notificações" 1x em Ajustes).

import webpush from "web-push";
import { db } from "./db";

function vapid() {
  const publicKey = process.env.NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY ?? "";
  return { publicKey, privateKey };
}

export function pushConfigurado() {
  const { publicKey, privateKey } = vapid();
  return publicKey.length > 0 && privateKey.length > 0;
}

// Envia para TODOS os aparelhos inscritos. Best-effort: limpa inscrições mortas (410/404).
export async function notificarDono(titulo: string, corpo: string, url = "/admin") {
  if (!pushConfigurado()) return 0;
  const { publicKey, privateKey } = vapid();
  webpush.setVapidDetails("mailto:contato@barbearia-araujo.local", publicKey, privateKey);

  const inscricoes = await db.pushInscricao.findMany().catch(() => []);
  if (inscricoes.length === 0) return 0;

  const payload = JSON.stringify({ titulo, corpo, url });
  let enviadas = 0;
  for (const ins of inscricoes) {
    try {
      await webpush.sendNotification(
        { endpoint: ins.endpoint, keys: { p256dh: ins.p256dh, auth: ins.auth } },
        payload
      );
      enviadas++;
    } catch (e: unknown) {
      // Inscrição expirada/cancelada → remove para não tentar de novo
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await db.pushInscricao.delete({ where: { endpoint: ins.endpoint } }).catch(() => null);
      } else {
        console.warn("[push] falha ao enviar", (e as Error)?.message);
      }
    }
  }
  return enviadas;
}
