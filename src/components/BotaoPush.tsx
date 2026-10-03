"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Botão "Ativar notificações" — dono clica 1x por aparelho.
// Registra o SW de push (escopo /push/) e salva a inscrição no servidor.
export function BotaoPush() {
  const [estado, setEstado] = useState<"verificando" | "ativo" | "inativo" | "sem-suporte">("verificando");
  const [erro, setErro] = useState("");

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
  if (estado === "sem-suporte")
    return <p className="mt-2 text-sm text-slate-500">Este aparelho/navegador não suporta push.</p>;

  return (
    <div>
      {estado === "ativo" ? (
        <Button variant="outline" size="sm" onClick={desativar} className="mt-3">
          <BellOff /> Desativar neste aparelho
        </Button>
      ) : (
        <Button size="sm" onClick={ativar} className="mt-3">
          <Bell /> Ativar notificações
        </Button>
      )}
      {erro && <p className="mt-2 text-xs font-semibold text-accent">{erro}</p>}
    </div>
  );
}
