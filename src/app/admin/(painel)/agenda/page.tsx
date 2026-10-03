"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Palmtree, Plus, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarDataLonga } from "@/lib/agendamento";
import { hojeISO } from "@/lib/admin";
import type { DiaAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

// Agenda do dono — abrir dia, fechar dia e modo férias.
// Ausência de registro = dia fechado (regra do negócio).
export default function AdminAgenda() {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth());
  const [dias, setDias] = useState<DiaAPI[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const [novaData, setNovaData] = useState("");
  const [inicio, setInicio] = useState("19:00");
  const [fim, setFim] = useState("22:00");
  const [feriasDe, setFeriasDe] = useState("");
  const [feriasAte, setFeriasAte] = useState("");

  const carregar = useCallback(async () => {
    const de = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const ultimo = new Date(ano, mes + 1, 0).getDate();
    const ate = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
    try {
      const r = await fetch(`/api/disponibilidade?de=${de}&ate=${ate}`, { cache: "no-store" });
      setDias(r.ok ? await r.json() : []);
    } catch {
      setDias([]);
    }
  }, [ano, mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function mudarMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
    setSelecionado(null);
  }

  const porData = useMemo(() => {
    const m = new Map<string, DiaAPI[]>();
    for (const d of dias) {
      const lista = m.get(d.dataISO) ?? [];
      lista.push(d);
      m.set(d.dataISO, lista);
    }
    return m;
  }, [dias]);

  const detalhe = selecionado ? (porData.get(selecionado) ?? []) : [];
  const livresSelecionado = detalhe.flatMap((d) => d.slots).filter((s) => s.disponivel).length;

  async function adicionarDia() {
    setErro("");
    setMsg("");
    if (!novaData || !inicio || !fim) return setErro("Preencha data, início e fim.");
    const r = await fetch("/api/disponibilidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataISO: novaData, inicio, fim }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      return setErro(j?.erro ?? "Falha ao abrir o dia.");
    }
    setMsg(`Dia ${novaData} aberto (${inicio}–${fim}).`);
    setNovaData("");
    carregar();
  }

  async function fecharDia() {
    if (!selecionado) return;
    if (!window.confirm(`Fechar o dia ${selecionado}? Clientes não verão mais esse dia.`)) return;
    await fetch(`/api/disponibilidade?dataISO=${selecionado}`, { method: "DELETE" });
    setMsg(`Dia ${selecionado} fechado.`);
    setSelecionado(null);
    carregar();
  }

  async function modoFerias() {
    setErro("");
    setMsg("");
    if (!feriasDe || !feriasAte) return setErro("Preencha o período das férias.");
    if (feriasAte < feriasDe) return setErro("A data final deve ser após a inicial.");
    if (!window.confirm(`Bloquear ${feriasDe} a ${feriasAte}?`)) return;
    const r = await fetch(`/api/disponibilidade?de=${feriasDe}&ate=${feriasAte}`, { method: "DELETE" });
    if (!r.ok) return setErro("Falha no modo férias.");
    const j = await r.json();
    setMsg(`Férias ativadas: ${j.removidos} dia(s) bloqueado(s).`);
    setFeriasDe("");
    setFeriasAte("");
    setSelecionado(null);
    carregar();
  }

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const hoje = hojeISO();
  const nomeMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">AGENDA</h1>
      <p className="text-sm text-slate-400">Toque num dia para ver e editar</p>

      {msg && <p className="mt-3 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">{msg}</p>}
      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          {erro}
        </p>
      )}

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="font-display text-2xl tracking-wide text-white capitalize">{nomeMes}</p>
          <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <span key={`v${i}`} />
          ))}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dia = i + 1;
            const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const regs = porData.get(iso) ?? [];
            const livres = regs.flatMap((r) => r.slots).filter((s) => s.disponivel).length;
            const aberto = regs.length > 0;
            const passado = iso < hoje;
            const sel = iso === selecionado;
            return (
              <button
                key={iso}
                onClick={() => {
                  setSelecionado(iso);
                  setMsg("");
                  setErro("");
                }}
                aria-label={`${dia}, ${aberto ? `${livres} vagas` : "fechado"}`}
                className={cn(
                  "flex min-h-[48px] flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition-all",
                  sel
                    ? "border-accent bg-accent text-white shadow-glow-red"
                    : passado
                      ? "border-transparent text-slate-600"
                      : aberto
                        ? "border-green-400/40 bg-green-500/10 text-green-200"
                        : "border-white/10 text-slate-400"
                )}
              >
                {dia}
                {!passado && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", aberto ? "bg-green-400" : "bg-slate-600")} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selecionado && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4"
        >
          <p className="font-bold capitalize text-white">{formatarDataLonga(selecionado)}</p>
          {detalhe.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">Dia fechado — nada cadastrado.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {detalhe.map((d) => (
                <li key={d.inicio} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm text-slate-200">
                  <span className="font-bold">
                    {d.inicio}–{d.fim} • {d.slots.filter((s) => s.disponivel).length} livres
                  </span>
                  <button
                    onClick={async () => {
                      await fetch(`/api/disponibilidade?dataISO=${d.dataISO}&inicio=${d.inicio}`, {
                        method: "DELETE",
                      });
                      carregar();
                    }}
                    aria-label={`Remover intervalo ${d.inicio}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 grid gap-2">
            {detalhe.length > 0 && (
              <Button variant="outline" onClick={fecharDia} className="border-accent text-accent hover:bg-accent hover:text-white">
                <XCircle /> Fechar o dia
              </Button>
            )}
            <p className="text-xs text-slate-500">
              {livresSelecionado > 0 ? `${livresSelecionado} slot(s) livre(s)` : "Sem vagas neste dia"}
            </p>
          </div>
        </motion.section>
      )}

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-white">
          <Plus className="h-5 w-5" /> Adicionar dia disponível
        </h2>
        <p className="text-xs text-slate-400">Ex: dia 26, 19:00 às 22:00 → 3 slots de 1h</p>
        <div className="mt-3 grid gap-3">
          <Input rotulo="Data" type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} name="nova-data" />
          <div className="grid grid-cols-2 gap-3">
            <Input rotulo="Início" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} name="inicio" />
            <Input rotulo="Fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} name="fim" />
          </div>
          <Button onClick={adicionarDia}>Abrir este dia</Button>
        </div>
      </section>

      <section className="mt-3 rounded-3xl border-2 border-dashed border-accent/40 bg-red-500/5 p-4">
        <h2 className="flex items-center gap-1.5 font-extrabold text-red-300">
          <Palmtree className="h-5 w-5" /> Modo férias
        </h2>
        <p className="text-xs text-slate-400">Bloqueia o período inteiro de uma vez</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input rotulo="De" type="date" value={feriasDe} onChange={(e) => setFeriasDe(e.target.value)} name="ferias-de" />
          <Input rotulo="Até" type="date" value={feriasAte} onChange={(e) => setFeriasAte(e.target.value)} name="ferias-ate" />
        </div>
        <Button variant="accent" onClick={modoFerias} className="mt-3 w-full">
          Bloquear período
        </Button>
      </section>
    </div>
  );
}
