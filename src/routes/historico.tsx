import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, ChevronDown, Crown, History, Search, StickyNote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, dataBR, type Dupla, type StatusDupla } from "@/lib/apadrinhamento";
import { chamar, dataHoraBR, type Mudanca } from "@/lib/radar";

/* Ciclos de 7 dias (segunda 00:00 a domingo 23:59). O servidor salva cada semana sozinho
   toda segunda-feira (agendamento da Vercel); não há fechamento manual. Ver api/_ciclos.js. */

interface FotoDupla {
  id: string;
  afilhado: string;
  padrinho: string;
  nome: string | null;
  status: string;
  dia: number;
  funil: string;
  etapa: string;
  reunioes: number;
  leads_entregues: number;
  leads_novos: number;
  checkins_realizados: number;
  checkins_faltados: number;
  venda_originada: string | null;
  venda_conduzida: string | null;
  horas: number;
  eventos: { id: string; tipo: string; mudancas: Mudanca[]; autor: string; em: string }[];
  notas: { id: string; texto: string; autor: string; criadoEm: string }[];
  lideranca?: { id: string; texto: string; autor: string; criadoEm: string }[];
}

interface Ciclo {
  numero: number;
  inicio: string;
  fim: string;
  fechadoEm: string;
  fechadoPor: string;
  automatico: boolean;
  duplas: FotoDupla[];
}

interface RespostaCiclos {
  aberto: { numero: number; inicio: string; fimPrevisto: string; duplas: FotoDupla[] };
  ciclos: Ciclo[];
}

/** Período "29/09 – 05/10" (o fim é a segunda 00:00 seguinte, então mostra o dia anterior). */
function periodo(inicio: string, fim: string) {
  const f = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
  return `${f(new Date(inicio))} – ${f(new Date(new Date(fim).getTime() - 1))}`;
}

const autorCurto = (email: string) => email.split("@")[0];

export function HistoricoPage() {
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [soMovimento, setSoMovimento] = useState(false);

  const { data: duplas } = useQuery({
    queryKey: ["duplas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("duplas").select("*").order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Dupla[];
    },
  });

  const ciclos = useQuery({
    queryKey: ["ciclos", duplas?.length],
    enabled: !!duplas,
    queryFn: () => chamar<RespostaCiclos>({ method: "POST", body: JSON.stringify({ acao: "ciclos", duplas }) }),
  });

  const r = ciclos.data;
  const lista = r
    ? [
        { numero: r.aberto.numero, inicio: r.aberto.inicio, fim: r.aberto.fimPrevisto, aberto: true as const, duplas: r.aberto.duplas },
        ...r.ciclos.map((c) => ({ ...c, aberto: false as const })),
      ]
    : [];
  const idx = Math.max(0, lista.findIndex((c) => c.numero === selecionado));
  const atual = lista[idx];
  const anterior = lista[idx + 1];

  const movimentou = (d: FotoDupla) => d.eventos.length > 0 || d.notas.length > 0 || !!d.lideranca?.length;
  const termo = busca.trim().toLowerCase();
  const cards = (atual?.duplas ?? []).filter(
    (d) =>
      (!soMovimento || movimentou(d)) &&
      (!termo || [d.afilhado, d.padrinho, d.nome ?? ""].some((t) => t.toLowerCase().includes(termo))),
  );

  return (
    <AppLayout
      icon={History}
      title="Histórico"
      subtitle="Ciclos de 7 dias (segunda a domingo), salvos automaticamente toda semana"
    >
      {ciclos.isError ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">
          Não consegui carregar o histórico: {(ciclos.error as Error).message}
        </div>
      ) : !atual ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">Carregando ciclos…</div>
      ) : (
        <>
          {/* Linha do tempo de ciclos */}
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-2">
            {lista.map((c, i) => {
              const ativo = i === idx;
              return (
                <button
                  key={c.numero}
                  onClick={() => setSelecionado(c.numero)}
                  className={cn(
                    "flex shrink-0 cursor-pointer flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-colors",
                    ativo ? "border-primary bg-primary text-white shadow-lg" : "border-[#ece3f6] bg-white text-ink hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-black">
                    Ciclo {c.numero}
                    {c.aberto && (
                      <span className={cn("rounded-full px-1.5 py-px text-[10px] font-bold", ativo ? "bg-white/25" : "bg-warning/25 text-ink")}>
                        em andamento
                      </span>
                    )}
                  </span>
                  <span className={cn("text-xs", ativo ? "text-white/85" : "text-muted-foreground")}>{periodo(c.inicio, c.fim)}</span>
                </button>
              );
            })}
          </div>

          <Resumo ciclo={atual} />

          <div className="mb-4 mt-6 flex flex-wrap items-center gap-3">
            <label className="cartao flex h-10 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar dupla"
                className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={soMovimento} onChange={(e) => setSoMovimento(e.target.checked)} className="accent-primary" />
              Só quem teve movimento na semana
            </label>
            <span className="ml-auto text-xs text-muted-foreground">
              {"fechadoEm" in atual && !atual.aberto
                ? `Semana salva em ${dataHoraBR(atual.fechadoEm)}`
                : `Semana em andamento · salva sozinha em ${dataHoraBR(atual.fim)} · comparando com o ciclo ${anterior?.numero ?? "—"}`}
            </span>
          </div>

          {cards.length === 0 ? (
            <div className="cartao px-6 py-10 text-center text-muted-foreground">Nenhuma dupla para mostrar.</div>
          ) : (
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
              {cards.map((d) => (
                <CardDupla key={d.id} d={d} antes={anterior?.duplas.find((x) => x.id === d.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

function Resumo({ ciclo }: { ciclo: { duplas: FotoDupla[] } }) {
  const etapas = ciclo.duplas.reduce((s, d) => s + d.eventos.filter((e) => e.tipo === "etapa").length, 0);
  const campos = ciclo.duplas.reduce((s, d) => s + d.eventos.filter((e) => e.tipo === "campos").length, 0);
  const notas = ciclo.duplas.reduce((s, d) => s + d.notas.length, 0);
  const ativas = ciclo.duplas.filter((d) => d.eventos.length || d.notas.length).length;
  const itens = [
    ["Duplas", ciclo.duplas.length],
    ["Com movimento", ativas],
    ["Mudanças de etapa", etapas],
    ["Alterações de dados", campos],
    ["Anotações", notas],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="cartao px-4 py-3">
          <div className="num text-2xl text-ink">{valor}</div>
          <div className="text-xs text-muted-foreground">{rotulo}</div>
        </div>
      ))}
    </div>
  );
}

function Delta({ agora, antes }: { agora: number; antes?: number }) {
  if (antes === undefined || agora === antes) return null;
  const sobe = agora > antes;
  return (
    <span className={cn("ml-1 text-[11px] font-black", sobe ? "text-emerald-600" : "text-destructive")}>
      {sobe ? "+" : ""}
      {Number((agora - antes).toFixed(1))}
    </span>
  );
}

function CardDupla({ d, antes }: { d: FotoDupla; antes?: FotoDupla }) {
  const [aberto, setAberto] = useState(false);
  const mudouEtapa = antes && antes.etapa !== d.etapa;
  const linhas = [
    ...d.eventos.map((e) => ({ em: e.em, autor: e.autor, tipo: e.tipo, texto: e.mudancas.map((m) => `${m.campo}: ${m.de} → ${m.para}`).join(" · ") })),
    ...d.notas.map((n) => ({ em: n.criadoEm, autor: n.autor, tipo: "nota", texto: n.texto })),
    ...(d.lideranca ?? []).map((n) => ({ em: n.criadoEm, autor: n.autor, tipo: "lideranca", texto: n.texto })),
  ].sort((a, b) => b.em.localeCompare(a.em));
  const visiveis = aberto ? linhas : linhas.slice(0, 2);

  const stat = (rotulo: string, valor: string, agora: number, ant?: number) => (
    <div className="rounded-xl bg-muted/70 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</div>
      <div className="num text-sm text-ink">
        {valor}
        <Delta agora={agora} antes={ant} />
      </div>
    </div>
  );

  return (
    <article className={cn("cartao flex flex-col p-4", linhas.length === 0 && "opacity-80")}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to="/duplas/$id" params={{ id: d.id }} className="block truncate font-black leading-tight text-ink hover:text-primary">
            {d.nome || d.afilhado}
          </Link>
          <div className="truncate text-xs text-muted-foreground">Padrinho: {d.padrinho}</div>
        </div>
        <span className="num shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">D{d.dia}</span>
      </header>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
        {mudouEtapa && (
          <>
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground line-through">{antes.etapa}</span>
            <ArrowRight className="h-3 w-3 text-primary" />
          </>
        )}
        <span className={cn("rounded-full px-2 py-0.5 font-bold", mudouEtapa ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
          {d.etapa}
        </span>
        <span className="rounded-full bg-accent px-2 py-0.5">{STATUS_LABEL[d.status as StatusDupla] ?? d.status}</span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {stat("Reuniões", `${d.reunioes}/4`, d.reunioes, antes?.reunioes)}
        {stat("Leads", `${d.leads_entregues + d.leads_novos}`, d.leads_entregues + d.leads_novos, antes && antes.leads_entregues + antes.leads_novos)}
        {stat("Check-ins", `${d.checkins_realizados}`, d.checkins_realizados, antes?.checkins_realizados)}
        {stat("Horas", `${Number(d.horas.toFixed(1))}h`, d.horas, antes?.horas)}
      </div>

      {(d.venda_originada || d.venda_conduzida) && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          {d.venda_originada && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 text-ink">
              Originada {dataBR(d.venda_originada)}
              {antes && !antes.venda_originada && " · nova!"}
            </span>
          )}
          {d.venda_conduzida && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 text-ink">
              Conduzida {dataBR(d.venda_conduzida)}
              {antes && !antes.venda_conduzida && " · nova!"}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 border-t pt-2.5">
        <div className="rotulo mb-1.5 text-[10px] text-primary">Na semana</div>
        {linhas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem movimento.</p>
        ) : (
          <ul className="space-y-1.5">
            {visiveis.map((l, i) => (
              <li key={i} className="flex gap-1.5 text-xs leading-snug">
                {l.tipo === "lideranca" ? (
                  <Crown className="mt-px h-3.5 w-3.5 shrink-0 text-[#59327a]" />
                ) : l.tipo === "nota" ? (
                  <StickyNote className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />
                ) : (
                  <CalendarCheck className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
                )}
                <span className="min-w-0">
                  <span className={cn("text-ink", !aberto && "line-clamp-2")}>{l.texto}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {autorCurto(l.autor)} · {dataHoraBR(l.em)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {linhas.length > 2 && (
          <button onClick={() => setAberto((a) => !a)} className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-bold text-primary">
            {aberto ? "Mostrar menos" : `Ver tudo (${linhas.length})`}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", aberto && "rotate-180")} />
          </button>
        )}
      </div>
    </article>
  );
}
