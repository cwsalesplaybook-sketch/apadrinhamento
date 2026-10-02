import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import {
  METAS,
  calcularIndicadores,
  diasDesde,
  fase,
  pct,
  reunioesFeitas,
  type Dupla,
} from "@/lib/apadrinhamento";

function CardMeta({
  titulo,
  valor,
  meta,
  total,
  nota,
}: {
  titulo: string;
  valor: number;
  meta: number;
  total: number;
  nota: string;
}) {
  const bateu = valor >= meta;
  const largura = total ? Math.min(100, (valor / Math.max(total, 1)) * 100) : 0;
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-sm text-muted-foreground">{titulo}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`num text-4xl font-semibold ${bateu ? "text-success" : "text-foreground"}`}>{valor}</span>
        <span className="text-muted-foreground">
          / {total} · meta {meta}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${bateu ? "bg-success" : "bg-primary"}`} style={{ width: `${largura}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{nota}</div>
    </div>
  );
}

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
  const horasTotal = ind.horasPadrinho + ind.horasPsm;

  return (
    <AppLayout
      title="Painel do ciclo"
      subtitle="Indicadores do modelo de apadrinhamento"
      actions={
        <select
          className="rounded-lg border bg-card px-3 py-2 text-sm"
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
      }
    >
      {duplas.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="text-muted-foreground">Nenhuma dupla cadastrada ainda.</p>
          <Link to="/duplas" className="mt-3 inline-block font-medium text-primary">
            Cadastrar a primeira dupla →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CardMeta
              titulo="Execução: 4 reuniões feitas"
              valor={ind.execucao}
              meta={METAS.execucao}
              total={ind.total}
              nota="Mede a execução do método"
            />
            <CardMeta
              titulo="Ativação: venda originada até D30"
              valor={ind.ativacao}
              meta={METAS.ativacao}
              total={ind.total}
              nota={`Conduzidas até D30: ${ind.conduzidasD30} (piso ${METAS.conduzidasD30})`}
            />
            <CardMeta
              titulo="Autonomia: venda conduzida até D60"
              valor={ind.autonomia}
              meta={METAS.autonomia}
              total={ind.total}
              nota="Objetivo real do programa"
            />
            <div className="rounded-2xl border bg-ink p-5 text-ink-foreground">
              <div className="text-sm opacity-70">Aderência à cadência (check-ins)</div>
              <div className="num mt-2 text-4xl font-semibold text-primary">{pct(ind.aderencia)}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="num text-xl">{ind.formados}</div>
                  <span className="opacity-70">formados</span>
                </div>
                <div>
                  <div className="num text-xl">{ind.encerrados}</div>
                  <span className="opacity-70">encerrados</span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold">Funil das duplas</h2>
              <div className="mt-4 space-y-3">
                {ind.funil.map((f) => (
                  <div key={f.label} className="grid grid-cols-[140px_1fr_40px] items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <div className="h-6 rounded-md bg-muted">
                      <div className="h-6 rounded-md bg-primary" style={{ width: `${(f.valor / maxFunil) * 100}%` }} />
                    </div>
                    <span className="num text-right font-semibold">{f.valor}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Leads novos (pipeline próprio, além dos 6 iniciais): {ind.leadsNovos}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Horas investidas</h2>
              <div className="num mt-3 text-4xl font-semibold">{horasTotal.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">previsto por ciclo: {METAS.horasCiclo}h</div>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-chart-1"
                  style={{ width: `${horasTotal ? (ind.horasPadrinho / horasTotal) * 100 : 0}%` }}
                />
                <div className="bg-chart-4" style={{ width: `${horasTotal ? (ind.horasPsm / horasTotal) * 100 : 0}%` }} />
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full bg-chart-1" />
                    Padrinhos
                  </span>
                  <b className="num">{ind.horasPadrinho.toFixed(1)}h</b>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full bg-chart-4" />
                    PSM
                  </span>
                  <b className="num">{ind.horasPsm.toFixed(1)}h</b>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Onde cada dupla está</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtradas.map((d) => {
                const dia = diasDesde(d.data_inicio);
                const alerta = dia === 15 || dia === 30 || (dia > 30 && !d.venda_originada);
                return (
                  <div key={d.id} className={`rounded-xl border p-4 ${alerta ? "border-warning bg-warning/10" : ""}`}>
                    <div className="flex justify-between text-sm">
                      <b>{d.afilhado}</b>
                      <span className="num font-semibold text-primary">D{dia}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Padrinho: {d.padrinho} · Ciclo {d.ciclo}
                    </div>
                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1.5 flex-1 rounded-full ${n <= reunioesFeitas(d) ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-2 text-xs">
                      {fase(dia)}
                      {d.venda_originada ? " · ✓ originada" : ""}
                      {d.venda_conduzida ? " · ✓ conduzida" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
