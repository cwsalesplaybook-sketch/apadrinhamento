import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ChartColumnIncreasing,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Info,
  MapPin,
  Store,
  Target,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppLayout, IconeCirculo, Vazio } from "@/components/AppLayout";
import { METAS, PRAZOS_ABC, cadenciaABC, calcularIndicadores, diasDesde, pct, type Dupla } from "@/lib/apadrinhamento";
import { posicaoDa, useRadar, type DadosRadar } from "@/lib/radar";
import { Agendamentos } from "@/components/Agendamentos";
import { cn } from "@/lib/utils";

const VERDE = "#2fc39a";

function Seta() {
  return (
    <Link to="/duplas" className="botao-chevron" aria-label="Ver duplas">
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function CardMeta({
  icon,
  cor = "roxo",
  titulo,
  descricao,
  valor,
  meta,
  total,
  nota,
}: {
  icon: typeof Users;
  cor?: "roxo" | "verde";
  titulo: string;
  descricao: string;
  valor: number;
  meta: number;
  total: number;
  nota: string;
}) {
  const largura = total ? Math.min(100, (valor / Math.max(total, 1)) * 100) : 0;
  const barra =
    cor === "verde" ? `linear-gradient(90deg, #1fb487, ${VERDE})` : "linear-gradient(90deg, #8b2ff7, #b25bff)";
  return (
    <div className="cartao flex flex-col px-4 py-5">
      <div className="flex items-start gap-2.5">
        <IconeCirculo icon={icon} cor={cor} />
        <div className="min-w-0 flex-1 pt-1">
          <div className="truncate text-[17px] font-black text-ink">{titulo}</div>
          <div className="truncate text-[13px] text-muted-foreground" title={descricao}>{descricao}</div>
        </div>
        <Seta />
      </div>
      <div className="mt-4 flex items-baseline gap-1.5 text-ink">
        <span className="num text-[40px] leading-none">{valor}</span>
        <span className="text-2xl font-bold">/ {total}</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">meta {meta}</div>
      <div className="mt-3 h-2 rounded-full bg-[#ece4f6]">
        <div className="h-2 rounded-full" style={{ width: `${largura}%`, background: barra }} />
      </div>
      <div className="mt-4 text-[13px] text-muted-foreground">{nota}</div>
    </div>
  );
}

/** Linha do tempo com as etapas do funil em que a dupla está (aba Duplas → funis). */
function LinhaDupla({ d, dados, varios }: { d: Dupla; dados?: DadosRadar; varios: boolean }) {
  const dia = diasDesde(d.data_inicio);
  const pos = posicaoDa(dados, d.id);
  const etapas = pos?.pipeline.etapas ?? [];
  const atual = pos ? etapas.findIndex((e) => e.id === pos.etapa.id) : -1;
  const desde = pos?.desde ? Math.floor((Date.now() - new Date(pos.desde).getTime()) / 864e5) : null;
  return (
    <div className="rounded-2xl border border-[#ece3f6] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ede3fb] text-lg font-black text-primary">
          {d.afilhado.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <Link to="/duplas/$id" params={{ id: d.id }} className="block truncate font-black text-ink hover:text-primary">
            {d.afilhado}
          </Link>
          <div className="truncate text-sm text-muted-foreground">
            Padrinho: {d.padrinho} · Ciclo {d.ciclo}
            {varios && pos && ` · Funil ${pos.pipeline.nome}`}
            {desde !== null && ` · ${desde === 0 ? "entrou hoje" : `${desde} ${desde === 1 ? "dia" : "dias"}`} nesta etapa`}
          </div>
        </div>
        <span className="rounded-full bg-[#f1e9fb] px-3 py-1 text-sm font-black text-primary">D{dia}</span>
      </div>
      {etapas.length > 0 && (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="relative" style={{ minWidth: Math.max(320, etapas.length * 110) }}>
            <div className="absolute left-[6px] right-[6px] top-[5px] h-[3px] rounded-full bg-[#ece4f6]" />
            {etapas.length > 1 && (
              <div
                className="absolute left-[6px] top-[5px] h-[3px] rounded-full bg-primary"
                style={{ width: atual > 0 ? `calc(${(atual / (etapas.length - 1)) * 100}% - 12px)` : 0 }}
              />
            )}
            <div className="relative flex justify-between">
              {etapas.map((etapa, i) => (
                <div key={etapa.id} className="flex w-0 flex-col items-center first:items-start last:items-end">
                  <span
                    className={`h-[13px] w-[13px] rounded-full border-2 ${
                      i <= atual ? "border-primary bg-primary" : "border-[#ddd0ee] bg-white"
                    } ${i === atual ? "ring-4 ring-primary/20" : ""}`}
                  />
                  <span className={`mt-2 whitespace-nowrap text-xs ${i === atual ? "font-black text-ink" : "text-muted-foreground"}`}>
                    {etapa.nome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Quantas duplas em cada etapa do funil escolhido (os mesmos funis da aba Duplas). */
function FunilReal({ duplas, dados, pipelineId }: { duplas: Dupla[]; dados: DadosRadar; pipelineId: string }) {
  const pipeline = dados.pipelines.find((p) => p.id === pipelineId) ?? dados.pipelines[0];
  if (!pipeline) return null;
  const nessa = duplas.filter((d) => posicaoDa(dados, d.id)?.pipeline.id === pipeline.id);
  const linhas = pipeline.etapas.map((e) => ({ etapa: e, valor: nessa.filter((d) => posicaoDa(dados, d.id)?.etapa.id === e.id).length }));
  const max = Math.max(1, ...linhas.map((l) => l.valor));
  const cor = (i: number) => `hsl(${272 - (i / Math.max(1, linhas.length - 1)) * 110} 80% 60%)`;
  return (
    <>
      <div className="mt-5 space-y-3.5">
        {linhas.map((l, i) => (
          <div key={l.etapa.id} className="grid grid-cols-[minmax(0,180px)_1fr_36px] items-center gap-4 text-[15px]">
            <span className="flex min-w-0 items-center gap-2.5 text-ink">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cor(i) }} />
              <span className="truncate" title={l.etapa.nome}>
                {l.etapa.nome}
              </span>
            </span>
            <div className="h-3 rounded-full bg-[#efe8f8]">
              <div className="h-3 rounded-full" style={{ width: `${(l.valor / max) * 100}%`, background: cor(i) }} />
            </div>
            <span className="num text-right text-ink">{l.valor}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Info className="h-4 w-4 text-primary" />
        {nessa.length} {nessa.length === 1 ? "dupla" : "duplas"} no funil "{pipeline.nome}" · arraste os cards na aba Duplas para mudar de etapa
      </p>
    </>
  );
}

function Anel({ padrinho, psm, previsto }: { padrinho: number; psm: number; previsto: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const base = Math.max(previsto, padrinho + psm, 1);
  const a = (padrinho / base) * c;
  const b = (psm / base) * c;
  return (
    <div className="relative mx-auto h-48 w-48">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#efe6fa" strokeWidth="16" />
        {a > 0 && (
          <circle cx="90" cy="90" r={r} fill="none" stroke="#8b2ff7" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${a} ${c}`} />
        )}
        {b > 0 && (
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="#ffb600"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${b} ${c}`}
            strokeDashoffset={-a}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="num text-4xl text-ink">{+(padrinho + psm).toFixed(1)}h</div>
        <div className="text-sm text-muted-foreground">total investido</div>
      </div>
    </div>
  );
}

const COR_FUNIL = ["#8b5cf6", "#8b5cf6", "#7c83f6", "#6f8ff5", "#6f8ff5", VERDE, VERDE];

export function PainelPage() {
  const { data: duplas = [] } = useQuery({
    queryKey: ["duplas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("duplas").select("*").order("data_inicio");
      if (error) throw error;
      return data as Dupla[];
    },
  });
  const ciclos = [...new Set(duplas.map((d) => d.ciclo))].sort();
  const [ciclo, setCiclo] = useState<number | "todos">("todos");
  const filtradas = ciclo === "todos" ? duplas : duplas.filter((d) => d.ciclo === ciclo);
  const ind = calcularIndicadores(filtradas);
  const maxFunil = Math.max(1, ...ind.funil.map((f) => f.valor));
  const radar = useRadar();
  const [pipelineId, setPipelineId] = useState("");
  const [visaoFunil, setVisaoFunil] = useState<"etapas" | "metodo">("etapas");
  const pipelines = radar.data?.pipelines ?? [];
  const pipelineAtual = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];

  // Formados / encerrados pela etapa do funil em que a dupla está (aba Duplas).
  const nomeEtapa = (d: Dupla) => posicaoDa(radar.data, d.id)?.etapa.nome.toLowerCase() ?? "";
  // (o status da dupla também vale, para quem foi encerrado pelo botão da página da dupla)
  const formada = (d: Dupla) => d.status === "formado" || /format|formad/.test(nomeEtapa(d));
  const encerrada = (d: Dupla) => d.status === "encerrado" || /encerr|perdid|conclu|desist|sem ativa/.test(nomeEtapa(d));
  const formados = filtradas.filter(formada).length;
  const encerrados = filtradas.filter(encerrada).length;
  // Aderência = reuniões ABC feitas dentro das janelas do Playbook (duplas que seguem no ciclo).
  const cadencia = cadenciaABC(filtradas.filter((d) => !encerrada(d)));

  return (
    <AppLayout
      title="Painel do ciclo"
      subtitle="Indicadores do modelo de apadrinhamento"
      icon={CalendarDays}
      filtros={
        <label className="seletor-3d relative flex items-center gap-2 py-2.5 pl-4 pr-3 text-[15px] text-ink">
          <CalendarDays className="h-5 w-5" strokeWidth={1.9} />
          <select
            className="cursor-pointer appearance-none bg-transparent pr-6 outline-none"
            value={String(ciclo)}
            onChange={(e) => setCiclo(e.target.value === "todos" ? "todos" : Number(e.target.value))}
          >
            <option value="todos">Todos os ciclos</option>
            {ciclos.map((c) => (
              <option key={c} value={c}>
                Ciclo {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4" />
        </label>
      }
    >
      {duplas.length === 0 ? (
        <Vazio imagem="/brand/cardapinho-notebook.webp">
          <p className="text-muted-foreground">Nenhuma dupla cadastrada ainda.</p>
          <Link to="/duplas" className="mt-3 inline-block font-black text-primary">
            Cadastrar a primeira dupla →
          </Link>
        </Vazio>
      ) : (
        <div className="space-y-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
            <div className="grid content-start gap-5 md:grid-cols-2">
            <CardMeta
              icon={Users}
              titulo="Execução"
              descricao="4 reuniões feitas"
              valor={ind.execucao}
              meta={METAS.execucao}
              total={ind.total}
              nota="Mede a execução do método"
            />
            <CardMeta
              icon={Store}
              cor="verde"
              titulo="Ativação"
              descricao="venda originada até D30"
              valor={ind.ativacao}
              meta={METAS.ativacao}
              total={ind.total}
              nota={`Conduzidas até D30: ${ind.conduzidasD30} (piso ${METAS.conduzidasD30})`}
            />
            <CardMeta
              icon={Target}
              titulo="Autonomia"
              descricao="venda conduzida até D60"
              valor={ind.autonomia}
              meta={METAS.autonomia}
              total={ind.total}
              nota="Objetivo real do programa"
            />
            <div className="cartao-escuro flex flex-col px-4 py-5">
              <div className="flex items-start gap-2.5">
                <span className="tile-3d-escuro flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl">
                  <ChartColumnIncreasing className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="whitespace-nowrap text-[15px] font-black">Aderência à cadência</div>
                  <div className="text-sm text-white/75">(reuniões ABC no prazo)</div>
                </div>
                <Link to="/duplas" className="botao-chevron !bg-white/15 !text-white" aria-label="Ver duplas">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-white/15">
                  <div
                    className="h-1.5 rounded-full bg-warning"
                    style={{ width: `${Math.round((cadencia.taxa ?? 0) * 100)}%` }}
                  />
                </div>
                <span className="num text-sm text-warning">{pct(cadencia.taxa)}</span>
              </div>
              <div className="mt-2 text-[13px] text-white/75">
                {cadencia.devidas
                  ? `${cadencia.feitas} de ${cadencia.devidas} reuniões feitas no prazo · meta 80%`
                  : cadencia.proximoPrazo !== Infinity
                    ? `Começa a contar no D${cadencia.proximoPrazo} (prazo da ${PRAZOS_ABC.indexOf(cadencia.proximoPrazo) + 1}ª reunião)`
                    : "Nenhuma reunião com prazo no ciclo"}
              </div>
              <div className="mt-auto grid grid-cols-2 pt-5">
                <div className="pr-4">
                  <div className="num text-[32px] leading-none">{formados}</div>
                  <div className="mt-1 text-[15px] text-white/85">formados</div>
                </div>
                <div className="border-l border-white/20 pl-6">
                  <div className="num text-[32px] leading-none">{encerrados}</div>
                  <div className="mt-1 text-[15px] text-white/85">encerrados</div>
                </div>
              </div>
            </div>
            </div>
            <Agendamentos />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_minmax(0,430px)]">
            <div className="cartao p-6">
              <div className="flex items-start gap-2.5">
                <IconeCirculo icon={Filter} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 className="text-lg font-black text-ink">Funil das duplas</h2>
                  <p className="text-sm text-muted-foreground">
                    {visaoFunil === "etapas" ? "Quantas duplas há em cada etapa do funil." : "Leads, reuniões e vendas do método ABC."}
                  </p>
                </div>
                <Seta />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex rounded-full bg-muted p-1">
                  {(
                    [
                      ["etapas", "Etapas do funil"],
                      ["metodo", "Método ABC"],
                    ] as const
                  ).map(([v, rotulo]) => (
                    <button
                      key={v}
                      onClick={() => setVisaoFunil(v)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                        visaoFunil === v ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-ink",
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
                {visaoFunil === "etapas" && pipelines.length > 1 && (
                  <select
                    aria-label="Funil"
                    value={pipelineAtual?.id ?? ""}
                    onChange={(e) => setPipelineId(e.target.value)}
                    className="seletor-3d h-8 cursor-pointer px-2 text-xs font-bold text-ink outline-none"
                  >
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {visaoFunil === "etapas" ? (
                radar.data && pipelineAtual ? (
                  <FunilReal duplas={filtradas} dados={radar.data} pipelineId={pipelineAtual.id} />
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">
                    {radar.isError ? `Não consegui carregar os funis: ${(radar.error as Error).message}` : "Carregando funis…"}
                  </p>
                )
              ) : (
              <>
              <div className="mt-5 space-y-3.5">
                {ind.funil.map((f, i) => (
                  <div key={f.label} className="grid grid-cols-[150px_1fr_36px] items-center gap-4 text-[15px]">
                    <span className="flex items-center gap-2.5 text-ink">
                      <i className="h-2.5 w-2.5 rounded-full" style={{ background: COR_FUNIL[i] }} />
                      {f.label}
                    </span>
                    <div className="h-3 rounded-full bg-[#efe8f8]">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: `${(f.valor / maxFunil) * 100}%`,
                          background: `linear-gradient(90deg, ${COR_FUNIL[i]}cc, ${COR_FUNIL[i]})`,
                        }}
                      />
                    </div>
                    <span className="num text-right text-ink">{f.valor}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 flex items-center gap-2 text-[13px] text-muted-foreground">
                <Info className="h-4 w-4 text-primary" />
                Leads novos (pipeline próprio, além dos 6 iniciais): <b className="text-ink">{ind.leadsNovos}</b>
              </p>
              </>
              )}
            </div>

            <div className="cartao p-6">
              <div className="flex items-start gap-2.5">
                <IconeCirculo icon={Clock} />
                <div className="flex-1 pt-0.5">
                  <h2 className="text-lg font-black text-ink">Horas investidas</h2>
                  <p className="text-sm text-muted-foreground">Previsto por ciclo: {METAS.horasCiclo}h</p>
                </div>
                <Seta />
              </div>
              <div className="mt-5">
                <Anel padrinho={ind.horasPadrinho} psm={ind.horasPsm} previsto={METAS.horasCiclo} />
              </div>
              <div className="mt-6 space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <span className="flex items-center gap-3 text-ink">
                    <i className="h-3 w-3 rounded-full bg-[#8b2ff7]" />
                    Padrinhos
                  </span>
                  <b className="num text-ink">{ind.horasPadrinho.toFixed(1)}h</b>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-3 text-ink">
                    <i className="h-3 w-3 rounded-full bg-warning" />
                    PSM
                  </span>
                  <b className="num text-ink">{ind.horasPsm.toFixed(1)}h</b>
                </div>
              </div>
            </div>
          </section>

          <section className="cartao p-6">
            <div className="flex items-center gap-3">
              <IconeCirculo icon={MapPin} />
              <h2 className="flex-1 text-lg font-black text-ink">Onde cada dupla está</h2>
              <Link to="/duplas" className="flex items-center gap-1 text-sm font-bold text-primary">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {filtradas.map((d) => (
                <LinhaDupla key={d.id} d={d} dados={radar.data} varios={pipelines.length > 1} />
              ))}
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
