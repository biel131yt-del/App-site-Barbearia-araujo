"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Star, CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { FundoBarbearia } from "@/components/marca";
import { cn } from "@/lib/utils";

export default function AvaliarPage({ params }: { params: { id: string } }) {
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setNota(0);
    setComentario("");
    setSucesso(false);
    setErro("");
  }, [params.id]);

  async function enviarAvaliacao() {
    if (nota < 1 || nota > 5) return setErro("Escolha uma nota de 1 a 5 estrelas.");
    setEnviando(true);
    setErro("");
    try {
      const r = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendamentoId: params.id,
          nota,
          comentario: comentario.trim() || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.erro ?? "Falha ao enviar avaliação");
      setSucesso(true);
    } catch {
      setErro("Falha ao enviar avaliação. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <FundoBarbearia className="pb-28 md:pb-10">
        <Header />
        <main className="container-mobile mt-4 md:mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar ao início
          </Link>
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-400" />
            <h1 className="font-display mt-2 text-3xl tracking-wide text-white">OBRIGADO! ⭐</h1>
            <p className="mt-1 text-sm text-slate-300">
              Sua avaliação ajudou a Barbearia Araujo a melhorar.
            </p>
            <Button variant="accent" asChild className="mt-4 w-full press" size="lg">
              <Link href="/">Agendar outro horário</Link>
            </Button>
          </section>
        </main>
      </FundoBarbearia>
    );
  }

  return (
    <FundoBarbearia className="pb-28 md:pb-10">
      <Header />
      <main className="container-mobile mt-4 md:mt-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 mb-4">
          <ChevronLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h1 className="font-display text-3xl tracking-wide text-white">AVALIE SEU CORTE</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quanto você deu de nota pro atendimento?
          </p>

          {erro && (
            <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-300">
              {erro}
            </p>
          )}

          <div className="mt-5 flex justify-center gap-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                onClick={() => setNota(n)}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                  nota >= n
                    ? "bg-amber-400 text-white shadow-glow-red-sm"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Star className={`h-6 w-6 ${nota >= n ? "fill-amber-400" : ""}`} />
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-400 text-center">
            {nota === 0 ? "Toque nas estrelas para avaliar" : `Você avaliou com ${nota} estrela${nota > 1 ? "s" : ""}`}
          </p>

          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-bold text-slate-200">
              Comentário (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="O que você achou do atendimento?"
              rows={3}
              className="w-full rounded-xl border-2 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-accent focus:ring-accent/30"
            />
          </div>

          <Button
            variant="accent"
            onClick={enviarAvaliacao}
            disabled={enviando || nota === 0}
            className="mt-4 w-full press"
            size="lg"
          >
            {enviando ? "Enviando…" : <><Send className="h-4 w-4 mr-2" /> Enviar avaliação</>}
          </Button>
        </section>
      </main>
    </FundoBarbearia>
  );
}
