"use client";

import { useEffect, useState } from "react";
import { MENSAGEM_PADRAO, aplicarModelo } from "@/lib/whatsapp";

// Lê o modelo de mensagem do dono (Ajustes) uma vez e aplica as variáveis.
// Uso: const msg = useMensagemWhats({ nome, servico, data, hora });
export function useMensagemWhats(vars: Record<string, string>) {
  const [modelo, setModelo] = useState(MENSAGEM_PADRAO);
  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.mensagemWhats) setModelo(j.mensagemWhats);
      })
      .catch(() => null);
  }, []);
  return aplicarModelo(modelo, vars);
}
