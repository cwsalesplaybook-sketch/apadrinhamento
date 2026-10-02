import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  FileText,
  List,
  Pencil,
  Plus,
  Settings2,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  aderencia,
  dataBR,
  diasDesde,
  pct,
  reunioesFeitas,
  type Dupla,
} from "@/lib/apadrinhamento";
import {
  dataHoraBR,
  posicaoDa,
  useAcaoRadar,
  useRadar,
  type DadosRadar,
  type Pipeline,
} from "@/lib/radar";

type Rascunho = Partial<Dupla> & Record<string, unknown>;

const NOVA: Rascunho = {
  padrinho: "",
  afilhado: "",
  ciclo: 1,
  data_inicio: new Date().toISOString().slice(0, 10),
  status: "em_andamento",
  leads_entregues: 0,
  leads_novos: 0,
  checkins_realizados: 0,
  checkins_faltados: 0,
  horas_padrinho: 0,
  horas_psm: 0,
};

const COLUNAS = [
  "Afilhado",
  "Padrinho",
  "Ciclo",
  "Dia",
  "Etapa",
  "Status",
  "Reuniões",
  "Leads",
  "Check-ins",
  "Originada",
  "Conduzida",
  "Horas",
];

type Visao = "funil" | "lista";

function useLembrar<T extends string>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      return (localStorage.getItem(chave) as T) || inicial;
    } catch {
      return inicial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(chave, valor);
    } catch {
      /* navegador sem storage: só não lembra */
    }
  }, [chave, valor]);
  return [valor, setValor] as const;
}

export function DuplasPage() {
  const [visao, setVisao] = useLembrar<Visao>("radar:visao-duplas", "funil");
  const [pipelineId, setPipelineId] = useLembrar<string>("radar:funil", "");
  const [aberta, setAberta] = useState<Rascunho | null>(null);
  const navigate = useNavigate();
  const abrirDupla = (d: Dupla) => navigate({ to: "/duplas/$id", params: { id: d.id } });
  const [editandoFunis, setEditandoFunis] = useState(false);

  const { data: duplas = [] } = useQuery({
    queryKey: ["duplas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("duplas").select("*").order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Dupla[];
    },
  });
  const radar = useRadar();
  const pipeline = radar.data?.pipelines.find((p) => p.id === pipelineId) ?? radar.data?.pipelines[0];

  return (
    <AppLayout
      icon={Users}
      title="Duplas"
      subtitle="Registro de reuniões, check-ins, leads e vendas"
      actions={
        <Button onClick={() => setAberta(NOVA)}>
          <Plus className="h-4 w-4" /> Nova dupla
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="cartao flex p-1">
          {(
            [
              ["funil", "Funil", Columns3],
              ["lista", "Lista", List],
            ] as const
          ).map(([v, rotulo, I]) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-colors",
                visao === v ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-ink",
              )}
            >
              <I className="h-4 w-4" /> {rotulo}
            </button>
          ))}
        </div>
        {visao === "funil" && radar.data && (
          <>
            <select
              aria-label="Funil"
              className="cartao h-11 cursor-pointer px-4 text-sm font-bold text-ink outline-none"
              value={pipeline?.id ?? ""}
              onChange={(e) => setPipelineId(e.target.value)}
            >
              {radar.data.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setEditandoFunis(true)}>
              <Settings2 className="h-4 w-4" /> Editar funis
            </Button>
          </>
        )}
      </div>

      {visao === "funil" ? (
        radar.isError ? (
          <div className="cartao px-6 py-10 text-center text-muted-foreground">
            Não consegui carregar os funis: {(radar.error as Error).message}
          </div>
        ) : !radar.data || !pipeline ? (
          <div className="cartao px-6 py-10 text-center text-muted-foreground">Carregando funil…</div>
        ) : (
          <Kanban pipeline={pipeline} dados={radar.data} duplas={duplas} abrir={abrirDupla} />
        )
      ) : (
        <Lista duplas={duplas} dados={radar.data} abrir={abrirDupla} />
      )}

      <PainelDupla
        dupla={aberta}
        fechar={() => setAberta(null)}
        pipelinePadrao={pipeline}
        dados={radar.data}
      />
      {radar.data && (
        <EditorFunis
          aberto={editandoFunis}
          fechar={() => setEditandoFunis(false)}
          pipelines={radar.data.pipelines}
          contagem={(etapaId) =>
            duplas.filter((d) => posicaoDa(radar.data, d.id)?.etapa.id === etapaId).length
          }
          aoCriar={setPipelineId}
        />
      )}
    </AppLayout>
  );
}

/* ---------------- Funil (kanban) ---------------- */

function Kanban({
  pipeline,
  dados,
  duplas,
  abrir,
}: {
  pipeline: Pipeline;
  dados: DadosRadar;
  duplas: Dupla[];
  abrir: (d: Dupla) => void;
}) {
  const acao = useAcaoRadar();
  const [sobre, setSobre] = useState<string | null>(null);
  const daqui = duplas.filter((d) => posicaoDa(dados, d.id)?.pipeline.id === pipeline.id);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipeline.etapas.map((etapa) => {
        const cards = daqui.filter((d) => posicaoDa(dados, d.id)?.etapa.id === etapa.id);
        return (
          <section
            key={etapa.id}
            onDragOver={(e) => {
              e.preventDefault();
              setSobre(etapa.id);
            }}
            onDragLeave={() => setSobre((s) => (s === etapa.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setSobre(null);
              const duplaId = e.dataTransfer.getData("text/plain");
              if (duplaId && posicaoDa(dados, duplaId)?.etapa.id !== etapa.id)
                acao.mutate({ acao: "mover", duplaId, pipelineId: pipeline.id, etapaId: etapa.id });
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-[22px] border border-[#ece3f6] bg-white/55 p-3 transition-colors",
              sobre === etapa.id && "border-primary bg-primary/10",
            )}
          >
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <h3 className="truncate text-sm font-black text-ink" title={etapa.nome}>
                {etapa.nome}
              </h3>
              <span className="num rounded-full bg-white px-2.5 py-0.5 text-xs text-primary shadow-sm">{cards.length}</span>
            </header>
            <div className="flex min-h-24 flex-1 flex-col gap-2.5">
              {cards.map((d) => {
                const notas = dados.notas[d.id]?.length ?? 0;
                return (
                  <button
                    key={d.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", d.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => abrir(d)}
                    className="cartao cursor-grab p-3.5 text-left transition-transform hover:-translate-y-0.5 active:cursor-grabbing"
                  >
                    <div className="font-black leading-tight text-ink">{d.afilhado}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Padrinho: {d.padrinho}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="num rounded-full bg-primary/10 px-2 py-0.5 text-primary">D{diasDesde(d.data_inicio)}</span>
                      <span className="rounded-full bg-accent px-2 py-0.5">{STATUS_LABEL[d.status] ?? d.status}</span>
                      <span className="text-muted-foreground">{reunioesFeitas(d)}/4 reuniões</span>
                      {notas > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-muted-foreground" title="Anotações">
                          <StickyNote className="h-3.5 w-3.5" /> {notas}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {cards.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-[#e3d5ef] px-3 py-6 text-center text-xs text-muted-foreground">
                  Arraste uma dupla para cá
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- Lista ---------------- */

function Lista({ duplas, dados, abrir }: { duplas: Dupla[]; dados?: DadosRadar; abrir: (d: Dupla) => void }) {
  return (
    <div className="overflow-x-auto cartao">
      <table className="w-full whitespace-nowrap text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {COLUNAS.map((c) => (
              <th key={c} className="px-3 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {duplas.length === 0 && (
            <tr>
              <td colSpan={COLUNAS.length} className="px-4 py-10 text-center text-muted-foreground">
                <img src="/brand/cardapinho-oculos.webp" alt="" aria-hidden className="mx-auto mb-3 h-32 select-none" />
                Nenhuma dupla ainda. Clique em “Nova dupla”.
              </td>
            </tr>
          )}
          {duplas.map((d) => (
            <tr key={d.id} onClick={() => abrir(d)} className="cursor-pointer border-t transition-colors hover:bg-accent/60">
              <td className="px-3 py-3 font-medium">{d.afilhado}</td>
              <td className="px-3 py-3">{d.padrinho}</td>
              <td className="px-3 py-3">{d.ciclo}</td>
              <td className="num px-3 py-3">D{diasDesde(d.data_inicio)}</td>
              <td className="px-3 py-3">{posicaoDa(dados, d.id)?.etapa.nome ?? "—"}</td>
              <td className="px-3 py-3">
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{STATUS_LABEL[d.status] ?? d.status}</span>
              </td>
              <td className="num px-3 py-3">{reunioesFeitas(d)}/4</td>
              <td className="num px-3 py-3">
                {d.leads_entregues} <span className="text-muted-foreground">+{d.leads_novos}</span>
              </td>
              <td className="px-3 py-3">{pct(aderencia(d))}</td>
              <td className="px-3 py-3">{dataBR(d.venda_originada)}</td>
              <td className="px-3 py-3">{dataBR(d.venda_conduzida)}</td>
              <td className="num px-3 py-3">{(Number(d.horas_padrinho) + Number(d.horas_psm)).toFixed(1)}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Detalhe da dupla (Dados + Anotações) ---------------- */

function PainelDupla({
  dupla,
  fechar,
  pipelinePadrao,
  dados,
}: {
  dupla: Rascunho | null;
  fechar: () => void;
  pipelinePadrao?: Pipeline;
  dados?: DadosRadar;
}) {
  const qc = useQueryClient();
  const acao = useAcaoRadar();
  const [aba, setAba] = useState<"dados" | "notas">("dados");
  const [rascunho, setRascunho] = useState<Rascunho | null>(dupla);
  const [destino, setDestino] = useState<{ pipelineId: string; etapaId: string } | null>(null);

  useEffect(() => {
    setRascunho(dupla);
    setAba("dados");
    setDestino(null);
  }, [dupla]);

  const nova = !dupla?.id;
  const atual = dupla?.id ? posicaoDa(dados, dupla.id) : null;
  const pipelineSel =
    dados?.pipelines.find((p) => p.id === (destino?.pipelineId ?? atual?.pipeline.id)) ?? pipelinePadrao;
  const etapaSel =
    pipelineSel?.etapas.find((e) => e.id === (destino?.etapaId ?? atual?.etapa.id)) ?? pipelineSel?.etapas[0];

  const salvar = useMutation({
    mutationFn: async (d: Rascunho) => {
      const { id, created_at: _criado, ...campos } = Object.fromEntries(
        Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
      ) as Rascunho;
      if (id) {
        const res = await supabase.from("duplas").update(campos).eq("id", id);
        if (res.error) throw res.error;
        return id as string;
      }
      const res = await supabase.from("duplas").insert(campos).select("id").single();
      if (res.error) throw res.error;
      return res.data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["duplas"] });
      if (nova && pipelineSel && etapaSel)
        acao.mutate({ acao: "mover", duplaId: id, pipelineId: pipelineSel.id, etapaId: etapaSel.id });
      toast.success(nova ? "Dupla criada" : "Dados salvos");
      if (nova) fechar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("duplas").delete().eq("id", id);
      if (error) throw error;
      acao.mutate({ acao: "apagarDupla", duplaId: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duplas"] });
      toast.success("Dupla excluída");
      fechar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function mudarEtapa(pipelineId: string, etapaId: string) {
    setDestino({ pipelineId, etapaId });
    if (!nova && dupla?.id) acao.mutate({ acao: "mover", duplaId: dupla.id, pipelineId, etapaId });
  }

  const notas = dupla?.id ? (dados?.notas[dupla.id] ?? []) : [];

  return (
    <Sheet open={!!dupla} onOpenChange={(a) => !a && fechar()}>
      <SheetContent>
        {rascunho && (
          <>
            <div className="border-b px-7 pb-4 pt-6">
              <SheetTitle className="titulo-h1 pr-10 text-2xl leading-tight text-ink">
                {nova ? "Nova dupla" : rascunho.afilhado || "Dupla"}
              </SheetTitle>
              {!nova && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Padrinho: {rascunho.padrinho} · D{diasDesde(String(rascunho.data_inicio))} · início {dataBR(String(rascunho.data_inicio))}
                </p>
              )}
              {dados && pipelineSel && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Funil"
                      className="rounded-xl border bg-white px-3 py-1.5 text-sm font-bold text-ink"
                      value={pipelineSel.id}
                      onChange={(e) => {
                        const p = dados.pipelines.find((x) => x.id === e.target.value)!;
                        mudarEtapa(p.id, p.etapas[0].id);
                      }}
                    >
                      {dados.pipelines.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground">Clique numa etapa para mover a dupla</span>
                  </div>
                  {/* Barra de etapas, como no topo do negócio no Pipedrive */}
                  <div className="flex overflow-hidden rounded-xl">
                    {pipelineSel.etapas.map((e, i) => {
                      const idxAtual = pipelineSel.etapas.findIndex((x) => x.id === etapaSel?.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          title={e.nome}
                          onClick={() => mudarEtapa(pipelineSel.id, e.id)}
                          className={cn(
                            "min-w-0 flex-1 cursor-pointer truncate border-r border-white/60 px-2 py-2 text-xs font-bold transition-colors last:border-r-0",
                            i <= idxAtual ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-[#e6d6f3]",
                          )}
                        >
                          {e.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!nova && (
                <div className="mt-5 flex gap-1">
                  {(
                    [
                      ["dados", "Dados", FileText],
                      ["notas", `Anotações${notas.length ? ` (${notas.length})` : ""}`, StickyNote],
                    ] as const
                  ).map(([v, rotulo, I]) => (
                    <button
                      key={v}
                      onClick={() => setAba(v)}
                      className={cn(
                        "-mb-[17px] flex cursor-pointer items-center gap-2 border-b-[3px] px-4 pb-3 pt-1 text-sm font-bold transition-colors",
                        aba === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-ink",
                      )}
                    >
                      <I className="h-4 w-4" /> {rotulo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              {aba === "dados" || nova ? (
                <FormDupla
                  rascunho={rascunho}
                  setRascunho={setRascunho}
                  salvando={salvar.isPending}
                  aoSalvar={() => salvar.mutate(rascunho)}
                  aoCancelar={fechar}
                  aoExcluir={
                    nova
                      ? undefined
                      : () => confirm("Excluir esta dupla? As anotações dela também serão apagadas.") && excluir.mutate(String(rascunho.id))
                  }
                />
              ) : (
                <Anotacoes duplaId={String(dupla!.id)} notas={notas} />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FormDupla({
  rascunho,
  setRascunho,
  salvando,
  aoSalvar,
  aoCancelar,
  aoExcluir,
}: {
  rascunho: Rascunho;
  setRascunho: (f: (d: Rascunho | null) => Rascunho | null) => void;
  salvando: boolean;
  aoSalvar: () => void;
  aoCancelar: () => void;
  aoExcluir?: () => void;
}) {
  const alterar =
    (campo: string, numero = false) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setRascunho((d) => ({ ...d, [campo]: numero ? Number(e.target.value) : e.target.value }));

  const campo = (nome: string, rotulo: string, tipo = "text") => (
    <div className="space-y-1">
      <Label className="text-xs">{rotulo}</Label>
      <Input
        type={tipo}
        value={(rascunho[nome] as string | number | undefined) ?? ""}
        onChange={alterar(nome, tipo === "number")}
        step={tipo === "number" ? "any" : undefined}
        required={nome === "afilhado" || nome === "padrinho"}
      />
    </div>
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        aoSalvar();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("afilhado", "Afilhado")}
        {campo("padrinho", "Padrinho")}
        {campo("ciclo", "Ciclo", "number")}
        {campo("data_inicio", "Início (D0)", "date")}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Status</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={rascunho.status ?? ""}
            onChange={alterar("status")}
          >
            {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="rotulo mb-2 text-xs text-primary">Fluxo ABC — datas das reuniões</legend>
        {campo("reuniao1", "Reunião 1", "date")}
        {campo("reuniao2", "Reunião 2", "date")}
        {campo("reuniao3", "Reunião 3", "date")}
        {campo("reuniao4", "Reunião 4", "date")}
      </fieldset>
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="rotulo mb-2 text-xs text-primary">Leads e check-ins</legend>
        {campo("leads_entregues", "Leads iniciais", "number")}
        {campo("leads_novos", "Leads novos", "number")}
        {campo("checkins_realizados", "Check-ins feitos", "number")}
        {campo("checkins_faltados", "Check-ins faltados", "number")}
      </fieldset>
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="rotulo mb-2 text-xs text-primary">Vendas e horas</legend>
        {campo("venda_originada", "1ª venda originada", "date")}
        {campo("venda_conduzida", "1ª venda conduzida", "date")}
        {campo("horas_padrinho", "Horas padrinho", "number")}
        {campo("horas_psm", "Horas PSM", "number")}
      </fieldset>
      <div className="space-y-1">
        <Label className="text-xs">Observações</Label>
        <Textarea value={(rascunho.observacoes as string | null) ?? ""} onChange={alterar("observacoes")} />
      </div>
      <div className="flex items-center gap-2">
        {aoExcluir && (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={aoExcluir}>
            <Trash2 className="h-4 w-4" /> Excluir dupla
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={aoCancelar}>
            {aoExcluir ? "Fechar" : "Cancelar"}
          </Button>
          <Button type="submit" disabled={salvando}>
            Salvar
          </Button>
        </div>
      </div>
    </form>
  );
}

function Anotacoes({ duplaId, notas }: { duplaId: string; notas: DadosRadar["notas"][string] }) {
  const acao = useAcaoRadar();
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);

  return (
    <div className="space-y-6">
      <form
        className="cartao space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          acao.mutate({ acao: "nota", duplaId, texto }, { onSuccess: () => setTexto("") });
        }}
      >
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma anotação sobre esta dupla…"
          className="min-h-28 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={acao.isPending || !texto.trim()}>
            Salvar anotação
          </Button>
        </div>
      </form>

      {notas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma anotação ainda.</p>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-[#e3d5ef] pl-6">
          {notas.map((n) => (
            <li key={n.id} className="relative">
              <span className="absolute -left-[33px] top-4 flex h-4 w-4 items-center justify-center rounded-full bg-warning ring-4 ring-background" />
              <div className="rounded-2xl border border-[#f3dd9c] bg-[#fff8e1] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-ink">{n.autor}</span>
                  <span>· {dataHoraBR(n.criadoEm)}</span>
                  {n.editadoEm && <span>(editada)</span>}
                  <div className="ml-auto flex">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Editar anotação"
                      onClick={() => setEditando({ id: n.id, texto: n.texto })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Apagar anotação"
                      onClick={() => confirm("Apagar esta anotação?") && acao.mutate({ acao: "apagarNota", duplaId, notaId: n.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {editando?.id === n.id ? (
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      acao.mutate(
                        { acao: "editarNota", duplaId, notaId: n.id, texto: editando.texto },
                        { onSuccess: () => setEditando(null) },
                      );
                    }}
                  >
                    <Textarea
                      autoFocus
                      value={editando.texto}
                      onChange={(e) => setEditando({ id: n.id, texto: e.target.value })}
                      className="min-h-24 bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditando(null)}>
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={!editando.texto.trim()}>
                        Salvar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{n.texto}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------------- Editor de funis ---------------- */

function novoId() {
  return crypto.randomUUID();
}

function EditorFunis({
  aberto,
  fechar,
  pipelines,
  contagem,
  aoCriar,
}: {
  aberto: boolean;
  fechar: () => void;
  pipelines: Pipeline[];
  contagem: (etapaId: string) => number;
  aoCriar: (id: string) => void;
}) {
  const acao = useAcaoRadar();
  const [lista, setLista] = useState<Pipeline[]>(pipelines);
  const [selId, setSelId] = useState(pipelines[0]?.id);

  useEffect(() => {
    if (aberto) {
      setLista(structuredClone(pipelines));
      setSelId((s) => (pipelines.some((p) => p.id === s) ? s : pipelines[0]?.id));
    }
    // só ao abrir: não perder o que está sendo editado se os dados recarregarem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const sel = lista.find((p) => p.id === selId) ?? lista[0];
  const mudar = (fn: (p: Pipeline) => Pipeline) => setLista((l) => l.map((p) => (p.id === sel.id ? fn(p) : p)));
  const moverEtapa = (i: number, delta: number) =>
    mudar((p) => {
      const etapas = [...p.etapas];
      [etapas[i], etapas[i + delta]] = [etapas[i + delta], etapas[i]];
      return { ...p, etapas };
    });

  function criarFunil() {
    const p: Pipeline = { id: novoId(), nome: "Novo funil", etapas: [{ id: novoId(), nome: "Etapa 1" }] };
    setLista((l) => [...l, p]);
    setSelId(p.id);
  }

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar funis</DialogTitle>
        </DialogHeader>
        {sel && (
          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <div className="space-y-1.5">
              <div className="rotulo mb-2 text-xs text-primary">Funis</div>
              {lista.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelId(p.id)}
                  className={cn(
                    "block w-full cursor-pointer truncate rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors",
                    p.id === sel.id ? "bg-primary text-white" : "text-ink hover:bg-accent",
                  )}
                >
                  {p.nome || "Sem nome"}
                </button>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={criarFunil}>
                <Plus className="h-4 w-4" /> Novo funil
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Nome do funil</Label>
                <Input value={sel.nome} onChange={(e) => mudar((p) => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <div className="rotulo mb-2 text-xs text-primary">Etapas (na ordem do funil)</div>
                <ol className="space-y-2">
                  {sel.etapas.map((e, i) => {
                    const n = contagem(e.id);
                    return (
                      <li key={e.id} className="flex items-center gap-2">
                        <span className="num w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
                        <Input
                          value={e.nome}
                          onChange={(ev) =>
                            mudar((p) => ({
                              ...p,
                              etapas: p.etapas.map((x) => (x.id === e.id ? { ...x, nome: ev.target.value } : x)),
                            }))
                          }
                        />
                        <span className="w-16 shrink-0 whitespace-nowrap text-xs text-muted-foreground" title="Duplas nesta etapa">
                          {n > 0 && `${n} dupla${n > 1 ? "s" : ""}`}
                        </span>
                        <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => moverEtapa(i, -1)} aria-label="Subir">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={i === sel.etapas.length - 1}
                          onClick={() => moverEtapa(i, 1)}
                          aria-label="Descer"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={sel.etapas.length === 1}
                          aria-label="Remover etapa"
                          onClick={() =>
                            (n === 0 ||
                              confirm(`"${e.nome}" tem ${n} dupla(s). Ao salvar, elas vão para a primeira etapa do funil. Remover?`)) &&
                            mudar((p) => ({ ...p, etapas: p.etapas.filter((x) => x.id !== e.id) }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ol>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => mudar((p) => ({ ...p, etapas: [...p.etapas, { id: novoId(), nome: "Nova etapa" }] }))}
                >
                  <Plus className="h-4 w-4" /> Adicionar etapa
                </Button>
              </div>
              {lista.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (!confirm(`Excluir o funil "${sel.nome}"? As duplas dele vão para o primeiro funil.`)) return;
                    const resto = lista.filter((p) => p.id !== sel.id);
                    setLista(resto);
                    setSelId(resto[0].id);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Excluir este funil
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={fechar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={acao.isPending}
            onClick={() =>
              acao.mutate(
                { acao: "salvarPipelines", pipelines: lista },
                {
                  onSuccess: () => {
                    toast.success("Funis salvos");
                    if (sel && !pipelines.some((p) => p.id === sel.id)) aoCriar(sel.id);
                    fechar();
                  },
                },
              )
            }
          >
            Salvar funis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
