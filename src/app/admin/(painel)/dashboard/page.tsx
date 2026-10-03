"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CalendarCheck, QrCode, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/barber-icons";
import { useMensagemWhats } from "@/components/use-mensagem-whats";
import { formatarDataBR } from "@/lib/agendamento";
import { linkWhatsAppCliente } from "@/lib/whatsapp";
import {
  contar,
  formatarReais,
  hojeISO,
  semanaISO,
  somar,
  type AgendamentoAdmin,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

// Dashboard do dono — hoje, faturamento, próximos + status das notificações.
export default function AdminDashboard() {
  const [ags, setAgs] = useState<AgendamentoAdmin[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/agendamentos", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setAgs)
      .catch(() => setErro("Não foi possível carregar os dados."));
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
  const proximos = ags
    .filter((a) => a.dataISO >= hoje && a.status !== "cancelado")
    .sort((a, b) => (a.dataISO + a.hora).localeCompare(b.dataISO + b.hora))
    .slice(0, 5);

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
        <h2 className="font-display text-2xl tracking-wide text-white">HOJE ({deHoje.length})</h2>
        {deHoje.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Nenhum agendamento hoje. Abra um dia na Agenda para receber clientes.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2.5">
            {deHoje.map((a) => (
              <ItemAgendamento key={a.id} a={a} />
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
              <ItemAgendamento key={a.id} a={a} mostrarData />
            ))}
          </ul>
        )}
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

function ItemAgendamento({ a, mostrarData }: { a: AgendamentoAdmin; mostrarData?: boolean }) {
  const msg = useMensagemWhats({ nome: a.cliente.nome, servico: a.servico.nome, data: formatarDataBR(a.dataISO), hora: a.hora });
  const selo =
    a.status === "pago"
      ? { txt: "Pago", cls: "bg-green-500/20 text-green-300" }
      : a.status === "aguardando"
        ? { txt: "PIX pendente", cls: "bg-yellow-500/20 text-yellow-300" }
        : { txt: "Pendente", cls: "bg-white/10 text-slate-400" };
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
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
    </li>
  );
}
