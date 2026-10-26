"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CalendarCheck, Check, Clock, QrCode, Star as StarIcon, TrendingUp, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/barber-icons";
import { useMensagemWhats } from "@/components/use-mensagem-whats";
import { formatarDataBR } from "@/lib/agendamento";
import { linkWhatsAppCliente } from "@/lib/whatsapp";
import {
  contar,
  formatarReais,
  hojeISO,
  pendentes,
  semanaISO,
  somar,
  type AgendamentoAdmin,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

// Dashboard do dono — hoje, faturamento, próximos + avaliações e lista de espera.
export default function AdminDashboard() {
  const [ags, setAgs] = useState<AgendamentoAdmin[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoResumo[]>([]);
  const [listaEsperaPendente, setListaEsperaPendente] = useState<ListaEsperaResumo[]>([]);

type AvaliacaoResumo = {
  id: string;
  nota: number;
  agendamento: {
    cliente: { nome: string };
    servico: { nome: string };
    dataISO: string;
  };
};

type ListaEsperaResumo = {
  id: string;
  nome: string;
  dataISO: string;
  horaPreferida: string | null;
  servico: { nome: string };
  criadoEm: string;
};
  const [erro, setErro] = useState("");

  async function recarregar() {
    try {
      const r = await fetch("/api/agendamentos", { cache: "no-store" });
      if (r.ok) setAgs(await r.json());
      const ra = await fetch("/api/avaliacoes?todos=1", { cache: "no-store" });
      if (ra.ok) setAvaliacoes(await ra.json());
      const rl = await fetch("/api/lista-espera?atendido=0", { cache: "no-store" });
      if (rl.ok) setListaEsperaPendente(await rl.json());
    } catch {
      /* mantém */
    }
  }

  useEffect(() => {
    fetch("/api/agendamentos", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setAgs)
      .catch(() => setErro("Não foi possível carregar os dados."));
    fetch("/api/avaliacoes?todos=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAvaliacoes)
      .catch(() => null);
    fetch("/api/lista-espera?atendido=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setListaEsperaPendente)
      .catch(() => null);
  }, []);

  const hoje = hojeISO();
  const mes = hoje.slice(0, 7);
  const sem = semanaISO();

  const kpis = useMemo(
    () => ({
      fatHoje: somar(ags, (d) => d === hoje),
      fatSemana: somar(ags, (d) => d >= sem.de && d <= sem.ate),
      fatMes: somar(ags, (d) => d.startsWith(mes)),
      qtdHoje: contar(ags, (d) => d === hoje),
      qtdMes: contar(ags, (d) => d.startsWith(mes)),
      pixMes: ags
        .filter((a) => a.status !== "cancelado" && a.dataISO.startsWith(mes) && a.pagamento === "pix")
        .reduce((s, a) => s + a.servico.precoCentavos, 0),
    }),
    [ags, hoje, mes, sem.de, sem.ate]
  );
  const ticketMedio = kpis.qtdMes > 0 ? Math.round(kpis.fatMes / kpis.qtdMes) : 0;

  const deHoje = ags
    .filter((a) => a.dataISO === hoje && a.status !== "cancelado")
    .sort((a, b) => a.hora.localeCompare(b.hora));
  const pendentesHoje = pendentes(ags, (d) => d === hoje);
  const proximos = ags
    .filter((a) => a.dataISO >= hoje && a.status !== "cancelado")
    .sort((a, b) => (a.dataISO + a.hora).localeCompare(b.dataISO + b.hora))
    .slice(0, 5);

  const notaMedia =
    avaliacoes.length > 0
      ? Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10
      : 0;

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">DASHBOARD</h1>
      <p className="text-sm text-slate-400">Resumo do negócio em tempo real</p>

      {erro && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
          {erro}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          icone={<TrendingUp className="h-5 w-5" />}
          titulo="Hoje"
          valor={formatarReais(kpis.fatHoje)}
          detalhe={`${kpis.qtdHoje} atendimento(s)`}
        />
        <Card
          icone={<CalendarCheck className="h-5 w-5" />}
          titulo="7 dias"
          valor={formatarReais(kpis.fatSemana)}
          detalhe="últimos 7 dias"
        />
        <Card
          icone={<Banknote className="h-5 w-5" />}
          titulo="Mês"
          valor={formatarReais(kpis.fatMes)}
          detalhe={`${kpis.qtdMes} no mês`}
        />
        <Card
          icone={<Users className="h-5 w-5" />}
          titulo="Ticket médio"
          valor={formatarReais(ticketMedio)}
          detalhe={`PIX: ${formatarReais(kpis.pixMes)}`}
        />
      </div>

      <section className="mt-6">
        <h2 className="font-display text-2xl tracking-wide text-white">
          HOJE ({deHoje.length - pendentesHoje} feitos · {pendentesHoje} aguardando)
        </h2>
        {deHoje.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Nenhum agendamento hoje. Abra um dia na Agenda para receber clientes.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2.5">
            {deHoje.map((a) => (
              <ItemAgendamento key={a.id} a={a} onMudou={recarregar} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-2xl tracking-wide text-white">PRÓXIMOS CLIENTES</h2>
        {proximos.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Nada agendado por aqui.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2.5">
            {proximos.map((a) => (
              <ItemAgendamento key={a.id} a={a} mostrarData onMudou={recarregar} />
            ))}
          </ul>
        )}
      </section>

      {/* Avaliações recentes */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl tracking-wide text-white">
            AVALIAÇÕES RECENTES
          </h2>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
            Média {avaliacoes.length > 0 ? notaMedia.toFixed(1) : "—"} / 5
          </span>
        </div>
        <div className="mt-2 grid gap-2.5">
          {avaliacoes.length > 0 ? (
            avaliacoes.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">
                    {a.agendamento?.cliente?.nome ?? "Cliente"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {a.agendamento?.servico?.nome ?? ""} •
                    {formatarDataBR(a.agendamento?.dataISO ?? "")}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon
                      key={n}
                      className={cn("h-4 w-4", n <= a.nota ? "fill-yellow-400" : "text-slate-500")}
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-white">{a.nota}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              Nenhuma avaliação ainda.
            </p>
          )}
        </div>
      </section>

      {/* Lista de espera pendente */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl tracking-wide text-white">
            LISTA DE ESPERA PENDENTE
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {listaEsperaPendente.length} cliente(s)
          </span>
        </div>
        <div className="mt-2 grid gap-2.5">
          {listaEsperaPendente.length > 0 ? (
            listaEsperaPendente.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{a.nome}</span>
                  <span className="text-xs text-slate-400">
                    {a.servico?.nome ?? ""} • {formatarDataBR(a.dataISO)}
                    {a.horaPreferida ? ` • ${a.horaPreferida}` : ""}
                  </span>
                </div>
                <span className="text-xs font-bold text-yellow-300">
                  Aguardando desde{" "}
                  {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))
          ) : (
            <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              Nenhum cliente na lista de espera.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({
  icone,
  titulo,
  valor,
  detalhe,
}: {
  icone: React.ReactNode;
  titulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
        {icone} {titulo}
      </p>
      <p className="font-display mt-1 text-3xl tracking-wide text-white">{valor}</p>
      <p className="text-xs text-slate-400">{detalhe}</p>
    </motion.div>
  );
}

// Linha de status das 3 notificações (push + google + whatsapp fallback)
function StatusNotifs({ a }: { a: AgendamentoAdmin }) {
  const itens = [
    { rot: "Push", v: a.pushStatus },
    { rot: "Google", v: a.googleStatus },
    { rot: "E-mail", v: a.emailStatus },
  ];
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {itens.map((i) => {
        const ok = ["enviado", "criado"].includes(i.v);
        return (
          <span
            key={i.rot}
            className={cn(
              "rounded-full px-1.5 py-px text-[10px] font-bold",
              ok ? "bg-green-500/20 text-green-300" : "bg-white/10 text-slate-400"
            )}
          >
            {i.rot}: {ok ? "✓" : i.v}
          </span>
        );
      })}
    </span>
  );
}

function ItemAgendamento({ a, mostrarData, onMudou }: { a: AgendamentoAdmin; mostrarData?: boolean; onMudou: () => void }) {
  const [remanejando, setRemanejando] = useState(false);
  const msg = useMensagemWhats({ nome: a.cliente.nome, servico: a.servico.nome, data: formatarDataBR(a.dataISO), hora: a.hora });
  const selo =
    a.status === "pago"
      ? { txt: "Pago", cls: "bg-green-500/20 text-green-300" }
      : a.status === "concluido"
        ? { txt: "Feito ✓", cls: "bg-green-500/20 text-green-300" }
        : a.status === "aguardando"
          ? { txt: "PIX pendente", cls: "bg-yellow-500/20 text-yellow-300" }
          : { txt: "Aguardando", cls: "bg-white/10 text-slate-400" };
  const finalizado = a.status === "concluido" || a.status === "cancelado";

  async function acao(corpo: Record<string, string>, confirma?: string) {
    if (confirma && !window.confirm(confirma)) return;
    const r = await fetch("/api/agendamentos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, ...corpo }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => null);
      alert(j?.erro ?? "Falha ao atualizar");
      return;
    }
    setRemanejando(false);
    onMudou();
  }

  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 text-white">
          <span className="text-sm font-extrabold">{a.hora}</span>
          {mostrarData && <span className="text-[10px]">{a.dataISO.slice(5)}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">{a.cliente.nome}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            {a.pagamento === "pix" ? <QrCode className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
            {a.servico.nome} • {formatarReais(a.servico.precoCentavos)}
          </span>
          <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", selo.cls)}>
            {selo.txt}
          </span>
          {a.trocoPara && (
            <span className="ml-1 mt-1 inline-block rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
              Troco p/ R${a.trocoPara}
            </span>
          )}
          <StatusNotifs a={a} />
        </span>
        <a
          href={linkWhatsAppCliente(a.cliente.telefone, msg)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chamar ${a.cliente.nome} no WhatsApp`}
        >
          <Button size="icon" className="bg-green-500 hover:bg-green-600" aria-label="WhatsApp">
            <WhatsAppIcon className="h-6 w-6" />
          </Button>
        </a>
      </div>

      {/* Ações do dono: confirmar feito (entra no caixa), remanejar, cancelar */}
      {!finalizado && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => acao({ status: "concluido" }, `Confirmar que fez ${a.servico.nome} de ${a.cliente.nome}? Entra no caixa.`)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl bg-green-500/20 text-xs font-extrabold text-green-300"
          >
            <Check className="h-4 w-4" /> Feito
          </button>
          <button
            onClick={() => setRemanejando((v) => !v)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 text-xs font-extrabold text-slate-200"
          >
            <Clock className="h-4 w-4" /> Remanejar
          </button>
          <button
            onClick={() => acao({ status: "cancelado" }, `Cancelar ${a.servico.nome} de ${a.cliente.nome}?`)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl bg-red-500/15 text-xs font-extrabold text-red-300"
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
        </div>
      )}
      {remanejando && !finalizado && <PainelRemanejar a={a} onFechar={() => setRemanejando(false)} onMudou={onMudou} />}
    </li>
  );
}

// Troca dia/hora (valida no servidor: dia aberto + slot livre)
function PainelRemanejar({ a, onFechar, onMudou }: { a: AgendamentoAdmin; onFechar: () => void; onMudou: () => void }) {
  const [data, setData] = useState(a.dataISO);
  const [hora, setHora] = useState("");
  const [slots, setSlots] = useState<{ hora: string; disponivel: boolean }[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setHora("");
    fetch(`/api/disponibilidade?de=${data}&ate=${data}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((dias: { slots: { hora: string; disponivel: boolean }[] }[]) =>
        setSlots(dias.flatMap((d) => d.slots))
      )
      .catch(() => setSlots([]));
  }, [data]);

  async function salvar() {
    setErro("");
    if (!hora) return setErro("Escolha o novo horário.");
    const r = await fetch("/api/agendamentos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, dataISO: data, hora }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) return setErro(j?.erro ?? "Falha ao remanejar.");
    onFechar();
    onMudou();
  }

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-brand-950/60 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`rem-${a.id}`} className="mb-1 block text-xs font-bold text-slate-300">
            Novo dia
          </label>
          <input
            id={`rem-${a.id}`}
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-12 w-full rounded-xl border-2 border-white/10 bg-white/5 px-3 text-sm text-white [color-scheme:dark]"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-bold text-slate-300">Nova hora</span>
          <div className="flex max-h-12 flex-wrap gap-1 overflow-y-auto">
            {slots.filter((s) => s.disponivel).map((s) => (
              <button
                key={s.hora}
                onClick={() => setHora(s.hora)}
                className={cn(
                  "min-h-[40px] rounded-lg border px-2 text-xs font-extrabold",
                  hora === s.hora ? "border-accent bg-accent text-white" : "border-white/10 text-slate-200"
                )}
              >
                {s.hora}
              </button>
            ))}
            {slots.filter((s) => s.disponivel).length === 0 && (
              <span className="text-xs text-slate-500">Sem vaga neste dia</span>
            )}
          </div>
        </div>
      </div>
      {erro && <p className="mt-2 text-xs font-bold text-red-300">{erro}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={salvar} className="min-h-[44px] flex-1 rounded-xl bg-brand-600 text-xs font-extrabold text-white">
          Confirmar troca
        </button>
        <button onClick={onFechar} className="min-h-[44px] rounded-xl px-4 text-xs font-bold text-slate-400">
          Fechar
        </button>
      </div>
    </div>
  );
}
