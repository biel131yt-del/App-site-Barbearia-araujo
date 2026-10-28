"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Trash2, RefreshCw, Phone } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FundoBarbearia } from "@/components/marca";
import { formatarDataBR } from "@/lib/agendamento";
import { apenasDigitos, telefoneValido } from "@/lib/agendamento";

type AgendamentoUI = {
  id: string;
  dataISO: string;
  hora: string;
  servico: { nome: string };
  cliente: { nome: string; telefone: string };
  status: string;
  pagamento: string;
  confirmadoWhatsApp: boolean;
  tokenAcesso: string | null;
};

export default function CancelarPage() {
  const [telefone, setTelefone] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [agendamentos, setAgendamentos] = useState<AgendamentoUI[]>([]);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [remarcarId, setRemarcarId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");

  useEffect(() => {
    const salvo = localStorage.getItem("barbearia_telefone");
    if (salvo) setTelefone(salvo);
  }, []);

  async function buscarAgendamentos() {
    const digitos = apenasDigitos(telefone);
    if (!telefoneValido(telefone)) {
      return setErro("Digite um WhatsApp válido com DDD.");
    }
    setCarregando(true);
    setErro("");
    setMsg("");
    try {
      const r = await fetch(`/api/agendamentos/minhos?telefone=${encodeURIComponent(digitos)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.erro ?? "Falha ao buscar agendamentos");
      setAgendamentos(j.agendamentos ?? []);
      if (lembrar) localStorage.setItem("barbearia_telefone", telefone);
      if (j.agendamentos?.length === 0) {
        setMsg("Nenhum agendamento ativo encontrado para este WhatsApp.");
      }
    } catch {
      setErro("Falha ao buscar agendamentos. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function cancelarAgendamento(tokenAcesso: string) {
    setCancelando(tokenAcesso);
    try {
      const r = await fetch("/api/agendamentos/cancelar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAcesso, motivo: "Solicitado pelo cliente" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.erro ?? "Falha ao cancelar");
      setMsg("Agendamento cancelado com sucesso.");
      await buscarAgendamentos();
    } catch {
      setErro("Falha ao cancelar. Tente novamente.");
    } finally {
      setCancelando(null);
    }
  }

  async function remarcarAgendamento(tokenAcesso: string) {
    if (!novaData || !novaHora) return setErro("Informe a nova data e horário.");
    setCancelando(tokenAcesso);
    try {
      const r = await fetch("/api/agendamentos/remarcar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAcesso, novaData, novaHora }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.erro ?? "Falha ao remarcar");
      setMsg("Agendamento remarcado com sucesso.");
      setRemarcarId(null);
      setNovaData("");
      setNovaHora("");
      await buscarAgendamentos();
    } catch {
      setErro("Falha ao remarcar. O novo horário pode estar ocupado.");
    } finally {
      setCancelando(null);
    }
  }

  async function confirmarWhatsApp(tokenAcesso: string) {
    setCancelando(tokenAcesso);
    try {
      const r = await fetch("/api/agendamentos/confirmar-whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenAcesso }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.erro ?? "Falha ao confirmar");
      setMsg("Confirmado via WhatsApp! O barbeiro foi notificado.");
      await buscarAgendamentos();
    } catch {
      setErro("Falha ao confirmar. Tente novamente.");
    } finally {
      setCancelando(null);
    }
  }

  return (
    <FundoBarbearia className="pb-28 md:pb-10">
      <Header />

      <main className="container-mobile mt-4 md:mt-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 mb-4">
          <ChevronLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h1 className="font-display text-3xl tracking-wide text-white">CANCELAR OU REMARCAR</h1>
          <p className="mt-1 text-sm text-slate-400">
            Informe seu WhatsApp para ver seus agendamentos ativos.
          </p>

          <div className="mt-5 grid gap-3">
            <Input
              rotulo="Seu WhatsApp"
              placeholder="(51) 99682-4286"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                className="rounded border-white/10 bg-white/5 focus:border-accent"
              />
              <label className="cursor-pointer select-none">Lembrar WhatsApp neste navegador</label>
            </div>
            <Button
              variant="accent"
              onClick={buscarAgendamentos}
              disabled={carregando || !telefoneValido(telefone)}
              className="w-full press"
            >
              {carregando ? "Buscando…" : "Ver meus agendamentos"}
            </Button>
          </div>

          {erro && (
            <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
              {erro}
            </p>
          )}

          {msg && (
            <p className="mt-3 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">
              {msg}
            </p>
          )}

          {agendamentos.length > 0 && (
            <div className="mt-5 space-y-3">
              <h2 className="font-bold text-white">Seus agendamentos ativos</h2>
              {agendamentos.map((ag) => (
                <div
                  key={ag.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <p className="font-bold text-white">{ag.servico.nome}</p>
                    <p className="text-xs text-slate-400">
                      {formatarDataBR(ag.dataISO)} às {ag.hora} • {ag.cliente.nome}
                    </p>
                    {!ag.confirmadoWhatsApp && (
                      <p className="mt-1 text-xs text-yellow-300/80">
                        ⚠️ Ainda não confirmado via WhatsApp
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!ag.confirmadoWhatsApp && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmarWhatsApp(ag.tokenAcesso!)}
                        disabled={cancelando === ag.id}
                        className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                      >
                        <Phone className="h-4 w-4" /> Confirmar WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemarcarId(ag.id)}
                      disabled={cancelando === ag.id}
                    >
                      <RefreshCw className="h-4 w-4" /> Remarcar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelarAgendamento(ag.tokenAcesso!)}
                      disabled={cancelando === ag.id}
                      className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" /> Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de remarcar */}
          {remarcarId && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-bold text-white mb-3">Remarcar agendamento</h2>
              <div className="grid gap-3">
                <Input
                  rotulo="Nova data"
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                />
                <Input
                  rotulo="Novo horário"
                  type="time"
                  value={novaHora}
                  onChange={(e) => setNovaHora(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    onClick={() => {
                      const ag = agendamentos.find((a) => a.id === remarcarId);
                      if (ag && ag.tokenAcesso) remarcarAgendamento(ag.tokenAcesso, ag.dataISO, ag.hora);
                    }}
                    disabled={cancelando === remarcarId || !novaData || !novaHora}
                    className="w-full press"
                  >
                    {cancelando === remarcarId ? "Remarcando…" : "Confirmar nova data"}
                  </Button>
                  <Button variant="ghost" onClick={() => setRemarcarId(null)} className="w-full">
                    Cancelar edição
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500 text-center">
            Não encontrou seu agendamento? Chame a gente diretamente pelo WhatsApp.
          </p>
          <a
            href={`https://wa.me/${"555196824286"}?text=${encodeURIComponent("Fala! Preciso cancelar ou remarcar meu agendamento.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-500 px-5 font-bold text-white"
          >
            <Phone className="h-5 w-5" /> Falar no WhatsApp
          </a>
        </section>
      </main>
    </FundoBarbearia>
  );
}
