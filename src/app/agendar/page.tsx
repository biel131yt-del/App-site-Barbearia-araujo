"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  Camera,
  QrCode,
  Scissors,
  Sparkles,
  Star,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Stepper } from "@/components/agendar/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FundoBarbearia } from "@/components/marca";
import { Confete } from "@/components/Confete";
import { NavalhaIcon, RelogioBG, WhatsAppIcon } from "@/components/barber-icons";
import { WHATSAPP_DONO } from "@/lib/config";
import { SERVICOS_MOCK, formatarPreco, type Servico } from "@/lib/dados-mock";
import {
  buscarClientePorTelefone,
  diaSemanaCurto,
  formatarDataBR,
  formatarDataLonga,
  linkGoogleCalendar,
  linkWhatsAppDono,
  mascararTelefone,
  salvarAgendamentoLocal,
  telefoneValido,
  apenasDigitos,
  type Agendamento,
  type Pagamento,
} from "@/lib/agendamento";
import {
  listarDisponibilidade,
  listarServicos,
  type DiaAPI,
} from "@/lib/api";
import { cn } from "@/lib/utils";

// Animação entre etapas — desliza suave, 60fps
const slide = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -32, transition: { duration: 0.18 } },
};

function iconeServico(id: string) {
  if (id.includes("barba") && !id.includes("corte")) return <NavalhaIcon className="h-6 w-6" />;
  if (id.includes("corte") && id.includes("barba")) return <Sparkles className="h-6 w-6" />;
  return <Scissors className="h-6 w-6" />;
}

function diasDesde(iso: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  const diff = Math.floor((Date.now() - new Date(a, m - 1, d).getTime()) / 86400000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "há 1 dia";
  return `há ${diff} dias`;
}

export default function AgendarPage() {
  const [etapa, setEtapa] = useState(1);
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [dataISO, setDataISO] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pagamento, setPagamento] = useState<Pagamento>("local");
  const [erro, setErro] = useState("");
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pix, setPix] = useState<{ qrBase64: string; qrTexto: string } | null>(null);
  const [verificandoPix, setVerificandoPix] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [servicos, setServicos] = useState<Servico[]>(SERVICOS_MOCK);
  const [filtroFaixa, setFiltroFaixa] = useState("todas");
  const faixas = useMemo(() => {
    const todas = servicos.map((s) => s.faixa);
    return todas.filter((v, i) => todas.indexOf(v) === i);
  }, [servicos]);
  const servicosFiltrados = filtroFaixa === "todas" ? servicos : servicos.filter((s) => s.faixa === filtroFaixa);
  const [diasAPI, setDiasAPI] = useState<DiaAPI[] | null>(null);
  const [clienteAPI, setClienteAPI] = useState<{
    nome: string;
    total: number;
    ultimo: string | null;
    ultimoDataISO: string | null;
  } | null>(null);
  // Fidelidade configurável pelo dono (Ajustes)
  const [fid, setFid] = useState({ fidelidadeAtiva: true, cortesParaGratis: 10, instagramUrl: "" });

  useEffect(() => {
    listarServicos().then(setServicos).catch(() => null);
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setFid({ fidelidadeAtiva: j.fidelidadeAtiva, cortesParaGratis: j.cortesParaGratis, instagramUrl: j.instagramUrl ?? "" }))
      .catch(() => null);
    const hoje = new Date();
    const de = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 13);
    const ate = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`;
    listarDisponibilidade(de, ate)
      .then((d) => setDiasAPI(d))
      .catch(() => setDiasAPI([])); // offline = tudo fechado (nunca mostra vaga falsa)
  }, []);

  useEffect(() => {
    if (!telefoneValido(whatsapp)) {
      setClienteAPI(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/clientes?telefone=${apenasDigitos(whatsapp)}`);
        const j = await r.json();
        if (j?.cliente)
          setClienteAPI({ nome: j.cliente.nome, total: j.totalAgendamentos, ultimo: j.ultimoServico, ultimoDataISO: j.ultimoDataISO ?? null });
      } catch {
        /* mantém mock */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [whatsapp]);

  // Junta slots de todos os intervalos do dia (dia pode ter manhã + noite)
  const slotsDiaAPI = useMemo(
    () => (diasAPI ?? []).filter((d) => d.dataISO === dataISO).flatMap((d) => d.slots),
    [diasAPI, dataISO]
  );
  const diaAPI = slotsDiaAPI.length > 0 ? { slots: slotsDiaAPI } : null;
  // Sem registro = sem slots (nunca inventa horário)
  const slots = useMemo(() => (diaAPI ? diaAPI.slots : []), [diaAPI]);
  const vagasLivres = slots.filter((s) => s.disponivel).length;
  const servico = servicos.find((s) => s.id === servicoId) ?? null;
  const clienteMock = buscarClientePorTelefone(whatsapp);
  const cliente = clienteAPI
    ? { nome: clienteAPI.nome, ultimoCorte: clienteAPI.ultimo ?? "", totalCortes: clienteAPI.total, ultimoDataISO: clienteAPI.ultimoDataISO }
    : clienteMock
      ? { ...clienteMock, ultimoDataISO: null as string | null }
      : null;

  // Dias p/ exibir (API ou mock) + selos Hoje/Amanhã
  const hojeD = new Date();
  const isoHoje = `${hojeD.getFullYear()}-${String(hojeD.getMonth() + 1).padStart(2, "0")}-${String(hojeD.getDate()).padStart(2, "0")}`;
  const amanhaD = new Date(hojeD.getFullYear(), hojeD.getMonth(), hojeD.getDate() + 1);
  const isoAmanha = `${amanhaD.getFullYear()}-${String(amanhaD.getMonth() + 1).padStart(2, "0")}-${String(amanhaD.getDate()).padStart(2, "0")}`;
  // Grade contínua de 14 dias — SEM registro = FECHADO (extras: dono abre quando quer)
  const diasTela = useMemo(() => {
    const base = new Date();
    const lista: { iso: string; date: Date; aberto: boolean }[] = [];
    for (let i = 0; i < 14; i++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const regs = (diasAPI ?? []).filter((d) => d.dataISO === iso);
      const livres = regs.flatMap((r) => r.slots).filter((s) => s.disponivel).length;
      lista.push({ iso, date: dt, aberto: regs.length > 0 && livres > 0 });
    }
    return lista;
  }, [diasAPI]);
  const diaFechado = dataISO ? !diasTela.some((d) => d.iso === dataISO && d.aberto) : false;

  const podeAvancar =
    (etapa === 1 && !!servicoId) ||
    (etapa === 2 && !!dataISO && !diaFechado) ||
    (etapa === 3 && !!hora) ||
    (etapa === 4 && nome.trim().length >= 2 && telefoneValido(whatsapp)) ||
    etapa === 5;

  function avancar() {
    setErro("");
    if (etapa === 1 && !servicoId) return setErro("Escolha um serviço para continuar.");
    if (etapa === 2 && !dataISO) return setErro("Escolha um dia.");
    if (etapa === 2 && diaFechado) return setErro("Dia fechado — chame no WhatsApp para negociar uma exceção.");
    if (etapa === 3 && !hora) return setErro("Escolha um horário livre.");
    if (etapa === 4) {
      if (nome.trim().length < 2) return setErro("Digite seu nome.");
      if (!telefoneValido(whatsapp)) return setErro("Digite um WhatsApp válido com DDD.");
    }
    if (etapa === 5) return confirmar();
    setEtapa((e) => Math.min(e + 1, 5));
  }

  async function confirmar() {
    if (!servicoId || !dataISO || !hora) return;
    setEnviando(true);
    setErro("");
    try {
      const r = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicoId, dataISO, hora, nome: nome.trim(), telefone: whatsapp.trim(), pagamento }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.erro ?? "Falha ao agendar");
      const novo: Agendamento = {
        id: j.id ?? `ag-${Date.now()}`,
        servicoId: j.servicoId ?? servicoId,
        dataISO: j.dataISO ?? dataISO,
        hora: j.hora ?? hora,
        nome: j.cliente?.nome ?? nome.trim(),
        whatsapp: j.cliente?.telefone ?? whatsapp.trim(),
        pagamento,
        criadoEm: j.criadoEm ?? new Date().toISOString(),
      };
      salvarAgendamentoLocal(novo);
      setAgendamento(novo);

      if (pagamento === "pix") {
        try {
          const rp = await fetch("/api/pagamentos/pix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agendamentoId: novo.id }),
          });
          const jp = await rp.json();
          if (!rp.ok) throw new Error(jp?.erro ?? "Falha ao gerar PIX");
          setPix({ qrBase64: jp.qrBase64, qrTexto: jp.qrTexto });
          setEtapa(7);
          return;
        } catch (e) {
          setErro(e instanceof Error ? `${e.message} Pode concluir pagando no local.` : "PIX falhou.");
          setEtapa(5);
          return;
        } finally {
          setEnviando(false);
        }
      }
      setEtapa(6);
    } catch (e) {
      const novo: Agendamento = {
        id: `ag-${Date.now()}`,
        servicoId,
        dataISO,
        hora,
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        pagamento,
        criadoEm: new Date().toISOString(),
      };
      salvarAgendamentoLocal(novo);
      setAgendamento(novo);
      setEtapa(6);
      if (e instanceof Error && e.message !== "Failed to fetch") setErro("");
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    if (etapa !== 7 || !agendamento) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/pagamentos/pix?agendamentoId=${agendamento.id}`, { cache: "no-store" });
        const j = await r.json();
        if (j?.status === "pago") {
          clearInterval(t);
          setEtapa(6);
        }
      } catch {
        /* tenta de novo */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [etapa, agendamento]);

  async function verificarPixAgora() {
    if (!agendamento) return;
    setVerificandoPix(true);
    try {
      const r = await fetch(`/api/pagamentos/pix?agendamentoId=${agendamento.id}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.status === "pago") setEtapa(6);
      else setErro("Pagamento ainda não identificado. Tente de novo em instantes.");
    } catch {
      setErro("Falha ao verificar. Tente de novo.");
    } finally {
      setVerificandoPix(false);
    }
  }

  async function trocarParaLocal() {
    if (!agendamento) return;
    await fetch("/api/agendamentos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agendamento.id, pagamento: "local" }),
    }).catch(() => null);
    setAgendamento({ ...agendamento, pagamento: "local" });
    setEtapa(6);
  }

  return (
    <FundoBarbearia className="pb-28 md:pb-10">
      <Header />

      <main className="container-mobile mt-4 md:mt-8">
        {etapa <= 5 && (
          <>
            <button
              onClick={() => (etapa === 1 ? window.history.back() : setEtapa((e) => e - 1))}
              className="inline-flex items-center gap-1 text-sm font-bold text-slate-400"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="mt-2">
              <Stepper etapa={etapa} />
            </div>
          </>
        )}

        <AnimatePresence mode="wait">
          {/* ── ETAPA 1: serviço ── */}
          {etapa === 1 && (
            <motion.section key="e1" variants={slide} initial="hidden" animate="show" exit="exit" className="mt-4">
              <h1 className="font-display text-4xl tracking-wide text-white">QUAL SERVIÇO?</h1>
              <p className="text-sm text-slate-400">Toque para escolher</p>
              {faixas.length > 1 && (
                <div className="mt-3 flex gap-2" role="group" aria-label="Filtrar por público">
                  {["todas", ...faixas].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFiltroFaixa(f)}
                      aria-pressed={filtroFaixa === f}
                      className={cn(
                        "min-h-[44px] rounded-full border-2 px-4 text-sm font-bold capitalize transition-all",
                        filtroFaixa === f
                          ? "border-accent bg-accent text-white"
                          : "border-white/15 bg-white/5 text-slate-300"
                      )}
                    >
                      {f === "todas" ? "Todos" : f}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 grid gap-3">
                {servicosFiltrados.map((s) => {
                  const sel = s.id === servicoId;
                  return (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 1.02 }}
                      onClick={() => {
                        setServicoId(s.id);
                        setErro("");
                      }}
                      aria-pressed={sel}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                        sel
                          ? "scale-[1.02] border-accent bg-white/10 shadow-glow-red"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                          sel ? "bg-accent/20 text-red-300" : "bg-brand-600/30 text-slate-200"
                        )}
                      >
                        {iconeServico(s.id)}
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-white">
                          {s.nome}{" "}
                          {s.faixa === "infantil" && (
                            <span className="ml-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                              Infantil
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {s.descricao} •{" "}
                          <span className="rounded bg-white/10 px-1.5 py-0.5 font-bold">{s.duracaoMin} min</span>
                        </span>
                      </span>
                      <span className="font-display text-3xl tracking-wide text-white">
                        {formatarPreco(s.preco)}
                      </span>
                    </motion.button>
                  );
                })}
                {/* Card serviço personalizado — fora da lista filtrada */}
                <a
                  href={`https://wa.me/${WHATSAPP_DONO}?text=${encodeURIComponent("Fala! Meu corte não está na lista, vamos conversar?")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-white/20 bg-transparent p-4 text-left transition-all hover:border-green-400/60 hover:bg-green-500/5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-300">
                    <WhatsAppIcon className="h-6 w-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-white">Seu corte não está na lista?</span>
                    <span className="block text-xs text-slate-400">Entre em contato e vamos conversar</span>
                  </span>
                </a>
              </div>
            </motion.section>
          )}

          {/* ── ETAPA 2: data ── */}
          {etapa === 2 && (
            <motion.section key="e2" variants={slide} initial="hidden" animate="show" exit="exit" className="mt-4">
              <h1 className="font-display flex items-center gap-2 text-4xl tracking-wide text-white">
                <CalendarDays className="h-7 w-7" /> QUAL DIA?
              </h1>
              <p className="text-sm text-slate-400">Dias sem vaga aparecem fechados</p>
              {diasAPI === null ? (
                <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="Carregando dias">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                  ))}
                </div>
              ) : (
              <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {diasTela.map((d) => {
                  const sel = d.iso === dataISO;
                  const selo = d.iso === isoHoje ? "Hoje" : d.iso === isoAmanha ? "Amanhã" : null;
                  return (
                    <motion.button
                      key={d.iso}
                      whileTap={{ y: -2 }}
                      onClick={() => {
                        setDataISO(d.iso);
                        setHora(null);
                        setErro("");
                      }}
                      title={d.aberto ? formatarDataLonga(d.iso) : "Fechado — toque p/ negociar"}
                      aria-label={`${d.date.getDate()}, ${d.aberto ? "aberto" : "fechado"}`}
                      className={cn(
                        "rounded-2xl border-2 p-3 text-center transition-all",
                        sel && d.aberto
                          ? "border-accent bg-accent text-white shadow-glow-red"
                          : sel
                            ? "border-yellow-400/70 bg-yellow-500/10 text-white"
                            : d.aberto
                              ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                              : "riscado border-white/5 text-slate-500 opacity-60"
                      )}
                    >
                      {selo && (
                        <span className={cn("mb-1 inline-block rounded-full px-2 py-px text-[10px] font-bold", sel && d.aberto ? "bg-white/20" : "bg-accent/20 text-red-300")}>
                          {selo}
                        </span>
                      )}
                      {d.aberto ? (
                        <span className="mb-1 ml-1 inline-block rounded bg-green-500/25 px-1.5 py-px text-[10px] font-extrabold tracking-wide text-green-300">
                          ABERTO
                        </span>
                      ) : (
                        <span className="mb-1 inline-block rounded-full bg-white/10 px-2 py-px text-[10px] font-bold text-slate-400">
                          Fechado
                        </span>
                      )}
                      <span className="block text-[11px] font-bold opacity-80">{diaSemanaCurto(d.date)}</span>
                      <span className="font-display block text-4xl leading-none tracking-wide">{d.date.getDate()}</span>
                      <span className="block text-[11px] opacity-80">
                        {d.date.toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              )}
              {/* Negociar exceção em dia fechado */}
              {dataISO && diaFechado && (
                <div className="mt-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-center">
                  <p className="text-sm font-bold text-yellow-200">🔒 Fechado neste dia</p>
                  <p className="mt-1 text-xs text-slate-300">
                    O dono só abre com agendamento. Quer tentar uma exceção?
                  </p>
                  <a
                    href={`https://wa.me/${WHATSAPP_DONO}?text=${encodeURIComponent(`Fala! Vi que ${formatarDataBR(dataISO)} está fechado, rola abrir uma exceção?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-500 px-5 font-bold text-white"
                  >
                    <WhatsAppIcon className="h-5 w-5" /> Negociar no WhatsApp
                  </a>
                </div>
              )}
              {servico && dataISO && (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <strong className="text-white">{servico.nome}</strong> • {formatarDataLonga(dataISO)}
                </p>
              )}
            </motion.section>
          )}

          {/* ── ETAPA 3: hora ── */}
          {etapa === 3 && (
            <motion.section key="e3" variants={slide} initial="hidden" animate="show" exit="exit" className="relative mt-4">
              <RelogioBG className="pointer-events-none absolute -right-8 top-0 h-44 w-44 text-white opacity-5" />
              <h1 className="font-display relative flex items-center gap-2 text-4xl tracking-wide text-white">
                <Clock className="h-7 w-7" /> QUAL HORÁRIO?
              </h1>
              <p className="relative text-sm capitalize text-slate-400">
                {dataISO ? formatarDataLonga(dataISO) : ""} • {vagasLivres} vaga(s) restante(s)
              </p>
              <div className="relative mt-3 grid grid-cols-3 gap-2.5">
                {slots.map((s) => {
                  const sel = s.hora === hora;
                  return (
                    <motion.button
                      key={s.hora}
                      whileTap={{ scale: 1.05 }}
                      disabled={!s.disponivel}
                      onClick={() => {
                        setHora(s.hora);
                        setErro("");
                      }}
                      className={cn(
                        "h-14 rounded-xl border-2 text-base font-extrabold transition-all hover:scale-[1.03]",
                        sel
                          ? "scale-105 border-accent bg-accent text-white shadow-glow-red"
                          : s.disponivel
                            ? "border-white/10 bg-white/5 text-white"
                            : "riscado cursor-not-allowed border-transparent text-slate-600 opacity-25 line-through"
                      )}
                    >
                      {s.hora}
                    </motion.button>
                  );
                })}
              </div>
              <p className="relative mt-3 text-center text-xs text-slate-400 opacity-60">
                Escolha o melhor horário pra você
              </p>
              {vagasLivres === 0 && (
                <p className="relative mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
                  Dia lotado. Volte e escolha outra data.
                </p>
              )}
            </motion.section>
          )}

          {/* ── ETAPA 4: dados ── */}
          {etapa === 4 && (
            <motion.section key="e4" variants={slide} initial="hidden" animate="show" exit="exit" className="mt-4">
              <h1 className="font-display text-4xl tracking-wide text-white">SEUS DADOS</h1>
              <p className="text-sm text-slate-400">Usamos só p/ confirmar no WhatsApp</p>

              {cliente && (
                <div className="mt-3 rounded-2xl border border-green-400/30 bg-green-500/10 p-4">
                  <p className="flex items-center gap-2 font-extrabold text-green-200">
                    <Scissors className="h-5 w-5 animate-tesoura" /> Bem-vindo de volta, {cliente.nome}!
                  </p>
                  {fid.fidelidadeAtiva ? (
                    <>
                      <p className="mt-0.5 text-sm text-green-300/80">Último corte: {cliente.ultimoCorte || "—"}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-green-200">
                        <Star className="h-3.5 w-3.5 fill-green-400 text-green-400" />
                        {cliente.totalCortes >= fid.cortesParaGratis
                          ? "Você ganhou o próximo corte GRÁTIS 🎉"
                          : `Faltam ${fid.cortesParaGratis - cliente.totalCortes} para o corte grátis`}
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 text-sm text-green-300/80">
                      Último corte: {cliente.ultimoCorte || "—"}
                      {cliente.ultimoDataISO ? ` • ${diasDesde(cliente.ultimoDataISO)}` : ""}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-4">
                <Input
                  rotulo="Seu nome"
                  name="nome"
                  placeholder="Ex: Gabriel Araújo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                />
                <Input
                  rotulo="WhatsApp"
                  name="whatsapp"
                  placeholder="(51) 99682-4286"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(mascararTelefone(e.target.value))}
                  autoComplete="tel"
                />
              </div>
            </motion.section>
          )}

          {/* ── ETAPA 5: confirmar + pagamento ── */}
          {etapa === 5 && servico && dataISO && hora && (
            <motion.section key="e5" variants={slide} initial="hidden" animate="show" exit="exit" className="mt-4">
              <h1 className="font-display text-4xl tracking-wide text-white">CONFIRMAR</h1>
              <p className="text-sm text-slate-400">Revise antes de fechar</p>

              <div className="mt-3 rounded-2xl border border-white/10 border-l-4 border-l-accent bg-white/5 p-4">
                <p className="font-extrabold text-white">{servico.nome}</p>
                <p className="mt-1 text-sm capitalize text-slate-300">
                  {formatarDataLonga(dataISO)} • {hora}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {nome} • {whatsapp}
                </p>
                <p className="font-display mt-2 text-3xl tracking-wide text-white">
                  {formatarPreco(servico.preco)}
                </p>
              </div>

              <p className="mt-4 text-sm font-bold text-white">Como quer pagar?</p>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setPagamento("pix")}
                  aria-pressed={pagamento === "pix"}
                  className={cn(
                    "relative rounded-2xl border-2 bg-brand-900/60 p-4 text-left transition-all",
                    pagamento === "pix" ? "border-accent shadow-glow-red-sm" : "border-white/10"
                  )}
                >
                  <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold text-white">
                    Recomendado
                  </span>
                  <QrCode className="h-7 w-7 text-white" />
                  <span className="mt-1 block text-sm font-extrabold text-white">PIX agora</span>
                  <span className="block text-xs text-slate-400">QR na próxima tela</span>
                  {pagamento === "pix" && (
                    <Check className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-accent p-0.5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setPagamento("local")}
                  aria-pressed={pagamento === "local"}
                  className={cn(
                    "relative rounded-2xl border-2 bg-brand-900/60 p-4 text-left transition-all",
                    pagamento === "local" ? "border-accent shadow-glow-red-sm" : "border-white/10"
                  )}
                >
                  <Banknote className="h-7 w-7 text-white" />
                  <span className="mt-1 block text-sm font-extrabold text-white">No local</span>
                  <span className="block text-xs text-slate-400">PIX ou dinheiro</span>
                  {pagamento === "local" && (
                    <Check className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-accent p-0.5 text-white" />
                  )}
                </button>
              </div>
            </motion.section>
          )}

          {/* ── ETAPA 7: pagar PIX ── */}
          {etapa === 7 && pix && servico && (
            <motion.section key="pix" variants={slide} initial="hidden" animate="show" exit="exit" className="mt-6 text-center">
              <QrCode className="mx-auto h-10 w-10 text-white" />
              <h1 className="font-display mt-2 text-4xl tracking-wide text-white">
                PAGUE {formatarPreco(servico.preco)}
              </h1>
              <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
                Escaneie o QR no app do banco. Confirmamos sozinho em segundos.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pix.qrBase64}`}
                alt="QR Code PIX"
                className="mx-auto mt-4 h-56 w-56 rounded-2xl border border-white/10 bg-white shadow-card"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pix.qrTexto).catch(() => null);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="mx-auto mt-3 flex min-h-[44px] max-w-sm items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold text-white"
              >
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiado ? "Copiado!" : "Copiar código PIX"}
              </button>
              <p className="mx-auto mt-2 max-w-sm break-all rounded-xl bg-white/5 p-2 text-[10px] text-slate-500">
                {pix.qrTexto.slice(0, 60)}…
              </p>
              <div className="mx-auto mt-4 grid max-w-sm gap-2.5">
                <Button variant="accent" onClick={verificarPixAgora} disabled={verificandoPix}>
                  {verificandoPix ? "Verificando…" : "Já paguei, verificar"}
                </Button>
                <Button variant="ghost" onClick={trocarParaLocal}>
                  Prefiro pagar no local
                </Button>
              </div>
            </motion.section>
          )}

          {/* ── ETAPA 6: sucesso ── */}
          {etapa === 6 && agendamento && (
            <motion.section key="ok" variants={slide} initial="hidden" animate="show" exit="exit" className="mt-6 text-center">
              <Confete />
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-400" />
              <h1 className="font-display mt-2 text-5xl tracking-wide text-white">AGENDADO! 🎉</h1>
              <p className="mx-auto mt-1 max-w-xs text-sm text-slate-300">
                {servico?.nome} • {formatarDataLonga(agendamento.dataISO)} às {agendamento.hora}
              </p>
              <div className="mx-auto mt-4 grid max-w-sm gap-2.5">
                <a href={linkGoogleCalendar(agendamento)} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">
                    <CalendarPlus /> Adicionar ao calendário
                  </Button>
                </a>
                <a href={linkWhatsAppDono(agendamento)} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-green-500/50 text-green-300 hover:bg-green-500 hover:text-white">
                    <WhatsAppIcon className="h-5 w-5" /> Confirmar no WhatsApp
                  </Button>
                </a>
                {fid.instagramUrl ? (
                  <a href={fid.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" className="w-full">
                      <Camera /> Compartilhar no Instagram
                    </Button>
                  </a>
                ) : null}
                <a href="/">
                  <Button variant="ghost" className="w-full">
                    Voltar ao início
                  </Button>
                </a>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {erro && etapa <= 7 && (
          <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
            {erro}
          </p>
        )}

        {etapa <= 5 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-950/95 p-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
            <div className="container-mobile md:max-w-none md:px-0">
              <Button
                variant="accent"
                size="lg"
                className="press w-full hover:shadow-glow-red"
                disabled={!podeAvancar || enviando}
                onClick={avancar}
              >
                {etapa === 5 ? (enviando ? "Agendando..." : "Confirmar agendamento") : "Continuar"} <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </main>
    </FundoBarbearia>
  );
}
