"use client";

import { useEffect, useState } from "react";
import { Check, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarDataBR } from "@/lib/agendamento";
import { cn } from "@/lib/utils";

type ListaEspera = {
  id: string;
  servicoId: string;
  dataISO: string;
  nome: string;
  telefone: string;
  horaPreferida: string | null;
  notificado: boolean;
  atendido: boolean;
  criadoEm: string;
  servico: { nome: string };
};

export default function AdminListaEspera() {
  const [lista, setLista] = useState<ListaEspera[]>([]);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [filtrarPendentes, setFiltrarPendentes] = useState(true);
  const [salvando, setSalvando] = useState<string[]>([]);

  const carregar = async () => {
    try {
      const r = await fetch(
        `/api/lista-espera?atendido=${filtrarPendentes ? "0" : "1"}`,
        { cache: "no-store" }
      );
      if (r.ok) {
        setLista(await r.json());
      } else {
        setErro("Falha ao carregar lista de espera.");
      }
    } catch {
      setErro("Falha ao carregar lista de espera.");
    }
  };

  useEffect(() => {
    carregar();
  }, [carregar, filtrarPendentes]);

  async function toggleAtendido(id: string, atual: boolean) {
    setSalvando([...salvando, id]);
    try {
      const r = await fetch(`/api/lista-espera/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atendido: !atual }),
      });
      if (!r.ok) throw new Error("Falha ao atualizar");
      setMsg(`Marcado como ${!atual ? "atendido" : "pendente"}.`);
      carregar();
    } catch {
      setErro("Falha ao atualizar. Tente novamente.");
    } finally {
      setSalvando(salvando.filter((x) => x !== id));
    }
  }

  async function toggleNotificado(id: string, atual: boolean) {
    setSalvando([...salvando, id]);
    try {
      const r = await fetch(`/api/lista-espera/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificado: !atual }),
      });
      if (!r.ok) throw new Error("Falha ao atualizar");
      setMsg(`Notificação ${!atual ? "enviada" : "não enviada"}.`);
      carregar();
    } catch {
      setErro("Falha ao atualizar. Tente novamente.");
    } finally {
      setSalvando(salvando.filter((x) => x !== id));
    }
  }

  const pendentes = lista.filter((a) => !a.atendido).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide text-white">LISTA DE ESPERA</h1>
          <p className="text-sm text-slate-400">
            Clientes que querem agendar quando abrir vaga
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Pendentes: {pendentes}</span>
          <button
            onClick={() => setFiltrarPendentes((v) => !v)}
            className={cn(
              "rounded-xl border px-3 py-1 text-xs font-bold transition-all",
              filtrarPendentes
                ? "border-accent bg-accent/20 text-white"
                : "border-white/10 text-slate-400"
            )}
          >
            {filtrarPendentes ? "Mostrar todos" : "Só pendentes"}
          </button>
        </div>
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

      <ul className="mt-4 grid gap-2.5">
        {lista.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{a.nome}</span>
              <span className="text-xs text-slate-400">
                {a.servico.nome} • {formatarDataBR(a.dataISO)} {a.horaPreferida ? `• prefere ${a.horaPreferida}` : ""}
                {a.telefone ? ` • ${a.telefone}` : ""}
              </span>
              <span className="mt-0.5 text-[10px] font-bold text-slate-400">
                Criado em: {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!a.atendido && (
                <Button
                  size="sm"
                  onClick={() => toggleAtendido(a.id, false)}
                  disabled={salvando.includes(a.id)}
                  className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                >
                  {salvando.includes(a.id) ? "" : <Check className="h-4 w-4" />}
                  {salvando.includes(a.id) ? "Marcando…" : "Atendido"}
                </Button>
              )}
              {!a.notificado && (
                <Button
                  size="sm"
                  onClick={() => toggleNotificado(a.id, false)}
                  disabled={salvando.includes(a.id)}
                  className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10"
                >
                  {salvando.includes(a.id) ? "" : <Clock className="h-4 w-4" />}
                  Notificar
                </Button>
              )}
              {a.atendido && (
                <span className="text-xs font-bold text-green-300">Atendido ✓</span>
              )}
            </div>
          </li>
        ))}
        {lista.length === 0 && (
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            {filtrarPendentes
              ? "Ninguém na lista de espera no momento."
              : "Nenhum registro na lista de espera."}
          </li>
        )}
      </ul>

      <button
        onClick={carregar}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4" /> Atualizar
      </button>
    </div>
  );
}
