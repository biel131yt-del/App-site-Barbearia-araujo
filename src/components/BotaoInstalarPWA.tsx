"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Botão flutuante "Baixar o App" — aparece quando o navegador permite instalar.
// Some sozinho se o app já estiver instalado (standalone).
export function BotaoInstalarPWA() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalado(true);
      return;
    }
    const aoPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", aoPrompt);
    return () => window.removeEventListener("beforeinstallprompt", aoPrompt);
  }, []);

  if (!evento || instalado) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
      <Button
        variant="outline"
        size="sm"
        className="bg-white shadow-card-hover"
        onClick={async () => {
          await evento.prompt();
          setEvento(null);
        }}
        aria-label="Baixar o aplicativo"
      >
        <Download /> Baixar o App
      </Button>
    </div>
  );
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };
