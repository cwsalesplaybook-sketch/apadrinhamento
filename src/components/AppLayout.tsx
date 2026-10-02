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
      <aside className="bg-sidebar text-sidebar-foreground md:w-60 md:min-h-screen md:flex md:flex-col">
        <div className="px-5 py-5">
          <div className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60">Programa de Representantes</div>
          <div className="font-display text-lg font-semibold">Apadrinhamento</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:flex-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.navigate({ to: "/auth" });
          }}
          className="mx-3 mb-4 hidden items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent md:flex"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 px-5 py-8 md:px-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </header>
        {children}
      </main>
    </div>
  );
}
