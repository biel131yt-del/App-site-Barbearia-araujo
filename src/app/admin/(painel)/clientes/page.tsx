"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/barber-icons";
import { linkWhatsAppCliente } from "@/lib/whatsapp";
import { useMensagemWhats } from "@/components/use-mensagem-whats";
import { formatarDataBR } from "@/lib/agendamento";

// Clientes — contagem de fidelidade, último corte, WhatsApp direto e reset manual.
export default function AdminClientes() {
  const [lista, setLista] = useState<
    { id: string; nome: string; telefone: string; total: number; ultimoServico: string | null; ultimoDataISO: string | null }[]
  >([]);
  const [erro, setErro] = useState("");

  async function carregar() {
    const r = await fetch("/api/clientes?todos=1");
    if (r.ok) setLista(await r.json());
    else setErro("Falha ao carregar clientes.");
  }
  useEffect(() => {
    carregar();
  }, []);

  async function resetar(telefone: string, nome: string) {
    if (!window.confirm(`Zerar a contagem de ${nome}? O histórico continua, só a fidelidade recomeça.`)) return;
    const r = await fetch("/api/clientes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone }),
    });
    if (r.ok) carregar();
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">CLIENTES ({lista.length})</h1>
      <p className="text-sm text-slate-400">Fidelidade, histórico e contato direto</p>
      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          {erro}
        </p>
      )}
      <ul className="mt-4 grid gap-2.5">
        {lista.map((c) => (
          <LinhaCliente
            key={c.id}
            c={c}
            onReset={() => resetar(c.telefone, c.nome)}
          />
        ))}
        {lista.length === 0 && (
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Nenhum cliente ainda — aparecem aqui após o primeiro agendamento.
          </li>
        )}
      </ul>
    </div>
  );
}

function LinhaCliente({
  c,
  onReset,
}: {
  c: { nome: string; telefone: string; total: number; ultimoServico: string | null; ultimoDataISO: string | null };
  onReset: () => void;
}) {
  const msg = useMensagemWhats({
    nome: c.nome,
    servico: c.ultimoServico ?? "",
    data: c.ultimoDataISO ? formatarDataBR(c.ultimoDataISO) : "",
    hora: "",
  });
  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
          {c.nome.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">{c.nome}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {c.total} corte(s)
            {c.ultimoServico ? ` • último: ${c.ultimoServico}` : ""}
          </span>
        </span>
        <a
          href={linkWhatsAppCliente(c.telefone, msg)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chamar ${c.nome}`}
        >
          <Button size="icon" className="bg-green-500 hover:bg-green-600" aria-label="WhatsApp">
            <WhatsAppIcon className="h-6 w-6" />
          </Button>
        </a>
        <button
          onClick={onReset}
          aria-label={`Zerar fidelidade de ${c.nome}`}
          title="Zerar fidelidade"
          className="flex h-12 w-12 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}
