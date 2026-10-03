import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

// Fundo padrão barbearia: azul profundo + padrão de tesoura + vinheta.
export function FundoBarbearia({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-barber min-h-screen bg-brand-950 text-slate-100", className)}>
      {children}
    </div>
  );
}

// Logo reutilizável (cliente + admin + loading)
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-glow-red-sm"
      >
        <Scissors className="h-5 w-5" />
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-xl tracking-wide text-white">BARBEARIA ARAUJO</p>
          <p className="text-[11px] font-medium tracking-widest text-slate-400">ESTILO É ATITUDE</p>
        </div>
      )}
    </div>
  );
}
