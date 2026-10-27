import { Link } from "@tanstack/react-router";
import { CalendarDays, Crown, FileText, Layers, Route, ShieldAlert, Sparkles } from "lucide-react";
import { Fluxo, Secao } from "@/components/Layout";

const EXPLORAR = [
  { to: "/jornada", titulo: "Jornada e ABC", texto: "O fluxo em 6 etapas e o mês de aceleração.", icon: Sparkles },
  { to: "/niveis", titulo: "Níveis", texto: "Os 10 níveis, o que liberam e o que concedem.", icon: Layers },
  { to: "/estrelas", titulo: "Estrelas", texto: "Valhalla, conselho, voz ativa e assistente de IA.", icon: Crown },
  { to: "/cronograma", titulo: "Cronograma", texto: "Datas, marcos e próximos passos do time.", icon: CalendarDays },
  { to: "/planejamento", titulo: "Planejamento", texto: "Notas internas ainda em validação.", icon: FileText },
  { to: "/trilha", titulo: "Trilha da aceleração de vendas", texto: "Reps no ABC, 1:1s, cursos, cadência e templates.", icon: Route },
] as const;

export function InicioPage() {
  return (
    <>
      <section className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="sobretitulo">Cardápio Web · Setor de Representantes</p>
          <h1 className="titulo-ouro mt-3 text-4xl sm:text-5xl">Trilha do Representante</h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-suave">
            Organizar a jornada do representante como uma trilha de níveis, deixando claro em que nível ele está, qual é o próximo passo e o
            que precisa fazer para avançar. O foco da jornada é vender e ativar clientes: a capacitação existe para apoiar as vendas, não para
            virar uma trilha de certificação.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="pilula pilula-roxa">Versão 1.0</span>
            <span className="pilula">22/10/2026</span>
            <span className="pilula pilula-ouro">Em validação</span>
            <span className="pilula">Setor de Representantes — Channel Acquisition</span>
          </div>
        </div>
        <img
          src="/brand/viking-quadro.webp"
          alt="Mascote da Cardápio Web, um viking com espada e escudo"
          className="mx-auto w-56 rounded-3xl border border-borda shadow-2xl sm:w-64 md:w-72"
        />
      </section>

      <div className="alerta-ouro mt-10 flex gap-4 p-5">
        <span className="icone-tile h-10 w-10 shrink-0 !bg-laranja/15 !text-dourado">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg">Regra principal da jornada</h2>
          <p className="mt-1 text-sm text-suave">
            O contrato só é assinado se o representante ativar o primeiro cliente. A conclusão do ABC, sozinha, não garante a entrada
            definitiva no programa.
          </p>
        </div>
      </div>

      <Secao titulo="A trilha completa">
        <img
          src="/brand/trilha-do-representante.webp"
          alt="Arte da Trilha do Representante da Cardápio Web"
          className="w-full rounded-2xl border border-borda"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["10", "níveis na trilha, do cadastro até o topo"],
            ["1.000+ clientes", "clientes ativos no nível mais alto (VP de Expansão)"],
            ["1 mês", "de ABC com a Gabi para chegar à primeira ativação"],
          ].map(([n, t]) => (
            <div key={n} className="cartao p-5">
              <p className="titulo text-3xl text-dourado">{n}</p>
              <p className="mt-1 text-sm text-suave">{t}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Explore o playbook">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORAR.map(({ to, titulo, texto, icon: I }) => (
            <Link key={to} to={to} className={`cartao cartao-link flex gap-4 p-5 ${to === "/trilha" ? "!border-laranja/40" : ""}`}>
              <span className={`icone-tile h-10 w-10 shrink-0 ${to === "/trilha" ? "!bg-laranja/15 !text-dourado" : ""}`}>
                <I className="h-5 w-5" />
              </span>
              <span>
                <span className="titulo block text-[17px]">{titulo}</span>
                <span className="mt-1 block text-sm text-suave">{texto}</span>
              </span>
            </Link>
          ))}
        </div>
      </Secao>

      <Secao titulo="Fluxo da jornada" descricao="Do primeiro dia no programa até o próximo nível da trilha.">
        <Fluxo />
      </Secao>
    </>
  );
}
