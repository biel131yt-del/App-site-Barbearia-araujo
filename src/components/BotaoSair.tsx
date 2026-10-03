"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

// Sair do painel (mobile e PC)
export function BotaoSair({ mobile }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-bold text-slate-300"
        aria-label="Sair do painel"
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    );
  }
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-bold text-blue-200 hover:bg-white/10"
    >
      <LogOut className="h-5 w-5" /> Sair
    </button>
  );
}
