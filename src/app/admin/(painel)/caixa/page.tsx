"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarReais, hojeISO } from "@/lib/admin";

// Caixa do dono — resumo do dia, fechar caixa, relatório mensal + CSV.
export default function AdminCaixa() {
  const [data, setData] = useState(hojeISO());
  const [resumo, setResumo] = useState<{
    qtd: number;
    totalCentavos: number;
    totalPix: number;
    totalDinheiro: number;
    pendentes: number;
    fechado: boolean;
  } | null>(null);
  const [mes, setMes] = useState(hojeISO().slice(0, 7));
  const [relatorio, setRelatorio] = useState<{
    dias: { dataISO: string; qtd: number; totalCentavos: number; totalPix: number; totalDinheiro: number }[];
    total: { qtd: number; totalCentavos: number; totalPix: number; totalDinheiro: number };
  } | null>(null);
  const [msg, setMsg] = useState("");

  const carregarResumo = useCallback(async () => {
    const r = await fetch(`/api/caixa/resumo?dataISO=${data}`);
    if (r.ok) setResumo(await r.json());
  }, [data]);

  const carregarMes = useCallback(async () => {
    const r = await fetch(`/api/caixa/fechar?mes=${mes}`);
    if (r.ok) setRelatorio(await r.json());
  }, [mes]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);
  useEffect(() => {
    carregarMes();
  }, [carregarMes]);

  async function fechar() {
    if (!window.confirm(`Fechar o caixa de ${data}?`)) return;
    const r = await fetch("/api/caixa/fechar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataISO: data }),
    });
    if (r.ok) {
      setMsg(`Caixa de ${data} fechado.`);
      carregarResumo();
      carregarMes();
    }
  }

  function exportarCSV() {
    if (!relatorio) return;
    const linhas = [
      "data;qtd;total;pix;dinheiro",
      ...relatorio.dias.map((d) =>
        [d.dataISO, d.qtd, (d.totalCentavos / 100).toFixed(2), (d.totalPix / 100).toFixed(2), (d.totalDinheiro / 100).toFixed(2)].join(";")
      ),
      ["TOTAL", relatorio.total.qtd, (relatorio.total.totalCentavos / 100).toFixed(2)].join(";"),
    ];
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `caixa-${mes}.csv`;
    a.click();
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-white">CAIXA</h1>
      <p className="text-sm text-slate-400">Fechamento do dia e relatório mensal</p>
      {msg && <p className="mt-3 rounded-xl bg-green-500/15 p-3 text-sm font-semibold text-green-300">{msg}</p>}

      <div className="mt-4 max-w-xs">
        <Input rotulo="Dia" type="date" name="dia" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      {resumo && (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Mini titulo="Atendimentos" valor={String(resumo.qtd)} />
          <Mini titulo="Total" valor={formatarReais(resumo.totalCentavos)} />
          <Mini titulo="PIX" valor={formatarReais(resumo.totalPix)} />
          <Mini titulo="Dinheiro" valor={formatarReais(resumo.totalDinheiro)} />
        </div>
      )}
      {resumo && resumo.pendentes > 0 && (
        <p className="mt-2 text-xs font-bold text-yellow-300">
          ⚠️ {resumo.pendentes} pagamento(s) pendente(s) neste dia
        </p>
      )}

      <Button variant="accent" size="lg" onClick={fechar} className="mt-4 w-full md:w-auto">
        <Lock /> Fechar Caixa do Dia {resumo?.fechado ? "(já fechado — atualiza)" : ""}
      </Button>

      <section className="mt-6">
        <h2 className="font-display text-2xl tracking-wide text-white">RELATÓRIO MENSAL</h2>
        <div className="mt-2 flex max-w-xs items-end gap-2">
          <div className="flex-1">
            <Input rotulo="Mês" type="month" name="mes" value={mes} onChange={(e) => setMes(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={exportarCSV} aria-label="Exportar CSV">
            <Download /> CSV
          </Button>
        </div>
        {relatorio && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
            <p className="text-sm">
              <strong>{relatorio.total.qtd}</strong> atendimentos •{" "}
              <strong>{formatarReais(relatorio.total.totalCentavos)}</strong>
            </p>
            <ul className="mt-2 grid gap-1 text-sm text-slate-400">
              {relatorio.dias.map((d) => (
                <li key={d.dataISO} className="flex justify-between border-b border-white/5 py-1">
                  <span>{d.dataISO}</span>
                  <span>
                    {d.qtd} • {formatarReais(d.totalCentavos)}
                  </span>
                </li>
              ))}
              {relatorio.dias.length === 0 && <li>Nenhum fechamento neste mês.</li>}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{titulo}</p>
      <p className="font-display mt-1 text-3xl tracking-wide text-white">{valor}</p>
    </div>
  );
}
