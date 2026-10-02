import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Database,
  History,
  LayoutGrid,
  LogOut,
  User,
  Users,
  type LucideProps,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { diasDesde, type Dupla } from "@/lib/apadrinhamento";

type Icone = ComponentType<LucideProps>;

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutGrid },
  { to: "/duplas", label: "Duplas", icon: Users },
  { to: "/weeklies", label: "Weeklies", icon: CalendarPlus },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/base", label: "Base geral", icon: Database },
] as const;

async function sair(navigate: () => void) {
  await supabase.auth.signOut();
  navigate();
}

function MenuLateral() {
  const router = useRouter();
  return (
    <div className="md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:p-5">
      <aside className="menu-3d relative flex flex-col overflow-visible text-white md:h-full">
        <div className="relative z-10 px-5 pt-6">
          <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="h-14 drop-shadow-lg" />
          <div className="menu-3d-marca mt-5 rounded-2xl px-4 py-3.5">
            <div className="titulo-h1 text-xl leading-none">RADAR DOS REPS</div>
            <p className="mt-1.5 text-xs leading-snug text-white/75">Visão completa da jornada dos representantes.</p>
          </div>
        </div>
        <nav className="relative z-10 mt-5 flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-2 md:overflow-visible md:pb-0">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="menu-3d-item group flex items-center gap-4 whitespace-nowrap rounded-2xl px-4 py-3 text-[15px] font-bold text-white/85"
              activeProps={{ className: "menu-3d-ativo text-white" }}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-6 w-6 shrink-0" strokeWidth={1.9} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="hidden h-7 w-7 items-center justify-center rounded-full bg-white/20 md:flex">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>
        <div className="relative z-10 mt-auto hidden md:block">
          <img
            src="/brand/cardapinho-mesa.webp"
            alt=""
            aria-hidden
            className="pointer-events-none mx-auto w-56 select-none drop-shadow-[0_18px_22px_rgba(10,0,30,0.55)]"
          />
          <button
            onClick={() => sair(() => router.navigate({ to: "/auth" }))}
            className="flex w-full items-center gap-4 px-7 pb-7 pt-4 text-[15px] font-bold text-white/80 hover:text-white"
          >
            <LogOut className="h-6 w-6" strokeWidth={1.9} /> Sair
          </button>
        </div>
      </aside>
    </div>
  );
}

function useFora(aberto: boolean, fechar: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && fechar();
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [aberto, fechar]);
  return ref;
}

function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const ref = useFora(aberto, () => setAberto(false));
  const { data: duplas = [] } = useQuery({
    queryKey: ["duplas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("duplas").select("*").order("data_inicio");
      if (error) throw error;
      return data as Dupla[];
    },
  });
  const alertas = duplas
    .filter((d) => d.status !== "encerrado")
    .flatMap((d) => {
      const dia = diasDesde(d.data_inicio);
      if (dia === 15 || dia === 30) return [{ id: d.id, texto: `${d.afilhado} está no checkpoint D${dia}` }];
      if (dia > 30 && !d.venda_originada) return [{ id: d.id, texto: `${d.afilhado} passou do D30 sem venda originada` }];
      return [];
    });
  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Notificações"
        onClick={() => setAberto(!aberto)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-white"
      >
        <Bell className="h-6 w-6" strokeWidth={1.9} />
        {alertas.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
      </button>
      {aberto && (
        <div className="cartao absolute right-0 z-40 mt-2 w-80 p-4">
          <div className="text-sm font-black text-ink">Notificações</div>
          {alertas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhum alerta no momento.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {alertas.map((a) => (
                <li key={a.id} className="rounded-xl bg-accent px-3 py-2 text-sm">
                  {a.texto}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MenuUsuario() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const ref = useFora(aberto, () => setAberto(false));
  const { data: email } = useQuery({
    queryKey: ["usuario"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.email ?? "",
  });
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setAberto(!aberto)} className="flex items-center gap-1.5" aria-label="Conta">
        <span className="avatar-3d flex h-11 w-11 items-center justify-center rounded-full text-white">
          <User className="h-5 w-5" />
        </span>
        <ChevronDown className="h-4 w-4 text-ink" />
      </button>
      {aberto && (
        <div className="cartao absolute right-0 z-40 mt-2 w-64 p-2">
          <div className="truncate px-3 py-2 text-sm text-muted-foreground">{email}</div>
          <button
            onClick={() => sair(() => router.navigate({ to: "/auth" }))}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function IconeCirculo({ icon: I, cor = "roxo", className = "" }: { icon: Icone; cor?: "roxo" | "verde"; className?: string }) {
  return (
    <span className={`icone-circulo icone-circulo-${cor} flex shrink-0 items-center justify-center rounded-full ${className}`}>
      <I className="h-6 w-6" strokeWidth={2} />
    </span>
  );
}

export function AppLayout({
  title,
  subtitle,
  icon: I,
  filtros,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: Icone;
  filtros?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fundo-app min-h-screen md:flex">
      <MenuLateral />
      <main className="relative z-10 min-w-0 flex-1 px-5 py-7 md:py-8 md:pl-4 md:pr-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="tile-3d flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white">
              <I className="h-8 w-8" strokeWidth={1.9} />
            </span>
            <div>
              <h1 className="titulo-h1 text-[34px] leading-none text-ink">{title}</h1>
              {subtitle && <p className="mt-1.5 text-[17px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {filtros}
            {actions}
            <Notificacoes />
            <MenuUsuario />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function Vazio({ imagem, children }: { imagem: string; children: ReactNode }) {
  return (
    <div className="cartao flex flex-col items-center p-10 text-center">
      <img src={imagem} alt="" aria-hidden className="mb-4 h-36 select-none" />
      {children}
    </div>
  );
}
