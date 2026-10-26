"use client";

import { Suspense, useEffect, useState } from "react";
import { CalendarCheck, Gift, Camera, MessageCircle, BellRing, Tags } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BotaoPush } from "@/components/BotaoPush";
import { WHATSAPP_DONO } from "@/lib/config";
import { cn } from "@/lib/utils";

// Ajustes do dono — fidelidade, Google, push, WhatsApp, Instagram.
export default function AdminConfig() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

function Conteudo() {
  const params = useSearchParams();
  const [status, setStatus] = useState<{ configurado: boolean; conectado: boolean; email: string | null }>({
    configurado: false,
    conectado: false,
    email: null,
  });
  const [fid, setFid] = useState({ fidelidadeAtiva: true, cortesParaGratis: 10, instagramUrl: "", mensagemWhats: "" });
  const [msgFid, setMsgFid] = useState("");
  const [carregandoMP, setCarregandoMP] = useState(false);
  const [mpConfigurado, setMpConfigurado] = useState(false);

  useEffect(() => {
    fetch("/api/google/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
    fetch("/api/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setFid({ fidelidadeAtiva: j.fidelidadeAtiva, cortesParaGratis: j.cortesParaGratis, instagramUrl: j.instagramUrl ?? "", mensagemWhats: j.mensagemWhats ?? "" }))
      .catch(() => null);
    verificarMercadoPago();
  }, []);

  async function salvarFid(manual?: { fidelidadeAtiva: boolean; cortesParaGratis: number; instagramUrl: string; mensagemWhats: string }) {
    const corpo = manual ?? fid;
    const r = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    setMsgFid(r.ok ? "Salvo!" : "Sem permissão (só dono).");
    setTimeout(() => setMsgFid(""), 2500);
  }

  async function verificarMercadoPago() {
    setCarregandoMP(true);
    try {
      const r = await fetch("/api/config/mercadopago", { cache: "no-store" });
      const j = await r.json();
      setMpConfigurado(j.configurado ?? false);
    } catch {
      setMpConfigurado(false);
    } finally {
      setCarregandoMP(false);
    }
  }

  const retorno = params.get("google");

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">AJUSTES</h1>
      <p className="text-sm text-slate-400">Fidelidade, agenda, notificações e links</p>

      {retorno === "ok" && (
        <p className="mt-3 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">
          Google Agenda conectada! Novos agendamentos criam evento automaticamente.
        </p>
      )}
      {retorno === "erro" && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          Não foi possível conectar. Tente de novo.
        </p>
      )}

      {/* Fidelidade */}
      <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <Gift className="h-5 w-5" /> Programa de fidelidade
        </h2>
        <button
          onClick={() => {
            const proximo = { ...fid, fidelidadeAtiva: !fid.fidelidadeAtiva };
            setFid(proximo);
            salvarFid(proximo); // salva na hora — sem botão
          }}
          aria-pressed={fid.fidelidadeAtiva}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
        >
          <span className="text-sm font-bold text-white">Mostrar para clientes</span>
          <span
            className={cn(
              "flex h-8 w-14 items-center rounded-full p-1 transition-colors",
              fid.fidelidadeAtiva ? "justify-end bg-green-500" : "justify-start bg-slate-600"
            )}
          >
            <span className="h-6 w-6 rounded-full bg-white" />
          </span>
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cfg-meta" className="mb-1.5 block text-sm font-bold text-slate-200">
              Corte {fid.cortesParaGratis} vezes para ganhar 1 corte grátis
            </label>
            <input
              id="cfg-meta"
              type="number"
              min={2}
              max={30}
              value={fid.cortesParaGratis}
              onChange={(e) => setFid({ ...fid, cortesParaGratis: Number(e.target.value) })}
              className="h-14 w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 text-base text-white"
            />
          </div>
          <div>
            <label htmlFor="cfg-insta" className="mb-1.5 block text-sm font-bold text-slate-200">
              Instagram
            </label>
            <input
              id="cfg-insta"
              value={fid.instagramUrl}
              onChange={(e) => setFid({ ...fid, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/…"
              className="h-14 w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        <Button size="sm" onClick={() => salvarFid()} className="mt-3">
          Salvar fidelidade
        </Button>
        {msgFid && <p className="mt-2 text-xs font-bold text-green-300">{msgFid}</p>}
        <p className="mt-2 text-xs text-slate-500">
          OFF = cliente vê só “Último corte”. ON = vê a contagem (meta acima).
        </p>
      </section>

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <CalendarCheck className="h-5 w-5" /> Google Agenda
        </h2>
        {!status.configurado ? (
          <p className="mt-2 text-sm text-slate-400">
            Falta configurar no servidor: <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> no{" "}
            <code>.env</code>.
          </p>
        ) : status.conectado ? (
          <>
            <p className="mt-2 text-sm text-green-300">
              ✅ Conectado{status.email ? ` como ${status.email}` : ""}. Cada agendamento cria evento com lembrete 30
              min antes.
            </p>
            <a href="/api/google/conectar">
              <Button variant="outline" size="sm" className="mt-3 border-white/20 text-white">
                Reconectar outra conta
              </Button>
            </a>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-400">Conecte uma vez — cada agendamento vira evento automático.</p>
            <a href="/api/google/conectar">
              <Button className="mt-3">Conectar minha agenda</Button>
            </a>
          </>
        )}
      </section>

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <BellRing className="h-5 w-5" /> Notificações push
        </h2>
        <p className="mt-2 text-sm text-slate-400">Ative neste aparelho — cada agendamento toca aqui com o app fechado.</p>
        <BotaoPush />
      </section>

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <MessageCircle className="h-5 w-5" /> WhatsApp
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          WhatsApp normal ({WHATSAPP_DONO}), sem custo. O texto abaixo abre pronto ao tocar no botão
          verde de qualquer cliente — use p/ conversar ou marketing. Variáveis:{" "}
          <code className="text-slate-200">{"{nome} {servico} {data} {hora}"}</code>
        </p>
        <label htmlFor="cfg-msg" className="mb-1.5 mt-3 block text-sm font-bold text-slate-200">
          Mensagem pré-pronta
        </label>
        <textarea
          id="cfg-msg"
          rows={3}
          value={fid.mensagemWhats}
          onChange={(e) => setFid({ ...fid, mensagemWhats: e.target.value })}
          placeholder="Olá {nome}! Aqui é da Barbearia Araujo — confirmando seu {servico} em {data} às {hora}."
          className="w-full rounded-xl border-2 border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => salvarFid()}>
            Salvar mensagem
          </Button>
          <a
            href={`https://wa.me/${WHATSAPP_DONO}?text=${encodeURIComponent("Teste — Barbearia Araujo")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="border-green-500/50 text-green-300">
              Testar meu WhatsApp
            </Button>
          </a>
        </div>
      </section>

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <Camera className="h-5 w-5" /> Instagram
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Link exibido após o agendamento. Salve acima p/ ativar o botão “Compartilhar”.
        </p>
        <div className="mt-3">
          <Input
            rotulo="Perfil (URL completa)"
            name="cfg-insta2"
            value={fid.instagramUrl}
            onChange={(e) => setFid({ ...fid, instagramUrl: e.target.value })}
            placeholder="https://instagram.com/barbeariaaraujo"
          />
          <Button size="sm" onClick={() => salvarFid()} className="mt-2">
            Salvar Instagram
          </Button>
        </div>
      </section>

      {/* Mercado Pago / PIX */}
      <section className="mt-3 rounded-3xl border-2 border-dashed border-accent/40 bg-red-500/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <Tags className="h-5 w-5" /> Pagamentos e Mercado Pago (PIX)
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Configure as credenciais da sua conta Mercado Pago para ativar o PIX como forma de
          pagamento antecipado no site.
        </p>

        <div className="mt-3 space-y-3">
          <button
            onClick={verificarMercadoPago}
            disabled={carregandoMP}
            className="flex w-full items-center justify-between rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10"
          >
            <span className="text-sm font-bold text-white">
              Verificar configuração do Mercado Pago
            </span>
            <span className="text-xs text-slate-400">
              {carregandoMP ? "Verificando…" : mpConfigurado ? "Configurado ✓" : "Não configurado"}
            </span>
          </button>

          {mpConfigurado ? (
            <p className="mt-2 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">
              ✅ O Mercado Pago está configurado. O PIX estará disponível para os clientes.
            </p>
          ) : (
            <>
              <p className="mt-2 rounded-xl bg-yellow-500/15 p-3 text-sm font-semibold text-yellow-300">
                ⚠️ Mercado Pago não configurado. O PIX está indisponível para os clientes.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Para ativar, adicione a variável <code className="text-slate-200">MERCADOPAGO_ACCESS_TOKEN</code>
                nas Environment Variables do seu projeto na Vercel, com o token da sua conta Mercado Pago.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                O token não é salvo neste painel — ele fica apenas nas variáveis de ambiente do servidor,
                protegido e não exposto ao navegador.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}


