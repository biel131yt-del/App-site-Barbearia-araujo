"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROTULOS_PAPEL, type Papel } from "@/lib/permissoes";

// Equipe — só o dono vê (API + middleware barram o resto).
export default function AdminEquipe() {
  const [usuarios, setUsuarios] = useState<
    { id: string; nome: string; login: string; papel: string; ativo: boolean; expiraEm: string | null }[]
  >([]);
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("barbeiro");
  const [diasTemp, setDiasTemp] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    const r = await fetch("/api/usuarios");
    if (r.ok) setUsuarios(await r.json());
    else setErro("Sem permissão (só dono).");
  }
  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    setErro("");
    setMsg("");
    const r = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, login, senha, papel, diasTemporario: Number(diasTemp) || undefined }),
    });
    const j = await r.json();
    if (!r.ok) return setErro(j?.erro ?? "Falha ao adicionar.");
    setMsg(`${j.nome} adicionado.`);
    setNome("");
    setLogin("");
    setSenha("");
    setDiasTemp("");
    carregar();
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">EQUIPE</h1>
      <p className="text-sm text-slate-400">Quem pode entrar no painel e o que pode ver</p>
      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          {erro}
        </p>
      )}
      {msg && <p className="mt-3 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">{msg}</p>}

      <ul className="mt-4 grid gap-2">
        {usuarios.map((u) => (
          <li key={u.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
            <span>
              <span className="block text-sm font-bold text-white">{u.nome}</span>
              <span className="text-xs text-slate-400">
                {u.login} • {(ROTULOS_PAPEL as Record<string, string>)[u.papel] ?? u.papel}
                {u.expiraEm
                  ? ` • até ${new Date(u.expiraEm).toLocaleDateString("pt-BR")}`
                  : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <UserPlus className="h-5 w-5" /> Adicionar pessoa
        </h2>
        <div className="mt-3 grid gap-3">
          <Input rotulo="Nome" name="eq-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input rotulo="Login" name="eq-login" value={login} onChange={(e) => setLogin(e.target.value)} />
          <Input rotulo="Senha" name="eq-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <Input
            rotulo="Acesso temporário (dias, vazio = permanente)"
            name="eq-dias"
            inputMode="numeric"
            value={diasTemp}
            onChange={(e) => setDiasTemp(e.target.value.replace(/\D/g, ""))}
            placeholder="Ex: 7"
          />
          <div>
            <label htmlFor="eq-papel" className="mb-1.5 block text-sm font-bold text-slate-200">
              Permissão
            </label>
            <select
              id="eq-papel"
              value={papel}
              onChange={(e) => setPapel(e.target.value as Papel)}
              className="h-14 w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 text-base text-white"
            >
              <option value="super_admin">Dono — acesso total</option>
              <option value="admin">Equipe — dashboard, agenda, clientes, caixa</option>
              <option value="barbeiro">Barbeiro — só agenda e clientes</option>
            </select>
          </div>
          <Button onClick={adicionar}>Adicionar</Button>
        </div>
      </section>
    </div>
  );
}
