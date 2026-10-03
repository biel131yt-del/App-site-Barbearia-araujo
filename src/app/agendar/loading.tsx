// Skeleton do agendamento
export default function Loading() {
  return (
    <div className="bg-barber min-h-screen bg-brand-950">
      <div className="container-mobile animate-pulse py-4">
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="mt-4 h-9 w-40 rounded-lg bg-white/10" />
        <div className="mt-3 grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
