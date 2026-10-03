"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarPreco } from "@/lib/dados-mock";
import { cn } from "@/lib/utils";

// Serviços — CRUD completo (só dono). Desative em vez de excluir com histórico.
type Serv = { id: string; nome: string; precoCentavos: number; duracaoMin: number; descricao: string; fotoUrl: string | null; faixa: string; ativo: boolean };

export default function AdminServicos() {
  const [lista, setLista] = useState<Serv[]>([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("40");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState("");
  const [faixa, setFaixa] = useState("adulto");
  const [editando, setEditando] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    const r = await fetch("/api/servicos?todos=1");
    if (r.ok) setLista(await r.json());
  }
  useEffect(() => {
    carregar();
  }, []);

  function limpar() {
    setNome("");
    setPreco("");
    setDuracao("40");
    setDescricao("");
    setFoto("");
    setFaixa("adulto");
    setEditando(null);
  }

  async function salvar() {
    setErro("");
    setMsg("");
    const corpo = {
      id: editando ?? undefined,
      nome,
      precoReais: Number(preco.replace(",", ".")),
      duracaoMin: Number(duracao),
      descricao,
      fotoUrl: foto,
      faixa,
    };
    const r = await fetch("/api/servicos", {
      method: editando ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const j = await r.json();
    if (!r.ok) return setErro(j?.erro ?? "Falha ao salvar.");
    setMsg(editando ? "Serviço atualizado." : "Serviço criado.");
    limpar();
    carregar();
  }

  function editar(s: Serv) {
    setEditando(s.id);
    setNome(s.nome);
    setPreco(String(s.precoCentavos / 100).replace(".", ","));
    setDuracao(String(s.duracaoMin));
    setDescricao(s.descricao);
    setFoto(s.fotoUrl ?? "");
    setFaixa(s.faixa ?? "adulto");
  }

  async function alternar(s: Serv) {
    await fetch("/api/servicos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, ativo: !s.ativo }),
    });
    carregar();
  }

  async function excluir(s: Serv) {
    if (!window.confirm(`Excluir "${s.nome}"? Se tiver histórico, desative em vez disso.`)) return;
    const r = await fetch(`/api/servicos?id=${s.id}`, { method: "DELETE" });
    const j = await r.json().catch(() => null);
    if (!r.ok) return setErro(j?.erro ?? "Falha ao excluir.");
    carregar();
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">SERVIÇOS</h1>
      <p className="text-sm text-slate-400">Nome, preço, duração e foto</p>
      {msg && <p className="mt-3 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">{msg}</p>}
      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          {erro}
        </p>
      )}

      <ul className="mt-4 grid gap-2.5">
        {lista.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">
                {s.nome} {!s.ativo && <span className="text-slate-500">(oculto)</span>}
              </span>
              <span className="text-xs text-slate-400">
                {formatarPreco(s.precoCentavos / 100)} • {s.duracaoMin} min
              </span>
            </span>
            <button onClick={() => editar(s)} aria-label={`Editar ${s.nome}`} className="flex h-12 w-12 items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
              <Pencil className="h-5 w-5" />
            </button>
            <button onClick={() => alternar(s)} aria-label="Ativar/desativar" title="Ativar/desativar" className="flex h-12 items-center rounded-full px-3 text-xs font-bold text-slate-300 hover:bg-white/10">
              {s.ativo ? "Ocultar" : "Mostrar"}
            </button>
            <button onClick={() => excluir(s)} aria-label={`Excluir ${s.nome}`} className="flex h-12 w-12 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10">
              <Trash2 className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <Plus className="h-5 w-5" /> {editando ? "Editar serviço" : "Novo serviço"}
        </h2>
        <div className="mt-3 grid gap-3">
          <Input rotulo="Nome" name="sv-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Corte infantil" />
          <div className="grid grid-cols-2 gap-3">
            <Input rotulo="Preço (R$)" name="sv-preco" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="35" />
            <Input rotulo="Duração (min)" name="sv-dur" inputMode="numeric" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
          </div>
          <Input rotulo="Descrição" name="sv-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <Input rotulo="Foto (URL, opcional)" name="sv-foto" value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://…" />
          <div>
            <span className="mb-1.5 block text-sm font-bold text-slate-200">Público</span>
            <div className="flex gap-2" role="group" aria-label="Público do serviço">
              {(["adulto", "infantil"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFaixa(f)}
                  aria-pressed={faixa === f}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border-2 text-sm font-bold capitalize",
                    faixa === f ? "border-accent bg-accent/20 text-white" : "border-white/10 text-slate-400"
                  )}
                >
                  {f === "adulto" ? "Adulto" : "Infantil 🧒"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={salvar} className="flex-1">
              <Tags /> Salvar
            </Button>
            {editando && (
              <Button variant="ghost" onClick={limpar}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
