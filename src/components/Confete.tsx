"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// Chuva de confete leve ao confirmar (12 peças, sai sozinha)
export function Confete() {
  const pecas = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        x: (i - 8) * 22 + Math.random() * 10,
        delay: Math.random() * 0.15,
        cor: ["#DC2626", "#FFFFFF", "#1E3A8A", "#FBBF24"][i % 4],
        gira: Math.random() * 360,
      })),
    []
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center">
      {pecas.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: 220, rotate: p.gira, scale: 0.6 }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          className="absolute h-2.5 w-2.5 rounded-sm"
          style={{ background: p.cor }}
        />
      ))}
    </div>
  );
}
