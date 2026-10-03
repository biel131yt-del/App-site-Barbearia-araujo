"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Etapas do funil — 1 coisa por tela
export const ETAPAS = [
  { n: 1, titulo: "Serviço" },
  { n: 2, titulo: "Data" },
  { n: 3, titulo: "Hora" },
  { n: 4, titulo: "Dados" },
  { n: 5, titulo: "Confirmar" },
];

export function Stepper({ etapa }: { etapa: number }) {
  return (
    <div aria-label="Progresso do agendamento">
      <div className="flex items-center gap-1.5">
        {ETAPAS.map((e) => {
          const ativo = e.n === etapa;
          const feito = e.n < etapa;
          return (
            <div key={e.n} className="flex flex-1 items-center gap-1.5">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-colors",
                    feito && "bg-green-500 text-white",
                    ativo && "bg-accent text-white shadow-glow-red-sm",
                    !feito && !ativo && "bg-white/10 text-slate-400"
                  )}
                >
                  {feito ? <Check className="h-4 w-4" /> : e.n}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    ativo ? "text-white" : "text-slate-500"
                  )}
                >
                  {e.titulo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(etapa / ETAPAS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
