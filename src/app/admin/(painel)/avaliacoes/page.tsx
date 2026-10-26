"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import { formatarDataBR } from "@/lib/agendamento";
import { formatarReais } from "@/lib/admin";
import { cn } from "@/lib/utils";

type Avaliacao = {
  id: string;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  agendamento: {
    id: string;
    dataISO: string;
    hora: string;
    cliente: { nome: string; telefone: string };
    servico: { nome: string; precoCentavos: number };
  };
};

export default function AdminAvaliacoes() {
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      const r = await fetch("/api/avaliacoes?todos=1", { cache: "no-store" });
      if (r.ok) {
        setLista(await r.json());
      } else {
        setErro("Falha ao carregar avaliações.");
      }
    } catch {
      setErro("Falha ao carregar avaliações.");
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const notaMedia =
    lista.length > 0
      ? Math.round((lista.reduce((s, a) => s + a.nota, 0) / lista.length) * 10) / 10
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide text-white">AVALIAÇÕES</h1>
          <p className="text-sm text-slate-400">
            Depoimentos e notas dos clientes após o atendimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Média</span>
          <span className="flex items-center gap-1 text-lg font-bold text-white">
            {lista.length > 0 ? notaMedia.toFixed(1) : "—"}
            <span className="text-sm">/ 5</span>
          </span>
          <div className="flex items-center gap-0.5 text-amber-400">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn("h-4 w-4", n <= Math.floor(notaMedia) ? "fill-yellow-400" : "text-slate-500")}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400">{lista.length} avaliação(es)</span>
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          {erro}
        </p>
      )}

      <ul className="mt-4 grid gap-2.5">
        {lista.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">
                {a.agendamento.cliente.nome}
              </span>
              <span className="text-xs text-slate-400">
                {a.agendamento.servico.nome} •
                {formatarReais(a.agendamento.servico.precoCentavos)} •
                {formatarDataBR(a.agendamento.dataISO)} às {a.agendamento.hora}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-400 text-sm">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn("h-4 w-4", n <= a.nota ? "fill-yellow-400" : "text-slate-500")}
                  />
                ))}
                <span className="ml-1 text-xs font-bold text-white">{a.nota}</span>
              </div>
              {a.comentario && (
                <span className="hidden md:block text-xs text-slate-300 truncate max-w-xs" title={a.comentario}>
                  “{a.comentario}”
                </span>
              )}
            </div>
          </li>
        ))}
        {lista.length === 0 && (
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Nenhuma avaliação ainda. As avaliações aparecem aqui após o cliente avaliar um corte concluído.
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
