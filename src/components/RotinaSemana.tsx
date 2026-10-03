import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconeCirculo } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import {
  INDICADORES_PADRAO,
  diasDaSemana,
  hojeISO,
  nomeDe,
  somarDias,
  useAcaoRadar,
  useEu,
  useRadar,
  type DadosRadar,
  type Indicador,
} from "@/lib/radar";

/* Rotina da semana na Weekly: o que cada pessoa fez, dia a dia, em números
   (reuniões, no-show, …), com totais no estilo do Painel. Guardado em /api/radar. */

const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function indicadoresDe(dados: DadosRadar | undefined, email: string) {
  return dados?.rotina?.[email]?.indicadores?.length ? dados.rotina[email].indicadores! : INDICADORES_PADRAO;
}

function totais(dados: DadosRadar | undefined, email: string, dias: string[]) {
  const t: Record<string, number> = {};
  for (const dia of dias)
    for (const [k, v] of Object.entries(dados?.rotina?.[email]?.dias?.[dia]?.valores ?? {})) t[k] = (t[k] ?? 0) + v;
  return t;
}

function Variacao({ agora, antes, inverter = false }: { agora: number; antes: number; inverter?: boolean }) {
  if (agora === antes) return <span className="text-xs text-muted-foreground">= semana anterior</span>;
  const sobe = agora > antes;
  const bom = inverter ? !sobe : sobe;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-bold", bom ? "text-emerald-600" : "text-destructive")}>
      {sobe ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
      {fmt(Math.abs(agora - antes))} vs. semana anterior
    </span>
  );
}

export function RotinaSemana({ dataWeekly }: { dataWeekly: string | null }) {
  const radar = useRadar();
  const acao = useAcaoRadar();
  const { email: eu } = useEu();
  const [pessoa, setPessoa] = useState<string>("");
  const [editandoIndicadores, setEditandoIndicadores] = useState(false);

  const quem = pessoa || eu;
  const minha = quem === eu;
  const dias = useMemo(() => diasDaSemana(dataWeekly ?? hojeISO()), [dataWeekly]);
  const diasAntes = useMemo(() => dias.map((d) => somarDias(d, -7)), [dias]);
  const dados = radar.data;
  const indicadores = indicadoresDe(dados, quem);
  const total = totais(dados, quem, dias);
  const totalAntes = totais(dados, quem, diasAntes);
  const pessoas = useMemo(() => {
    const lista = new Set([eu, ...Object.keys(dados?.rotina ?? {})].filter(Boolean));
    return [...lista];
  }, [dados?.rotina, eu]);

  const temReunioes = indicadores.some((i) => i.id === "reunioes");
  const temNoShow = indicadores.some((i) => i.id === "noshow");
  const taxa = (t: Record<string, number>) => {
    const base = (t.reunioes ?? 0) + (t.noshow ?? 0);
    return base ? (t.noshow ?? 0) / base : null;
  };

  return (
    <section className="cartao mb-6 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <IconeCirculo icon={Activity} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black text-ink">{minha ? "Minha rotina na semana" : `Rotina de ${nomeDe(quem, dados?.perfis)}`}</h2>
          <p className="text-sm text-muted-foreground">
            {diaMes(dias[0])} a {diaMes(dias[6])} · o que foi feito em cada dia, em números
          </p>
        </div>
        {pessoas.length > 1 && (
          <select
            aria-label="Rotina de quem"
            value={quem}
            onChange={(e) => setPessoa(e.target.value === eu ? "" : e.target.value)}
            className="seletor-3d h-10 cursor-pointer px-3 text-sm font-bold text-ink outline-none"
          >
            {pessoas.map((p) => (
              <option key={p} value={p}>
                {p === eu ? "Minha rotina" : nomeDe(p, dados?.perfis)}
              </option>
            ))}
          </select>
        )}
        {minha && (
          <Button variant="outline" onClick={() => setEditandoIndicadores(true)} disabled={!dados}>
            <Settings2 className="h-4 w-4" /> Indicadores
          </Button>
        )}
      </div>

      {radar.isError ? (
        <p className="mt-4 text-sm text-muted-foreground">Não consegui carregar a rotina: {(radar.error as Error).message}</p>
      ) : !dados ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          {/* Totais da semana */}
          <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]">
            {indicadores.map((i) => (
              <div key={i.id} className="rounded-2xl border border-[#ece3f6] bg-white px-4 py-3">
                <div className="truncate text-sm text-muted-foreground" title={i.nome}>
                  {i.nome}
                </div>
                <div className="num text-3xl text-ink">{fmt(total[i.id] ?? 0)}</div>
                <Variacao agora={total[i.id] ?? 0} antes={totalAntes[i.id] ?? 0} inverter={i.id === "noshow"} />
              </div>
            ))}
            {temReunioes && temNoShow && (
              <div className="cartao-escuro px-4 py-3">
                <div className="text-sm text-white/80">Taxa de no-show</div>
                <div className="num text-3xl text-warning">
                  {taxa(total) === null ? "—" : `${Math.round(taxa(total)! * 100)}%`}
                </div>
                <div className="text-xs text-white/70">
                  semana anterior: {taxa(totalAntes) === null ? "—" : `${Math.round(taxa(totalAntes)! * 100)}%`}
                </div>
              </div>
            )}
          </div>

          {temReunioes && (
            <GraficoDias
              dias={dias}
              valores={(dia) => dados.rotina?.[quem]?.dias?.[dia]?.valores ?? {}}
              mostrarNoShow={temNoShow}
            />
          )}

          {/* Dia a dia */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">Dia</th>
                  {indicadores.map((i) => (
                    <th key={i.id} className="px-2 py-2 font-medium">
                      {i.nome}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-medium">Observações do dia</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((dia, n) => (
                  <LinhaDia
                    key={`${quem}-${dia}`}
                    rotulo={`${NOMES_DIA[n]} ${diaMes(dia)}`}
                    hoje={dia === hojeISO()}
                    indicadores={indicadores}
                    salvo={dados.rotina?.[quem]?.dias?.[dia]}
                    editavel={minha}
                    salvar={(valores, nota) => acao.mutate({ acao: "salvarRotinaDia", data: dia, valores, nota })}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#ece3f6] font-black text-ink">
                  <td className="py-2.5 pr-3">Semana</td>
                  {indicadores.map((i) => (
                    <td key={i.id} className="num px-2 py-2.5">
                      {fmt(total[i.id] ?? 0)}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {minha && (
            <p className="mt-2 text-xs text-muted-foreground">Os números são salvos sozinhos quando você sai do campo.</p>
          )}
        </>
      )}

      {dados && (
        <EditorIndicadores
          aberto={editandoIndicadores}
          fechar={() => setEditandoIndicadores(false)}
          atuais={indicadoresDe(dados, eu)}
          salvar={(lista) =>
            acao.mutate({ acao: "salvarIndicadoresRotina", indicadores: lista }, { onSuccess: () => setEditandoIndicadores(false) })
          }
        />
      )}
    </section>
  );
}

function LinhaDia({
  rotulo,
  hoje,
  indicadores,
  salvo,
  editavel,
  salvar,
}: {
  rotulo: string;
  hoje: boolean;
  indicadores: Indicador[];
  salvo?: { valores: Record<string, number>; nota?: string };
  editavel: boolean;
  salvar: (valores: Record<string, number | "">, nota: string) => void;
}) {
  const original = useMemo(
    () => ({
      valores: Object.fromEntries(indicadores.map((i) => [i.id, salvo?.valores[i.id] ?? ""])) as Record<string, number | "">,
      nota: salvo?.nota ?? "",
    }),
    // Só recarrega quando o conteúdo salvo muda (não a cada atualização em segundo plano).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(salvo ?? null), indicadores.map((i) => i.id).join("|")],
  );
  const [rascunho, setRascunho] = useState(original);
  useEffect(() => setRascunho(original), [original]);

  const gravarSeMudou = () => {
    if (JSON.stringify(rascunho) !== JSON.stringify(original)) salvar(rascunho.valores, rascunho.nota);
  };

  return (
    <tr className={cn("border-t border-[#f1eaf8]", hoje && "bg-primary/5")}>
      <td className="whitespace-nowrap py-1.5 pr-3 font-bold text-ink">
        {rotulo}
        {hoje && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] text-white">hoje</span>}
      </td>
      {indicadores.map((i) => (
        <td key={i.id} className="px-2 py-1.5">
          {editavel ? (
            <Input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              aria-label={`${i.nome} em ${rotulo}`}
              className="h-9 w-24"
              value={rascunho.valores[i.id] ?? ""}
              onChange={(e) =>
                setRascunho((r) => ({ ...r, valores: { ...r.valores, [i.id]: e.target.value === "" ? "" : Number(e.target.value) } }))
              }
              onBlur={gravarSeMudou}
            />
          ) : (
            <span className="num">{rascunho.valores[i.id] === "" ? "—" : fmt(Number(rascunho.valores[i.id]))}</span>
          )}
        </td>
      ))}
      <td className="px-2 py-1.5">
        {editavel ? (
          <Input
            aria-label={`Observações de ${rotulo}`}
            className="h-9 min-w-48"
            placeholder={hoje ? "Ex.: 2 remarcadas para quinta" : "Observação"}
            value={rascunho.nota}
            onChange={(e) => setRascunho((r) => ({ ...r, nota: e.target.value }))}
            onBlur={gravarSeMudou}
          />
        ) : (
          <span className="text-muted-foreground">{rascunho.nota || "—"}</span>
        )}
      </td>
    </tr>
  );
}

function GraficoDias({
  dias,
  valores,
  mostrarNoShow,
}: {
  dias: string[];
  valores: (dia: string) => Record<string, number>;
  mostrarNoShow: boolean;
}) {
  const linhas = dias.map((dia) => ({ dia, r: valores(dia).reunioes ?? 0, n: mostrarNoShow ? valores(dia).noshow ?? 0 : 0 }));
  const max = Math.max(1, ...linhas.map((l) => l.r + l.n));
  return (
    <div className="mt-5 rounded-2xl border border-[#ece3f6] bg-white px-4 pb-3 pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-bold text-ink">Por dia</span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-primary" /> Reuniões realizadas
        </span>
        {mostrarNoShow && (
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-destructive" /> No-show
          </span>
        )}
      </div>
      <div className="flex h-32 items-end gap-3">
        {linhas.map((l, i) => (
          <div key={l.dia} className="flex flex-1 flex-col items-center gap-1">
            <span className="num text-xs text-ink">{l.r + l.n || ""}</span>
            <div className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-t-lg" style={{ height: `${((l.r + l.n) / max) * 96}px` }}>
              <div className="bg-primary" style={{ height: `${l.r + l.n ? (l.r / (l.r + l.n)) * 100 : 0}%` }} />
              <div className="bg-destructive" style={{ height: `${l.r + l.n ? (l.n / (l.r + l.n)) * 100 : 0}%` }} />
            </div>
            <span className="text-[11px] text-muted-foreground">{NOMES_DIA[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorIndicadores({
  aberto,
  fechar,
  atuais,
  salvar,
}: {
  aberto: boolean;
  fechar: () => void;
  atuais: Indicador[];
  salvar: (lista: Indicador[]) => void;
}) {
  const [lista, setLista] = useState(atuais);
  useEffect(() => {
    if (aberto) setLista(atuais);
  }, [aberto, atuais]);
  const mover = (i: number, d: -1 | 1) =>
    setLista((l) => {
      const n = [...l];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="titulo-h1 text-2xl text-ink">Indicadores da minha rotina</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          "Reuniões realizadas" e "No-show" calculam a taxa de no-show. Tirar um indicador não apaga os números já salvos.
        </p>
        <ul className="space-y-2">
          {lista.map((ind, i) => (
            <li key={ind.id} className="flex items-center gap-2">
              <Input value={ind.nome} onChange={(e) => setLista((l) => l.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} />
              <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label="Descer">
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={lista.length === 1}
                onClick={() => setLista((l) => l.filter((_, j) => j !== i))}
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={lista.length >= 12}
            onClick={() => setLista((l) => [...l, { id: `ind-${Date.now().toString(36)}`, nome: "Novo indicador" }])}
          >
            <Plus className="h-4 w-4" /> Adicionar indicador
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="button" disabled={lista.some((x) => !x.nome.trim())} onClick={() => salvar(lista)}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
