// Skeleton do painel (troca o spinner — carrega com cara de conteúdo)
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-white/10" />
      <div className="mt-1 h-4 w-64 rounded bg-white/5" />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
      <div className="mt-6 h-6 w-32 rounded bg-white/10" />
      <div className="mt-2 grid gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
    </div>
  );
}
