import type { ComponentType, ReactNode } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { Clock3, Lock, type LucideProps } from "lucide-react";
import { useDados } from "@/lib/trilha";

type Icone = ComponentType<LucideProps>;

export const NAV = [
  { to: "/", label: "Início" },
  { to: "/jornada", label: "Jornada e ABC" },
  { to: "/niveis", label: "Níveis" },
  { to: "/estrelas", label: "Estrelas" },
  { to: "/cronograma", label: "Cronograma" },
  { to: "/planejamento", label: "Planejamento" },
  { to: "/trilha", label: "Trilha da aceleração" },
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
    <Link to="/" className="flex items-center gap-3">
      <span className="logo-tile h-10 w-10 shrink-0">
        <Coroa className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="titulo block text-[17px] font-semibold">Cardápio Web</span>
        <span className="block text-[10px] font-bold tracking-[0.25em] text-suave">REPRESENTANTES</span>
      </span>
    </Link>
  );
}

function ultimaAtualizacao(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function Layout() {
  const { data } = useDados();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-borda bg-fundo/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Marca />
          <nav className="sem-barra -mx-1 flex flex-1 gap-1 overflow-x-auto px-1 lg:justify-end">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-item ${item.to === "/trilha" ? "text-dourado" : ""}`}
                activeProps={{ className: "nav-ativo" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-borda bg-black/20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <Marca />
            <p className="mt-4 font-semibold text-dourado">Grandes representantes constroem grandes histórias.</p>
          </div>
          <div>
            <p className="sobretitulo !text-suave">Documento</p>
            <p className="mt-3 text-sm text-suave">Jornada do Representante · versão 1.0 · Em validação</p>
            <p className="mt-1 text-sm text-suave">Setor de Representantes</p>
          </div>
          <div>
            <p className="sobretitulo !text-suave">Uso interno</p>
            <p className="mt-3 text-sm text-suave">
              Material de apoio ao time de representantes da Cardápio Web. Os cargos citados são títulos do programa, não cargos da empresa.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-suave">
              <Clock3 className="h-4 w-4 text-roxo-claro" /> Última atualização: {ultimaAtualizacao(data?.atualizadoEm)}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- blocos das páginas ---------- */

export function CabecalhoPagina({ sobre, titulo, children }: { sobre: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-10">
      <p className="sobretitulo">{sobre}</p>
      <h1 className="titulo-ouro mt-3 text-4xl sm:text-5xl">{titulo}</h1>
      {children && <div className="mt-4 max-w-3xl text-[17px] leading-relaxed text-suave">{children}</div>}
    </div>
  );
}

export function Secao({ titulo, descricao, selo, children }: { titulo: string; descricao?: string; selo?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
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
          <span className="icone-tile h-9 w-9 shrink-0">
            <I className="h-[18px] w-[18px]" />
          </span>
        )}
        <h3 className="text-[17px] leading-snug">{titulo}</h3>
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
          <span className="titulo text-3xl font-semibold text-roxo">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 className="text-[17px] leading-snug">{titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-suave">{texto}</p>
          </div>
        </div>
      ))}
    </Grade>
  );
}
