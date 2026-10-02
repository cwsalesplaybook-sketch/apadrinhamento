import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  History,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Search,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, dataBR, diasDesde, type Dupla, type StatusDupla } from "@/lib/apadrinhamento";
import { dataHoraBR, posicaoDa, useAcaoRadar, useRadar, type Evento, type Mudanca, type Nota } from "@/lib/radar";

/* ---------- campos da coluna da esquerda ---------- */

type Tipo = "text" | "number" | "date" | "status" | "longo";
interface DefCampo {
  nome: keyof Dupla;
  rotulo: string;
  tipo: Tipo;
}

const GRUPOS: { titulo: string; campos: DefCampo[] }[] = [
  {
    titulo: "Dupla",
    campos: [
      { nome: "afilhado", rotulo: "Afilhado", tipo: "text" },
      { nome: "padrinho", rotulo: "Padrinho", tipo: "text" },
      { nome: "ciclo", rotulo: "Ciclo", tipo: "number" },
      { nome: "data_inicio", rotulo: "Início (D0)", tipo: "date" },
      { nome: "status", rotulo: "Status", tipo: "status" },
    ],
  },
  {
    titulo: "Fluxo ABC — reuniões",
    campos: [
      { nome: "reuniao1", rotulo: "Reunião 1", tipo: "date" },
      { nome: "reuniao2", rotulo: "Reunião 2", tipo: "date" },
      { nome: "reuniao3", rotulo: "Reunião 3", tipo: "date" },
      { nome: "reuniao4", rotulo: "Reunião 4", tipo: "date" },
    ],
  },
  {
    titulo: "Leads e check-ins",
    campos: [
      { nome: "leads_entregues", rotulo: "Leads iniciais", tipo: "number" },
      { nome: "leads_novos", rotulo: "Leads novos", tipo: "number" },
      { nome: "checkins_realizados", rotulo: "Check-ins feitos", tipo: "number" },
      { nome: "checkins_faltados", rotulo: "Check-ins faltados", tipo: "number" },
    ],
  },
  {
    titulo: "Vendas e horas",
    campos: [
      { nome: "venda_originada", rotulo: "1ª venda originada", tipo: "date" },
      { nome: "venda_conduzida", rotulo: "1ª venda conduzida", tipo: "date" },
      { nome: "horas_padrinho", rotulo: "Horas padrinho", tipo: "number" },
      { nome: "horas_psm", rotulo: "Horas PSM", tipo: "number" },
    ],
  },
  { titulo: "Observações", campos: [{ nome: "observacoes", rotulo: "Observações", tipo: "longo" }] },
];

function exibir(tipo: Tipo, v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (tipo === "date") return dataBR(String(v));
  if (tipo === "status") return STATUS_LABEL[v as StatusDupla] ?? String(v);
  return String(v);
}

function useDuplas() {
  return useQuery({
    queryKey: ["duplas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("duplas").select("*").order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Dupla[];
    },
  });
}

/* ---------- página ---------- */

export function DuplaPage() {
  const { id } = useParams({ from: "/_authenticated/duplas/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: duplas, isLoading } = useDuplas();
  const radar = useRadar();
  const acao = useAcaoRadar();
  const dupla = duplas?.find((d) => d.id === id);
  const pos = posicaoDa(radar.data, id);

  const salvarCampos = useMutation({
    mutationFn: async (campos: Partial<Dupla>) => {
      const { error } = await supabase.from("duplas").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_r, campos) => {
      qc.invalidateQueries({ queryKey: ["duplas"] });
      if (!dupla) return;
      const mudancas: Mudanca[] = Object.entries(campos).map(([nome, para]) => {
        const def = GRUPOS.flatMap((g) => g.campos).find((c) => c.nome === nome)!;
        return { campo: def.rotulo, de: exibir(def.tipo, dupla[nome as keyof Dupla]), para: exibir(def.tipo, para) };
      });
      acao.mutate({ acao: "registrar", duplaId: id, mudancas });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("duplas").delete().eq("id", id);
      if (error) throw error;
      acao.mutate({ acao: "apagarDupla", duplaId: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duplas"] });
      toast.success("Dupla excluída");
      navigate({ to: "/duplas" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <AppLayout icon={Users} title="Duplas">{null}</AppLayout>;
  if (!dupla)
    return (
      <AppLayout icon={Users} title="Dupla não encontrada">
        <Link to="/duplas" className="text-primary underline">
          Voltar para Duplas
        </Link>
      </AppLayout>
    );

  const encerrada = dupla.status === "formado" || dupla.status === "encerrado";
  const diasNaEtapa = diasDesde((pos?.desde ?? dupla.created_at ?? dupla.data_inicio).slice(0, 10));

  return (
    <AppLayout
      icon={Users}
      title={dupla.afilhado}
      subtitle={`Padrinho: ${dupla.padrinho} · D${diasDesde(dupla.data_inicio)} do ciclo ${dupla.ciclo}`}
      actions={
        <div className="flex items-center gap-2">
          {encerrada ? (
            <>
              <span
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-black text-white",
                  dupla.status === "formado" ? "bg-primary" : "bg-destructive",
                )}
              >
                {STATUS_LABEL[dupla.status]}
              </span>
              <Button variant="outline" onClick={() => salvarCampos.mutate({ status: "em_andamento" })}>
                Reabrir
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => salvarCampos.mutate({ status: "formado" })}>Formado</Button>
              <Button variant="destructive" onClick={() => salvarCampos.mutate({ status: "encerrado" })}>
                Encerrado
              </Button>
            </>
          )}
          <MenuMais aoExcluir={() => confirm("Excluir esta dupla? As anotações e o histórico também serão apagados.") && excluir.mutate()} />
        </div>
      }
    >
      <Link to="/duplas" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Duplas
      </Link>

      {/* Barra de etapas */}
      {pos && (
        <div className="mb-2">
          <div className="flex gap-1">
            {pos.pipeline.etapas.map((e, i) => {
              const idx = pos.pipeline.etapas.findIndex((x) => x.id === pos.etapa.id);
              const atual = e.id === pos.etapa.id;
              return (
                <button
                  key={e.id}
                  title={`Mover para ${e.nome}`}
                  onClick={() => !atual && acao.mutate({ acao: "mover", duplaId: id, pipelineId: pos.pipeline.id, etapaId: e.id })}
                  className={cn(
                    "etapa-seta min-w-0 flex-1 cursor-pointer truncate px-5 py-2 text-xs font-bold transition-colors",
                    i <= idx ? "bg-primary text-white" : "bg-[#e6daf0] text-muted-foreground hover:bg-[#dccbea]",
                  )}
                >
                  {atual ? `${diasNaEtapa} ${diasNaEtapa === 1 ? "dia" : "dias"} - ${e.nome}` : e.nome}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-primary">
            <select
              aria-label="Funil"
              className="cursor-pointer bg-transparent font-bold text-primary outline-none hover:underline"
              value={pos.pipeline.id}
              onChange={(ev) => {
                const p = radar.data!.pipelines.find((x) => x.id === ev.target.value)!;
                acao.mutate({ acao: "mover", duplaId: id, pipelineId: p.id, etapaId: p.etapas[0].id });
              }}
            >
              {radar.data!.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">→</span>
            <span>{pos.etapa.nome}</span>
          </div>
        </div>
      )}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[360px_1fr]">
        <ColunaCampos dupla={dupla} salvar={(campos) => salvarCampos.mutate(campos)} />
        <div className="min-w-0 space-y-6">
          <Composer duplaId={id} />
          <Foco duplaId={id} notas={radar.data?.notas[id] ?? []} />
          <Historico
            duplaId={id}
            criadaEm={dupla.created_at}
            notas={radar.data?.notas[id] ?? []}
            eventos={radar.data?.historico?.[id] ?? []}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function MenuMais({ aoExcluir }: { aoExcluir: () => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="icon" aria-label="Mais ações" onClick={() => setAberto((a) => !a)}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {aberto && (
        <div className="cartao absolute right-0 top-11 z-30 w-44 p-1.5" onMouseLeave={() => setAberto(false)}>
          <button
            onClick={() => {
              setAberto(false);
              aoExcluir();
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-destructive hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" /> Excluir dupla
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- coluna da esquerda: campos editáveis ---------- */

function ColunaCampos({ dupla, salvar }: { dupla: Dupla; salvar: (campos: Partial<Dupla>) => void }) {
  const [filtro, setFiltro] = useState("");
  const [fechados, setFechados] = useState<Record<string, boolean>>({});
  const f = filtro.trim().toLowerCase();

  return (
    <aside className="cartao overflow-hidden">
      <div className="border-b p-3">
        <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar campos"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>
      {GRUPOS.map((g) => {
        const campos = g.campos.filter((c) => !f || c.rotulo.toLowerCase().includes(f));
        if (!campos.length) return null;
        const fechado = fechados[g.titulo] && !f;
        return (
          <section key={g.titulo} className="border-b last:border-b-0">
            <button
              onClick={() => setFechados((s) => ({ ...s, [g.titulo]: !s[g.titulo] }))}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-black text-ink"
            >
              {fechado ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {g.titulo}
            </button>
            {!fechado && (
              <dl className="pb-2">
                {campos.map((c) => (
                  <CampoInline key={c.nome} def={c} valor={dupla[c.nome]} salvar={(v) => salvar({ [c.nome]: v } as Partial<Dupla>)} />
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </aside>
  );
}

function CampoInline({ def, valor, salvar }: { def: DefCampo; valor: unknown; salvar: (v: unknown) => void }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");

  function abrir() {
    setRascunho(valor === null || valor === undefined ? "" : String(valor));
    setEditando(true);
  }
  function confirmar() {
    setEditando(false);
    let novo: unknown = rascunho.trim() === "" ? null : rascunho;
    if (def.tipo === "number") novo = novo === null ? 0 : Number(novo);
    if ((def.nome === "afilhado" || def.nome === "padrinho") && !novo) return toast.error("Esse campo não pode ficar vazio");
    if (String(novo ?? "") !== String(valor ?? "")) salvar(novo);
  }

  const classeInput = "w-full rounded-lg border border-primary bg-white px-2 py-1 text-sm outline-none";
  let editor: ReactNode;
  if (def.tipo === "status")
    editor = (
      <select autoFocus className={classeInput} value={rascunho} onChange={(e) => setRascunho(e.target.value)} onBlur={confirmar}>
        {Object.entries(STATUS_LABEL).map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
    );
  else if (def.tipo === "longo")
    editor = (
      <Textarea autoFocus className="min-h-24 bg-white" value={rascunho} onChange={(e) => setRascunho(e.target.value)} onBlur={confirmar} />
    );
  else
    editor = (
      <input
        autoFocus
        type={def.tipo}
        step={def.tipo === "number" ? "any" : undefined}
        className={classeInput}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
          if (e.key === "Escape") setEditando(false);
        }}
      />
    );

  const longo = def.tipo === "longo";
  return (
    <div className={cn("group grid items-start gap-3 px-4 py-1.5", longo ? "grid-cols-1" : "grid-cols-[130px_1fr]")}>
      {!longo && <dt className="pt-1 text-right text-xs font-bold text-muted-foreground">{def.rotulo}</dt>}
      <dd className="min-w-0">
        {editando ? (
          editor
        ) : (
          <button
            onClick={abrir}
            title="Clique para editar"
            className="flex w-full cursor-pointer items-start justify-between gap-2 rounded-lg px-2 py-1 text-left text-sm text-ink hover:bg-accent"
          >
            <span className={cn("min-w-0 break-words", longo && "whitespace-pre-wrap")}>{exibir(def.tipo, valor)}</span>
            <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </dd>
    </div>
  );
}

/* ---------- composer de anotação ---------- */

function Composer({ duplaId }: { duplaId: string }) {
  const acao = useAcaoRadar();
  const [texto, setTexto] = useState("");
  const [focado, setFocado] = useState(false);
  const aberto = focado || !!texto;

  return (
    <div className="cartao overflow-hidden">
      <div className="flex border-b px-3">
        <span className="-mb-px flex items-center gap-2 border-b-[3px] border-primary px-3 py-3 text-sm font-bold text-primary">
          <StickyNote className="h-4 w-4" /> Anotações
        </span>
      </div>
      <form
        className="bg-[#fff8e1]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          acao.mutate(
            { acao: "nota", duplaId, texto },
            {
              onSuccess: () => {
                setTexto("");
                setFocado(false);
                toast.success("Anotação salva");
              },
            },
          );
        }}
      >
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => setFocado(true)}
          placeholder="Faça uma anotação sobre esta dupla…"
          className={cn(
            "rounded-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0",
            aberto ? "min-h-28" : "min-h-12",
          )}
        />
        {aberto && (
          <div className="flex justify-end gap-2 border-t border-[#f3dd9c] px-3 py-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setTexto("");
                setFocado(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={acao.isPending || !texto.trim()}>
              Salvar
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

/* ---------- Foco: anotações fixadas ---------- */

function Foco({ duplaId, notas }: { duplaId: string; notas: Nota[] }) {
  const [aberto, setAberto] = useState(true);
  const fixadas = notas.filter((n) => n.fixada);
  return (
    <section>
      <button onClick={() => setAberto((a) => !a)} className="mb-3 flex cursor-pointer items-center gap-1.5 text-base font-black text-ink">
        Foco {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {aberto &&
        (fixadas.length === 0 ? (
          <div className="cartao px-6 py-6 text-center">
            <p className="text-sm font-bold text-ink">Nenhum item de foco ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">Fixe uma anotação (ícone de alfinete no histórico) para ela ficar aqui em cima.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fixadas.map((n) => (
              <CartaoNota key={n.id} duplaId={duplaId} nota={n} />
            ))}
          </div>
        ))}
    </section>
  );
}

/* ---------- Histórico ---------- */

type Item =
  | { tipo: "nota"; em: string; nota: Nota }
  | { tipo: "evento"; em: string; evento: Evento }
  | { tipo: "criada"; em: string };

function Historico({
  duplaId,
  criadaEm,
  notas,
  eventos,
}: {
  duplaId: string;
  criadaEm?: string;
  notas: Nota[];
  eventos: Evento[];
}) {
  const [aba, setAba] = useState<"todos" | "notas" | "alteracoes">("todos");
  const [aberto, setAberto] = useState(true);

  const itens = useMemo(() => {
    const todos: Item[] = [
      ...notas.map((nota) => ({ tipo: "nota" as const, em: nota.criadoEm, nota })),
      ...eventos.map((evento) => ({ tipo: "evento" as const, em: evento.em, evento })),
      ...(criadaEm ? [{ tipo: "criada" as const, em: criadaEm }] : []),
    ];
    return todos
      .filter((i) => aba === "todos" || (aba === "notas" ? i.tipo === "nota" : i.tipo !== "nota"))
      .sort((a, b) => b.em.localeCompare(a.em));
  }, [notas, eventos, criadaEm, aba]);

  const abas = [
    ["todos", "Todos"],
    ["notas", `Anotações (${notas.length})`],
    ["alteracoes", `Registro de alterações (${eventos.length})`],
  ] as const;

  return (
    <section>
      <button onClick={() => setAberto((a) => !a)} className="mb-3 flex cursor-pointer items-center gap-1.5 text-base font-black text-ink">
        Histórico {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {aberto && (
        <>
          <div className="mb-4 flex flex-wrap gap-1">
            {abas.map(([v, rotulo]) => (
              <button
                key={v}
                onClick={() => setAba(v)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  aba === v ? "bg-primary/15 text-primary" : "text-ink hover:bg-accent",
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>
          {itens.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nada por aqui ainda.</p>
          ) : (
            <ol className="relative ml-2 space-y-5 border-l-2 border-dashed border-[#e3d5ef] pl-6">
              {itens.map((i) => (
                <li key={i.tipo === "nota" ? i.nota.id : i.tipo === "evento" ? i.evento.id : "criada"} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[35px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background",
                      i.tipo === "nota" ? "bg-warning text-white" : "bg-white text-muted-foreground shadow",
                    )}
                  >
                    {i.tipo === "nota" ? <StickyNote className="h-3 w-3" /> : <History className="h-3 w-3" />}
                  </span>
                  {i.tipo === "nota" && <CartaoNota duplaId={duplaId} nota={i.nota} />}
                  {i.tipo === "evento" && (
                    <div>
                      {i.evento.mudancas.map((m, k) => (
                        <p key={k} className="text-sm text-ink">
                          <span className="font-bold">{m.campo}:</span> {m.de} → {m.para}
                        </p>
                      ))}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {dataHoraBR(i.evento.em)} · {i.evento.autor}
                      </p>
                    </div>
                  )}
                  {i.tipo === "criada" && (
                    <div>
                      <p className="text-sm text-ink">
                        <span className="font-bold">Dupla criada:</span> {dataHoraBR(i.em)}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function CartaoNota({ duplaId, nota }: { duplaId: string; nota: Nota }) {
  const acao = useAcaoRadar();
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-[#f3dd9c] bg-[#fff8e1] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{dataHoraBR(nota.criadoEm)}</span>
        <span>· {nota.autor}</span>
        {nota.editadoEm && <span>(editada)</span>}
        {nota.fixada && <Pin className="h-3.5 w-3.5 text-primary" />}
        <div className="ml-auto flex">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label={nota.fixada ? "Desafixar" : "Fixar no Foco"}
            title={nota.fixada ? "Desafixar" : "Fixar no Foco"}
            onClick={() => acao.mutate({ acao: "fixarNota", duplaId, notaId: nota.id, fixada: !nota.fixada })}
          >
            {nota.fixada ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Editar anotação" onClick={() => setEditando(nota.texto)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Apagar anotação"
            onClick={() => confirm("Apagar esta anotação?") && acao.mutate({ acao: "apagarNota", duplaId, notaId: nota.id })}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {editando !== null ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            acao.mutate({ acao: "editarNota", duplaId, notaId: nota.id, texto: editando }, { onSuccess: () => setEditando(null) });
          }}
        >
          <Textarea autoFocus value={editando} onChange={(e) => setEditando(e.target.value)} className="min-h-24 bg-white" />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!editando.trim()}>
              Salvar
            </Button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{nota.texto}</p>
      )}
    </div>
  );
}
