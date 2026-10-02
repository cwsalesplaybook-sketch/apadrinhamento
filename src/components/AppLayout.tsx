import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { CalendarCheck, Database, LayoutDashboard, LogOut, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/duplas", label: "Duplas", icon: Users },
  { to: "/weeklies", label: "Weeklies", icon: CalendarCheck },
  { to: "/base", label: "Base geral", icon: Database },
] as const;

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div>
      <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className={compacta ? "h-10" : "h-14"} />
      <div className={`titulo-h1 mt-3 leading-none text-sidebar-foreground ${compacta ? "text-lg" : "text-2xl"}`}>
        RADAR DOS REPS
      </div>
    </div>
  );
}

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen md:flex">
      <aside className="relative bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:overflow-hidden">
        <div className="px-5 pb-4 pt-6">
          <Marca />
          <p className="titulo-h2 mt-3 text-xs text-sidebar-foreground/70">
            Visão completa da jornada dos representantes.
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold text-sidebar-foreground/80 hover:bg-sidebar-accent"
              activeProps={{
                className: "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary",
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden md:block">
          <img
            src="/brand/cardapinho-mesa.webp"
            alt=""
            aria-hidden
            className="pointer-events-none mx-auto -mb-2 w-52 select-none"
          />
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.navigate({ to: "/auth" });
            }}
            className="flex w-full items-center gap-3 border-t border-sidebar-border px-6 py-4 text-sm font-bold text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="titulo-h1 text-3xl text-ink">{title}</h1>
            {subtitle && <p className="titulo-h2 mt-1 text-primary">{subtitle}</p>}
          </div>
          {actions}
        </header>
        {children}
      </main>
    </div>
  );
}

export function Vazio({ imagem, children }: { imagem: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-card p-10 text-center">
      <img src={imagem} alt="" aria-hidden className="mb-4 h-36 select-none" />
      {children}
    </div>
  );
}
