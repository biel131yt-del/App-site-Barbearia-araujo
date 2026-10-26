"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

// Botão "Ativar notificações" — dono clica 1x por aparelho.
// Registra o SW de push (escopo /push/) e salva a inscrição no servidor.
export function BotaoPush() {
  const [estado, setEstado] = useState<"verificando" | "ativo" | "inativo" | "sem-suporte">("verificando");
  const [erro, setErro] = useState("");
  const [teste, setTeste] = useState("");

  async function verificar() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("sem-suporte");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration("/push/");
      const sub = await reg?.pushManager.getSubscription();
      setEstado(sub ? "ativo" : "inativo");
    } catch {
      setEstado("inativo");
    }
  }

  useEffect(() => {
    verificar();
  }, []);

  async function ativar() {
    setErro("");
    try {
      const r = await fetch("/api/push/public-key");
      const { publicKey } = await r.json();
      if (!publicKey) throw new Error("Push não configurado no servidor.");
      const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/push/" });
      // No celular o worker demora a ativar — espera até 10s antes de assinar
      let tentativas = 0;
      while (!reg.active && tentativas < 20) {
        await new Promise((ok) => setTimeout(ok, 500));
        tentativas++;
      }
      if (!reg.active)
        throw new Error("Não ativou. Recarregue a página e tente de novo.");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      const { endpoint, keys } = sub.toJSON();
      const ok = await fetch("/api/push/subscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, keys }),
      });
      if (!ok.ok) throw new Error("Falha ao salvar no servidor.");
      setEstado("ativo");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ativar.");
    }
  }

  async function desativar() {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/push/");
      const sub = await reg?.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      await sub?.unsubscribe();
      if (endpoint) {
        await fetch("/api/push/subscrever", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setEstado("inativo");
    } catch {
      setEstado("inativo");
    }
  }

  if (estado === "verificando") return <p className="mt-2 text-sm text-slate-400">Verificando…</p>;
  if (estado === "sem-suporte") {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isIOS = ios || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);
    const iosVersion = isIOS
      ? (navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)? like Mac OS X/) ?? [])?.[1]
      : null;
    const iosOk = iosVersion ? Number(iosVersion) >= 16 : false;

    return (
      <div className="mt-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-relaxed">
        <p className="font-bold text-amber-300 mb-3">
          📱 Notificações no iPhone
        </p>

        {isIOS && !iosOk ? (
          <>
            <p className="text-amber-100 mb-2">
              Seu iOS ({iosVersion}) é antigo. Web Push exige <strong>iOS 16.4 ou mais novo</strong>.
            </p>
            <p className="text-xs text-amber-200 mb-3">
              Atualize o iPhone em Ajustes → Geral → Atualização de Software.
            </p>
          </>
        ) : null}

        <p className="text-amber-100 mb-3">
          Para receber notificações no iPhone, siga estes passos:
        </p>

        <ol className="list-decimal list-inside text-amber-100 mb-3 space-y-1">
          <li className="text-xs">
            Abra o site no <strong>Safari</strong> (não no WhatsApp, Instagram, Facebook ou Chrome).
          </li>
          <li className="text-xs">
            Toque em <strong>Compartilhar → Adicionar à Tela de Início</strong>.
          </li>
          <li className="text-xs">
            Abra o <strong>ícone do app</strong> que apareceu na tela inicial.
          </li>
          <li className="text-xs">
            Volte nesta tela e toque em <strong>"Ativar notificações"</strong> abaixo.
          </li>
        </ol>

        <p className="text-xs text-amber-200 italic">
          Após instalar como PWA, as notificações chegam mesmo com o app fechado.
        </p>
      </div>
    );
  }

  async function enviarTeste() {
    setTeste("");
    try {
      const r = await fetch("/api/push/testar", { method: "POST" });
      const j = await r.json();
      setTeste(r.ok ? `Teste enviado para ${j.enviadas} aparelho(s). Chegou aí?` : "Falha ao enviar.");
    } catch {
      setTeste("Falha ao enviar.");
    }
  }

  return (
    <div>
      {estado === "ativo" ? (
        <>
          <Button variant="outline" size="sm" onClick={desativar} className="mt-3">
            <BellOff /> Desativar neste aparelho
          </Button>
          <Button variant="ghost" size="sm" onClick={enviarTeste} className="mt-3">
            <Send /> Enviar teste
          </Button>
          {teste && <p className="mt-2 text-xs font-bold text-green-300">{teste}</p>}
        </>
      ) : (
        <Button size="sm" onClick={ativar} className="mt-3">
          <Bell /> Ativar notificações
        </Button>
      )}
      {erro && <p className="mt-2 text-xs font-semibold text-accent">{erro}</p>}
    </div>
  );
}
