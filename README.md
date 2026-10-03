# Barbearia Araujo — sistema de agendamento + gestão (PWA mobile-first)

## Rodar local (grátis, sem conta em nada)

```bash
npm install
npx prisma migrate dev   # cria o banco SQLite local
npm run db:seed          # serviços + 14 dias + usuário dono/araujo123
npm run dev              # http://localhost:3000
```

- Cliente: `/` → **Agendar Agora** → `/agendar` (5 etapas + PIX)
- Dono: `/admin` (login `dono` / `araujo123` — **troque a senha depois**)
- Atalhos: `npm run db:studio` (ver banco), `node scripts/gerar-icones.mjs` (ícones PWA)

## Ativar integrações (1x cada, quando quiser)

| Fase | Onde | O que preencher no `.env` |
|---|---|---|
| 5 Google Agenda | [Console Google Cloud](https://console.cloud.google.com) → Calendar API + OAuth (redirect `/api/google/callback`) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| 6 Push | `npx web-push generate-vapid-keys` | `NEXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY` |
| 6 E-mail | [Resend](https://resend.com) | `RESEND_API_KEY`, `EMAIL_DONO` |
| 7 PIX | [Mercado Pago](https://www.mercadopago.com.br/developers) → credenciais + webhook `/api/pagamentos/webhook` | `MERCADOPAGO_ACCESS_TOKEN` |

Sem chave, cada integração desliga sozinha com elegância (nada quebra).

## Deploy (quando chegar a hora)

- **Banco:** trocar `provider` p/ `postgresql` + `DATABASE_URL` do Supabase/Neon (SQLite não persiste na Vercel).
- **Segredos:** gerar `NEXTAUTH_SECRET` novo, VAPID novo, atualizar `NEXTAUTH_URL` e redirect do Google.
- **Fases:** 1 Home ✅ 2 Agendamento ✅ 3 Banco ✅ 4 Admin ✅ 5 Google ✅ 6 Push/WhatsApp ✅ 7 PIX ✅ 8 PWA ✅ 9 Caixa/Auth ✅ 10 Polish ✅
