import Link from "next/link";
import { getServerSession } from "next-auth";
import { CalendarDays, LayoutDashboard, Settings, Users, Wallet, Tags, Scissors, type LucideIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { podeAcessar } from "@/lib/permissoes";
import { BotaoSair } from "@/components/BotaoSair";
import { NavMobile } from "@/components/NavMobile";
import { NotificacoesApp } from "@/components/NotificacoesApp";
import { Logo } from "@/components/marca";

// Painel do dono — fundo escuro, sidebar fixa (PC) / bottom nav (mobile).
// Destaque azul royal; vermelho só em ação crítica. Nav filtrada pelo papel.
const ICONES: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  agenda: CalendarDays,
  clientes: Users,
  caixa: Wallet,
  servicos: Tags,
  equipe: Users,
  ajustes: Settings,
};

const ITENS = [
  { href: "/admin/dashboard", rotulo: "Início", icone: "dashboard" },
  { href: "/admin/agenda", rotulo: "Agenda", icone: "agenda" },
  { href: "/admin/clientes", rotulo: "Clientes", icone: "clientes" },
  { href: "/admin/caixa", rotulo: "Caixa", icone: "caixa" },
  { href: "/admin/servicos", rotulo: "Serviços", icone: "servicos" },
  { href: "/admin/equipe", rotulo: "Equipe", icone: "equipe" },
  { href: "/admin/config", rotulo: "Ajustes", icone: "ajustes" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sess = await getServerSession(authOptions);
  const papel = (sess?.user as { papel?: string } | undefined)?.papel;
  const nome = sess?.user?.name ?? "Admin";
  const visiveis = ITENS.filter((i) => podeAcessar(papel, i.href));

  return (
    <div className="bg-barber min-h-screen bg-brand-950 text-slate-100 md:flex">
      {/* Sidebar — só PC */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-brand-900/80 p-4 md:flex">
        <Link href="/" className="rounded-xl p-2">
          <Logo />
        </Link>
        <p className="mt-1 px-2 text-xs text-slate-400">
          Olá, <strong className="text-white">{nome}</strong>
        </p>
        <nav className="mt-4 grid gap-1 text-sm font-bold">
          {visiveis.map((i) => {
            const Icone = ICONES[i.icone];
            return (
              <Link
                key={i.href}
                href={i.href}
                className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-slate-200 hover:bg-brand-600"
              >
                <Icone className="h-5 w-5" /> {i.rotulo}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <BotaoSair />
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 pb-24 md:pb-0">
        <NotificacoesApp />
        <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-950/90 backdrop-blur md:hidden">
          <div className="container-mobile flex h-14 items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <Scissors className="h-4 w-4" /> {nome}
            </span>
          </div>
        </header>
        <main className="container-mobile py-4 md:max-w-4xl md:py-8">{children}</main>
      </div>

      {/* Bottom nav — só mobile (componente com arrasto mouse + dedo) */}
      <NavMobile itens={visiveis} />
    </div>
  );
}
