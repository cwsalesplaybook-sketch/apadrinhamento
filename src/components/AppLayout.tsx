import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChartNoAxesCombined, ChevronDown, ChevronRight, GraduationCap, LogOut, Rocket, User, Users, type LucideProps } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Icone = ComponentType<LucideProps>;

export const NAV = [
  { to: "/capacitacoes", label: "Capacitações e materiais", icon: GraduationCap },
  { to: "/time", label: "Sobre o time", icon: Users },
  { to: "/vaga", label: "Forms da vaga", icon: ChartNoAxesCombined },
  { to: "/onboarding", label: "Onboarding", icon: Rocket },
] as const;

async function sair(navigate: () => void) {
  await supabase.auth.signOut();
  navigate();
}

/** Coroa usada como marca do CW Valhalla. */
export function Coroa({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path fill="currentColor" d="M2.5 7.5l5 4 4.5-7 4.5 7 5-4-1.6 10.5H4.1z" />
      <rect x="4" y="19" width="16" height="2.4" rx="1" fill="currentColor" />
    </svg>
  );
}

function MenuLateral() {
  const router = useRouter();
  return (
    <div className="md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:p-5">
      <aside className="menu-3d relative flex flex-col overflow-visible text-white md:h-full">
        <div className="relative z-10 px-5 pt-6">
          <img src="/brand/logo-cw-eminence.webp" alt="Cardápio Web" className="h-14 drop-shadow-lg" />
          <div className="menu-3d-marca mt-5 rounded-2xl px-4 py-3.5">
            <div className="titulo-h1 flex items-center gap-2 text-xl leading-none">
              CW VALHALLA <Coroa className="h-5 w-5 text-[#ffb600]" />
            </div>
            <p className="mt-1.5 text-xs leading-snug text-white/75">O portal dos representantes valhalla.</p>
          </div>
        </div>
        <nav className="relative z-10 mt-5 flex gap-1 overflow-x-auto px-3 pb-3 md:min-h-0 md:flex-col md:gap-0.5 md:overflow-x-hidden md:overflow-y-auto md:pb-0 [scrollbar-width:none]">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="menu-3d-item group flex items-center gap-4 whitespace-nowrap rounded-2xl px-4 py-2.5 text-[15px] font-bold text-white/85"
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
            src="/brand/cardapinho-viking.webp"
            alt=""
            aria-hidden
            className="pointer-events-none mx-auto hidden w-36 select-none [@media(min-height:820px)]:block drop-shadow-[0_18px_22px_rgba(10,0,30,0.55)]"
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

export function IconeCirculo({ icon: I, className = "" }: { icon: Icone; className?: string }) {
  return (
    <span className={`icone-circulo icone-circulo-roxo flex shrink-0 items-center justify-center rounded-full ${className}`}>
      <I className="h-6 w-6" strokeWidth={2} />
    </span>
  );
}

export function AppLayout({
  title,
  subtitle,
  icon: I,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: Icone;
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
          <MenuUsuario />
        </header>
        <div className="max-w-5xl space-y-6">{children}</div>
      </main>
    </div>
  );
}

/** Bloco de conteúdo com título e ícone, base de todas as abas. */
export function Secao({
  icon,
  titulo,
  descricao,
  children,
}: {
  icon: Icone;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="cartao p-6 sm:p-7">
      <div className="mb-5 flex items-start gap-4">
        <IconeCirculo icon={icon} />
        <div>
          <h2 className="titulo-h1 text-xl text-ink">{titulo}</h2>
          {descricao && <p className="mt-1 text-muted-foreground">{descricao}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Lista com marcador de coroa. */
export function ListaCoroa({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3 text-ink">
          <Coroa className="mt-1 h-4 w-4 shrink-0 text-[#ffb600]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Faixa escura de abertura da aba, com o cardapinho viking. */
export function Destaque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="cartao-escuro relative flex items-center gap-6 overflow-hidden p-6 sm:p-8">
      <div className="relative z-10 flex-1">
        <h2 className="titulo-h1 text-2xl">{titulo}</h2>
        <div className="mt-2 max-w-2xl text-white/85">{children}</div>
      </div>
      <img
        src="/brand/cardapinho-viking.webp"
        alt=""
        aria-hidden
        className="hidden h-36 shrink-0 select-none drop-shadow-[0_18px_22px_rgba(10,0,30,0.55)] sm:block"
      />
    </section>
  );
}
