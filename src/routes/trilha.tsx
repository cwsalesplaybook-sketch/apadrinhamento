import { useState, type ReactNode } from "react";
import { Bot, CalendarCheck, Loader2, PhoneOff, Presentation, Search, Trophy, Users } from "lucide-react";
import { CabecalhoPagina } from "@/components/Layout";
import { TabelaEditavel } from "@/components/Editor";
import {
  ETAPAS_ABC,
  ativou,
  brParaIso,
  corEtapa,
  cursosFaltando,
  hojeBR,
  situacaoCursos,
  tempoDesde,
  useDados,
  type Linha,
} from "@/lib/trilha";

export function Carregando({ carregando, erro, children }: { carregando: boolean; erro: Error | null; children: ReactNode }) {
  if (carregando)
    return (
      <div className="cartao flex items-center justify-center gap-2 p-10 text-suave">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    );
  if (erro) return <div className="cartao p-6 text-vermelho">Não foi possível carregar os dados: {erro.message}</div>;
  return <>{children}</>;
}

const ABAS = [
  ["abc", "Reps no ABC"],
  ["ativados", "Ativados | Possíveis"],
  ["cursos", "Cursos pendentes"],
  ["frente", "De frente com Gabi"],
  ["cadencia", "Cadência de reativação"],
  ["templates", "Templates"],
] as const;
type Aba = (typeof ABAS)[number][0];

const lerAba = (): Aba => {
  try {
    const v = localStorage.getItem("trilha-aba");
    return ABAS.some(([id]) => id === v) ? (v as Aba) : "abc";
  } catch {
    return "abc";
  }
};

function Indicador({ icon: I, valor, rotulo, cor = "text-roxo-claro" }: { icon: typeof Users; valor: number; rotulo: string; cor?: string }) {
  return (
    <div className="cartao flex items-center gap-3 p-4">
      <span className={`icone-tile h-10 w-10 shrink-0 ${cor}`}>
        <I className="h-5 w-5" />
      </span>
      <div>
        <p className="titulo text-2xl leading-none">{valor}</p>
        <p className="mt-1 text-xs text-suave">{rotulo}</p>
      </div>
    </div>
  );
}

/** Barra com a distribuição dos reps por etapa do ABC. */
function Distribuicao({ abc }: { abc: Linha[] }) {
  const etapas = [...ETAPAS_ABC, ...new Set(abc.map((l) => l.etapa).filter((e) => e && !ETAPAS_ABC.includes(e)))];
  const contagem = etapas.map((e) => [e, abc.filter((l) => l.etapa === e).length] as const).filter(([, n]) => n > 0);
  if (!abc.length) return null;
  const cores: Record<string, string> = {
    "pilula-verde": "bg-verde",
    "pilula-vermelha": "bg-vermelho",
    "pilula-ouro": "bg-laranja",
    "pilula-roxa": "bg-roxo",
  };
  return (
    <div className="cartao mt-4 p-5">
      <p className="sobretitulo !text-fraco">Reps por etapa do ABC</p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/5">
        {contagem.map(([e, n], i) => (
          <div
            key={e}
            className={`${cores[corEtapa(e)]} ${i ? "border-l-2 border-fundo" : ""}`}
            style={{ width: `${(n / abc.length) * 100}%`, opacity: e === "Reunião de Apresentação" ? 0.65 : 1 }}
            title={`${e}: ${n}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {contagem.map(([e, n]) => (
          <span key={e} className={`pilula ${corEtapa(e)}`}>
            {e} · {n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrilhaPage() {
  const { data, isLoading, error } = useDados();
  const [aba, setAba] = useState<Aba>(lerAba);

  function trocar(a: Aba) {
    setAba(a);
    try {
      localStorage.setItem("trilha-aba", a);
    } catch {
      /* sem armazenamento: só não lembra a aba */
    }
  }

  const t = data?.tabelas;
  const abc = t?.abc ?? [];
  const hojeIso = brParaIso(hojeBR());
  const ativados = abc.filter((l) => ativou(l.etapa)).length;
  const proximos1a1 = (t?.frente ?? []).filter((l) => brParaIso(l.data) >= hojeIso).length;
  const semCurso = (t?.cursos ?? []).filter((l) => cursosFaltando(l).length > 0).length;
  // 1:1s mais recentes primeiro.
  const frente = [...(t?.frente ?? [])].sort((a, b) => (brParaIso(b.data) + b.horario).localeCompare(brParaIso(a.data) + a.horario));

  return (
    <>
      <CabecalhoPagina sobre="Programa de Aceleração · ABC" titulo="Trilha da aceleração de vendas">
        O acompanhamento de cada representante no mês de ABC: etapa, feedback dos 1:1s, cursos e mensagens. Tudo aqui é editável — clique numa
        linha para atualizar.
      </CabecalhoPagina>

      <Carregando carregando={isLoading} erro={error}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Indicador icon={Users} valor={abc.length} rotulo="Reps no ABC" />
          <Indicador icon={Search} valor={abc.filter((l) => l.etapa === "Prospecção").length} rotulo="Em prospecção" />
          <Indicador icon={Presentation} valor={abc.filter((l) => l.etapa === "Reunião de Apresentação").length} rotulo="Reunião de apresentação" />
          <Indicador icon={Trophy} valor={ativados} rotulo="Ativados (Pro / Elite)" cor="!text-verde !bg-verde/15" />
          <Indicador icon={PhoneOff} valor={abc.filter((l) => l.etapa === "Sem retorno").length} rotulo="Sem retorno" cor="!text-vermelho !bg-vermelho/15" />
          <Indicador icon={CalendarCheck} valor={proximos1a1} rotulo="1:1s de hoje em diante" cor="!text-dourado !bg-laranja/15" />
        </div>
        <Distribuicao abc={abc} />

        <div className="sem-barra mt-10 mb-5 flex gap-1 overflow-x-auto border-b border-borda">
          {ABAS.map(([id, rotulo]) => (
            <button
              key={id}
              onClick={() => trocar(id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
                aba === id ? "border-dourado text-texto" : "border-transparent text-suave hover:text-texto"
              }`}
            >
              {rotulo}
              {id === "cursos" && semCurso > 0 && <span className="pilula pilula-ouro ml-2 !py-0">{semCurso}</span>}
            </button>
          ))}
        </div>

        {aba === "abc" && (
          <TabelaEditavel
            tabela="abc"
            titulo="Rep no ABC"
            linhas={abc}
            filtro={{ chave: "etapa", opcoes: ETAPAS_ABC }}
            extras={[{ rotulo: "Tempo na etapa", depoisDe: "etapa", valor: (l) => <span className="text-suave">{tempoDesde(l.desde) || "—"}</span> }]}
          />
        )}
        {aba === "ativados" && <TabelaEditavel tabela="ativados" titulo="Representante" linhas={t?.ativados ?? []} />}
        {aba === "cursos" && (
          <TabelaEditavel
            tabela="cursos"
            titulo="Cursos do representante"
            linhas={t?.cursos ?? []}
            extras={[
              {
                rotulo: "Situação",
                depoisDe: "psm",
                valor: (l) => {
                  const s = situacaoCursos(l);
                  return <span className={`pilula ${s === "Cursos concluídos" ? "pilula-verde" : s === "Nenhum curso feito" ? "pilula-vermelha" : "pilula-ouro"}`}>{s}</span>;
                },
              },
              {
                rotulo: "Cursos faltando",
                depoisDe: "vendas",
                valor: (l) => <span className="text-suave">{cursosFaltando(l).join(", ") || "—"}</span>,
              },
            ]}
          />
        )}
        {aba === "frente" && <TabelaEditavel tabela="frente" titulo="1:1 De frente com Gabi" linhas={frente} />}
        {aba === "cadencia" && (
          <>
            <TabelaEditavel tabela="cadencia" titulo="Toque da cadência" linhas={t?.cadencia ?? []} />
            <h2 className="mt-10 mb-4 flex items-center gap-2 text-2xl">
              <Bot className="h-6 w-6 text-roxo-claro" /> Regras da IA
            </h2>
            <TabelaEditavel tabela="regras" titulo="Regra da IA" linhas={t?.regras ?? []} />
          </>
        )}
        {aba === "templates" && <TabelaEditavel tabela="templates" titulo="Template" linhas={t?.templates ?? []} />}
      </Carregando>
    </>
  );
}
