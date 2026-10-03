"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Clock, MapPin, Star, ChevronRight, Scissors } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { BotaoInstalarPWA } from "@/components/BotaoInstalarPWA";
import { FundoBarbearia } from "@/components/marca";
import { NavalhaIcon, WhatsAppIcon } from "@/components/barber-icons";
import { WHATSAPP_DONO } from "@/lib/config";
import { SERVICOS_MOCK, formatarPreco, type Servico } from "@/lib/dados-mock";
import { listarServicos } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const [servicos, setServicos] = useState<Servico[]>(SERVICOS_MOCK);
  const [fidelidadeAtiva, setFidelidadeAtiva] = useState(true);
  const [proximo, setProximo] = useState<{ rotulo: string; hora: string; vagas: number } | null>(null);
  const [semAgenda, setSemAgenda] = useState(false);
  useEffect(() => {
    listarServicos().then(setServicos).catch(() => null);
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.fidelidadeAtiva === "boolean") setFidelidadeAtiva(j.fidelidadeAtiva);
      })
      .catch(() => null);
    // Próximo horário livre REAL (sempre atualizado com a agenda do dono)
    (async () => {
      try {
        const hoje = new Date();
        const iso = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const ate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 13);
        const r = await fetch(`/api/disponibilidade?de=${iso(hoje)}&ate=${iso(ate)}`, { cache: "no-store" });
        if (!r.ok) return;
        const dias = (await r.json()) as { dataISO: string; slots: { hora: string; disponivel: boolean }[] }[];
        const rotuloDia = (dISO: string) => {
          if (dISO === iso(hoje)) return "HOJE";
          const am = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
          if (dISO === iso(am)) return "AMANHÃ";
          const [, m, dia] = dISO.split("-");
          return `${dia}/${m}`;
        };
        for (const d of dias) {
          const livres = d.slots.filter((s) => s.disponivel);
          if (livres.length > 0) {
            setProximo({ rotulo: rotuloDia(d.dataISO), hora: livres[0].hora, vagas: livres.length });
            return;
          }
        }
        setSemAgenda(true); // extras: tudo fechado por enquanto
      } catch {
        setSemAgenda(true);
      }
    })();
  }, []);

  return (
    <FundoBarbearia className="pb-24 md:pb-0">
      <Header />

      <main className="container-mobile">
        {/* ── HERO ── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600 via-brand-900 to-brand-950 p-6 text-white md:mt-8 md:grid md:grid-cols-2 md:gap-8 md:p-10"
        >
          <Scissors
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rotate-12 text-white opacity-[0.07]"
          />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              4.9 • +500 cortes
            </p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] tracking-wide md:text-6xl">
              SEU CORTE
              <br />
              PRONTO EM <span className="text-red-500">1 CLIQUE.</span>
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300 md:text-base">
              Escolha o serviço, o dia e a hora. Confirmação na hora pelo WhatsApp.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/agendar" className="flex-1">
                <Button variant="accent" size="lg" className="press w-full">
                  <CalendarCheck />
                  Agendar Agora
                </Button>
              </Link>
              <a href="#servicos" className="flex-1">
                <Button variant="outline" size="lg" className="press w-full">
                  Ver serviços
                </Button>
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Manoel Olavo da Rosa, 1044
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Horários flexíveis
              </span>
            </div>
          </div>

          <div className="relative hidden items-center justify-center md:flex">
            <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Próximo horário livre
              </p>
              {proximo ? (
                <>
                  <p className="font-display mt-1 text-4xl tracking-wide">
                    {proximo.rotulo} • {proximo.hora}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{proximo.vagas} vaga(s) restante(s)</p>
                </>
              ) : semAgenda ? (
                <>
                  <p className="font-display mt-1 text-3xl tracking-wide text-yellow-200">
                    AGENDA FECHADA
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Chama no WhatsApp e vamos combinar</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Consultando agenda…</p>
              )}
              <Link href="/agendar">
                <Button variant="accent" className="mt-3 w-full" size="sm">
                  Reservar <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ── SERVIÇOS ── */}
        <motion.section
          id="servicos"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="mt-8"
        >
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl tracking-wide text-white">SERVIÇOS</h2>
              <p className="text-sm text-slate-400">Preço fixo, sem surpresa</p>
            </div>
            <Link
              href="/agendar"
              className="inline-flex min-h-[44px] items-center text-sm font-bold text-red-400"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {servicos.map((s, i) => (
              <motion.article
                key={s.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="press relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-red-500/50 hover:bg-white/10"
              >
                <NavalhaIcon className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 text-white opacity-[0.05]" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white">{s.nome}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{s.descricao}</p>
                  </div>
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                    {s.duracaoMin} min
                  </span>
                </div>
                <div className="relative mt-3 flex items-center justify-between">
                  <p className="font-display text-3xl tracking-wide text-white">{formatarPreco(s.preco)}</p>
                  <Link href="/agendar">
                    <Button variant="accent" size="sm" aria-label={`Agendar ${s.nome}`}>
                      Agendar
                    </Button>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_DONO}?text=${encodeURIComponent("Fala! Meu corte não está na lista, vamos conversar?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-dashed border-white/20 p-4 transition hover:border-green-400/60 hover:bg-green-500/5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-300">
              <WhatsAppIcon className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">Seu corte não está na lista?</span>
              <span className="block text-xs text-slate-400">Entre em contato e vamos conversar</span>
            </span>
          </a>
        </motion.section>

        {/* ── COMO FUNCIONA ── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8"
        >
          <h2 className="font-display text-center text-3xl tracking-wide text-white">COMO FUNCIONA</h2>
          <ol className="mt-4 grid gap-4 text-center md:grid-cols-3">
            {[
              { n: "1", t: "Escolha o serviço", d: "Corte, barba ou combo" },
              { n: "2", t: "Escolha dia e hora", d: "Só aparece o que está livre" },
              { n: "3", t: "Confirme no WhatsApp", d: "PIX antecipado ou no local" },
            ].map((p) => (
              <li key={p.n} className="flex flex-col items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-lg text-white shadow-glow-red-sm">
                  {p.n}
                </span>
                <p className="mt-2 text-sm font-bold text-white">{p.t}</p>
                <p className="text-xs text-slate-400">{p.d}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* ── FIDELIDADE (só se ativo em Ajustes) ── */}
        {fidelidadeAtiva && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-4 rounded-3xl border-2 border-dashed border-accent/40 bg-red-500/5 p-5 text-center"
          >
            <p className="font-display text-3xl tracking-wide text-red-400">🎁 CORTE GRÁTIS</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-300">
              Junte cortes e ganhe o próximo por nossa conta. Controle automático no agendamento.
            </p>
          </motion.section>
        )}
      </main>

      <footer className="container-mobile mt-8 text-center">
        <p className="font-display text-2xl tracking-wide text-white">BARBEARIA ARAUJO</p>
        <p className="text-xs tracking-widest text-slate-500">ESTILO É ATITUDE</p>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-950/95 p-3 backdrop-blur md:hidden">
        <Link href="/agendar">
          <Button variant="accent" size="lg" className="press w-full" aria-label="Agendar horário agora">
            <CalendarCheck /> Agendar Agora
          </Button>
        </Link>
      </div>
      <BotaoInstalarPWA />
    </FundoBarbearia>
  );
}
