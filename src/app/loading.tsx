"use client";

import { Scissors } from "lucide-react";

// Splash inicial — tesoura abrindo/fechando + marca
export default function Loading() {
  return (
    <div className="bg-barber flex min-h-screen flex-col items-center justify-center bg-brand-950">
      <span className="flex h-20 w-20 animate-tesoura items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-glow-red">
        <Scissors className="h-10 w-10" />
      </span>
      <p className="font-display mt-4 text-4xl tracking-wide text-white">BARBEARIA ARAUJO</p>
      <p className="mt-1 text-xs tracking-widest text-slate-500">ESTILO É ATITUDE</p>
    </div>
  );
}
