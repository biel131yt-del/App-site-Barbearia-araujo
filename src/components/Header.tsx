"use client";

import { Logo } from "@/components/marca";
import { WhatsAppIcon } from "@/components/barber-icons";
import { WHATSAPP_DONO, EMPRESA } from "@/lib/config";

// Cabeçalho fixo — tema barbearia escuro
export function Header() {
  const linkWhats = `https://wa.me/${WHATSAPP_DONO}?text=${encodeURIComponent(`Quero agendar um horário na ${EMPRESA.nome}`)}`;
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-950/90 backdrop-blur">
      <div className="container-mobile flex h-16 items-center justify-between">
        <Logo />
        <a
          href={linkWhats}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="press flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white shadow-card transition hover:bg-green-600"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      </div>
    </header>
  );
}
