"use client";

import { useRef } from "react";
import Link from "next/link";
import { CalendarDays, LayoutDashboard, Settings, Users, Wallet, Tags, type LucideIcon } from "lucide-react";
import { BotaoSair } from "@/components/BotaoSair";

// Mapa nome → ícone (fica no cliente, pois função não atravessa servidor→cliente)
const ICONES: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  agenda: CalendarDays,
  clientes: Users,
  caixa: Wallet,
  servicos: Tags,
  equipe: Users,
  ajustes: Settings,
};

// Menu inferior do painel — rola com o dedo (celular) e arrastando com o mouse (PC).
export function NavMobile({ itens }: { itens: readonly { href: string; rotulo: string; icone: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const arrasto = useRef({ ativo: false, inicioX: 0, scroll: 0 });

  function comecar(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    arrasto.current = { ativo: true, inicioX: e.clientX, scroll: el.scrollLeft };
  }
  function mover(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || !arrasto.current.ativo) return;
    el.scrollLeft = arrasto.current.scroll - (e.clientX - arrasto.current.inicioX);
  }
  function terminar() {
    arrasto.current.ativo = false;
  }

  return (
    <nav
      aria-label="Navegação do painel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-950/95 backdrop-blur md:hidden"
    >
      <div
        ref={ref}
        onPointerDown={comecar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerLeave={terminar}
        className="no-scrollbar relative flex cursor-grab touch-pan-x items-stretch justify-start overflow-x-auto active:cursor-grabbing"
      >
        {itens.map((i) => {
          const Icone = ICONES[i.icone] ?? LayoutDashboard;
          return (
            <Link
              key={i.href}
              href={i.href}
              draggable={false}
              className="flex min-h-[60px] min-w-[68px] flex-1 select-none flex-col items-center justify-center gap-0.5 px-1.5 text-[11px] font-bold text-slate-200"
            >
              <Icone className="pointer-events-none h-5 w-5" /> {i.rotulo}
            </Link>
          );
        })}
        <BotaoSair mobile />
        <span aria-hidden className="pointer-events-none sticky right-0 flex w-8 shrink-0 items-center justify-center bg-gradient-to-l from-brand-950 to-transparent text-slate-400">
          ›
        </span>
      </div>
    </nav>
  );
}
