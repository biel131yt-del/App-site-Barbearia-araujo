"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing } from "lucide-react";
import Link from "next/link";

// Aviso simples dentro do app: com o painel aberto, toca um bipe e mostra
// banner a cada agendamento novo. Sem permissão, sem service worker.
export function NotificacoesApp() {
  const conhecidos = useRef<Set<string> | null>(null);
  const [novos, setNovos] = useState<{ id: string; texto: string }[]>([]);

  function bip() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      osc.frequency.value = 880;
      ganho.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        o2.connect(ganho);
        o2.frequency.value = 1174;
        o2.start();
        o2.stop(ctx.currentTime + 0.3);
      }, 300);
    } catch {
      /* sem áudio */
    }
  }

  useEffect(() => {
    async function ver() {
      try {
        const r = await fetch("/api/agendamentos", { cache: "no-store" });
        if (!r.ok) return;
        const lista = (await r.json()) as { id: string; dataISO: string; hora: string; status: string; servico: { nome: string }; cliente: { nome: string } }[];
        const ids = new Set(lista.map((a) => a.id));
        if (conhecidos.current === null) {
          conhecidos.current = ids; // primeira carga: só memoriza
          return;
        }
        const chegando = lista.filter((a) => !conhecidos.current!.has(a.id) && a.status !== "cancelado");
        conhecidos.current = ids;
        if (chegando.length > 0) {
          bip();
          setNovos((atual) => [
            ...chegando.map((a) => ({ id: a.id, texto: `${a.cliente.nome} — ${a.servico.nome} em ${a.dataISO} às ${a.hora}` })),
            ...atual,
          ].slice(0, 3));
        }
      } catch {
        /* offline */
      }
    }
    ver();
    const t = setInterval(ver, 20000); // a cada 20s
    return () => clearInterval(t);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-5">
      <AnimatePresence>
        {novos.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto w-full max-w-sm rounded-2xl border border-green-400/40 bg-brand-900 p-3 shadow-glow-red-sm"
          >
            <Link href="/admin/dashboard" onClick={() => setNovos((a) => a.filter((x) => x.id !== n.id))}>
              <p className="flex items-center gap-1.5 text-sm font-extrabold text-green-300">
                <BellRing className="h-4 w-4" /> Novo agendamento!
              </p>
              <p className="mt-0.5 text-xs text-slate-200">{n.texto}</p>
            </Link>
            <button
              onClick={() => setNovos((a) => a.filter((x) => x.id !== n.id))}
              className="mt-1 min-h-[36px] text-xs font-bold text-slate-400"
              aria-label="Dispensar aviso"
            >
              Dispensar
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
