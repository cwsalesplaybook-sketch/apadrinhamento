import type { ComponentType, ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  House,
  Lock,
  Map as Mapa,
  Rocket,
  Star,
  Trophy,
  User,
  type LucideProps,
} from "lucide-react";
import { contatos, useDados } from "@/lib/trilha";

type Icone = ComponentType<LucideProps>;

export const NAV = [
  { to: "/", label: "Visão geral", icon: House },
  { to: "/jornada", label: "Jornada e ABC", icon: Mapa },
  { to: "/niveis", label: "Níveis e benefícios", icon: Trophy },
  { to: "/estrelas", label: "Representantes Estrelas", icon: Star },
  { to: "/cronograma", label: "Cronograma", icon: CalendarDays },
  { to: "/planejamento", label: "Planejamento", icon: BarChart3 },
  { to: "/trilha", label: "Aceleração de vendas", icon: Rocket },
] as const;

/** Coroa da marca Representantes. */
export function Coroa({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-1.8 10H4.8z" />
    </svg>
  );
}

function Marca() {
  return (
    <Link to="/" className="flex items-center gap-3 text-white">
      <span className="logo-tile h-12 w-12 shrink-0">
        <Coroa className="h-6 w-6" />
      </span>
      <span className="leading-tight">
        <span className="titulo block text-xl">Cardápio Web</span>
        <span className="block text-[11px] font-bold tracking-[0.28em] text-white/75">REPRESENTANTES</span>
      </span>
    </Link>
  );
}

function MenuLateral() {
  return (
    <aside className="menu-lateral text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[268px] lg:flex-col">
      <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:pt-7">
        <Marca />
      </div>
      <nav className="sem-barra flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-6 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-4">
        {NAV.map(({ to, label, icon: I }) => (
          <Link key={to} to={to} className="menu-item" activeProps={{ className: "menu-ativo" }} activeOptions={{ exact: to === "/" }}>
            <I className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden p-5 lg:block">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-6">
          <Coroa className="h-8 w-8 text-amarelo" />
          <p className="mao mt-2 text-[34px] leading-[0.95] text-white">
            Grandes
            <br />
            Representantes
            <br />
            Constroem
            <br />
            Grandes
            <br />
            Histórias.
          </p>
          <span className="mt-2 block h-1 w-20 -rotate-6 rounded-full bg-amarelo" />
        </div>
      </div>
    </aside>
  );
}

function Topo() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const atual = NAV.find((n) => n.to === caminho) ?? NAV[0];
  const { data } = useDados();
  // Sino: follows atrasados ou para hoje.
  const pendentes = data
    ? contatos(data.tabelas.abc, data.tabelas.frente).filter((c) => c.diasAteProximo != null && c.diasAteProximo <= 0).length
    : 0;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borda pb-4">
      <nav className="flex items-center gap-2 text-sm text-suave">
        <span className="hidden sm:inline">Programa de Representantes</span>
        <ChevronRight className="hidden h-4 w-4 sm:block" />
        <span className="border-b-2 border-roxo pb-0.5 font-bold text-texto">{atual.label}</span>
      </nav>
      <div className="flex items-center gap-4">
        <Link to="/" className="relative rounded-full p-2 text-suave hover:bg-lavanda" title={`${pendentes} follow(s) para hoje ou atrasados`}>
          <Bell className="h-5 w-5" />
          {pendentes > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vermelho px-1 text-[10px] font-black text-white">
              {pendentes}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#a35cff] to-roxo text-white">
            <User className="h-4 w-4" />
          </span>
          <span className="hidden text-sm font-bold sm:inline">Olá, Representante!</span>
          <ChevronDown className="hidden h-4 w-4 text-suave sm:block" />
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen lg:pl-[268px]">
      <MenuLateral />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-8 lg:py-7">
        <Topo />
        <div className="pt-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* ---------- blocos das páginas ---------- */

export function CabecalhoPagina({ sobre, titulo, children }: { sobre: string; titulo: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <p className="sobretitulo">{sobre}</p>
      <h1 className="titulo-ouro mt-2 text-4xl sm:text-[46px] sm:leading-[1.05]">{titulo}</h1>
      {children && <div className="mt-3 max-w-3xl text-lg leading-relaxed text-suave">{children}</div>}
    </div>
  );
}

export function Secao({ titulo, descricao, selo, children }: { titulo: string; descricao?: string; selo?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl sm:text-[28px]">{titulo}</h2>
        {selo && <span className="pilula pilula-ouro">{selo}</span>}
      </div>
      {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Cartão de texto simples (título + parágrafo), com selo INTERNO opcional. */
export function Cartao({ titulo, children, interno, icon: I }: { titulo: string; children?: ReactNode; interno?: boolean; icon?: Icone }) {
  return (
    <div className="cartao flex flex-col p-5">
      <div className="flex items-start gap-3">
        {I && (
          <span className="icone-tile h-10 w-10 shrink-0">
            <I className="h-5 w-5" />
          </span>
        )}
        <h3 className="pt-1 text-[17px] leading-snug">{titulo}</h3>
      </div>
      {children && <div className="mt-2 text-sm leading-relaxed text-suave">{children}</div>}
      {interno && (
        <span className="pilula pilula-ouro mt-4 self-start">
          <Lock className="h-3 w-3" /> INTERNO
        </span>
      )}
    </div>
  );
}

export function Grade({ children, colunas = 3 }: { children: ReactNode; colunas?: 2 | 3 }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${colunas === 3 ? "lg:grid-cols-3" : ""}`}>{children}</div>;
}

/** Fluxo numerado 01–06 da jornada. */
export const FLUXO = [
  ["Entrada no Programa de Aceleração", "O representante entra no programa e começa a jornada como Cadastrado."],
  ["ABC por 1 mês", "O primeiro mês é dedicado ao ABC (Escola Técnica de Aceleração de Vendas), com a Gabi."],
  ["Capacitação prática e acompanhamento", "Capacitação enxuta e aplicada, com foco em vendas e acompanhamento próximo."],
  ["Ativação do 1º cliente", "A primeira ativação é o marco que destrava a entrada definitiva no programa."],
  ["Assinatura do contrato", "O contrato é apresentado e assinado somente após a 1ª ativação, em etapa conduzida pela Gabi."],
  ["Próximo nível da jornada", "Com o contrato assinado, o representante avança para o próximo nível da trilha."],
];

export function Fluxo() {
  return (
    <Grade>
      {FLUXO.map(([titulo, texto], i) => (
        <div key={titulo} className="cartao flex gap-4 p-5">
          <span className="titulo text-3xl text-roxo">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 className="text-[17px] leading-snug">{titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-suave">{texto}</p>
          </div>
        </div>
      ))}
    </Grade>
  );
}
