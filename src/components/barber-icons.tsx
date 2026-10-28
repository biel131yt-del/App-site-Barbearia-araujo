// Ícones de barbearia em SVG (lucide não tem navalha/pente) — stroke atual (currentColor).
export function NavalhaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 17 14.5 5.5a2.1 2.1 0 0 1 3 3L8 19l-5-2Z" />
      <path d="M8 19 5.5 21.5" />
      <circle cx="17.5" cy="6.5" r="1.4" />
      <path d="M13 13l2.5 2.5" />
    </svg>
  );
}

export function PenteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 5h16v4H4z" />
      <path d="M6 9v4M9.5 9v6M13 9v4M16.5 9v6M20 9v4" />
    </svg>
  );
}

// Ícone WhatsApp (balão + fone) — lucide não tem marca oficial.
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3a9 9 0 0 0-7.7 13.9L3 21l4.2-1.2A9 9 0 1 0 12 3Z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M8.8 7.2c.2-.5.5-.5.8-.5.2 0 .5 0 .7.6l1 2.1c.1.3 0 .6-.2.8l-.7.7c.6 1.2 1.6 2.2 2.8 2.8l.7-.7c.2-.2.5-.3.8-.2l2.1 1c.5.3.6.5.6.7 0 .3 0 .6-.5.8-2.8 1.4-8.4-2.3-9.4-6.4-.2-.4-.1-.8.3-1Z"
      />
    </svg>
  );
}

// Ícone de calendário — para cancelar/remarcar agendamento.
export function CalendarioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// Ícone de calendário — para cancelar/remarcar agendamento.
export function CalendarioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// Relógio grande de fundo com ponteiros girando (60s) — tela de horário.
export function RelogioBG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" className={className} aria-hidden>
      <circle cx="100" cy="100" r="92" strokeWidth="6" opacity="0.5" />
      <circle cx="100" cy="100" r="78" strokeWidth="2" opacity="0.3" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={100 + 70 * Math.cos(a)}
            y1={100 + 70 * Math.sin(a)}
            x2={100 + 78 * Math.cos(a)}
            y2={100 + 78 * Math.sin(a)}
            strokeWidth="3"
            opacity="0.4"
          />
        );
      })}
      <g className="animate-spin-lento" style={{ transformOrigin: "100px 100px" }}>
        <line x1="100" y1="100" x2="100" y2="42" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      </g>
      <line x1="100" y1="100" x2="132" y2="100" strokeWidth="7" strokeLinecap="round" opacity="0.7" />
      <circle cx="100" cy="100" r="6" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
