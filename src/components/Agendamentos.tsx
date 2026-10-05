import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarClock, Check, ChevronLeft, ChevronRight, Link2, RotateCcw, Unplug, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconeCirculo } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import {
  chamar,
  hojeISO,
  somarDias,
  useAcaoRadar,
  useEu,
  useRadar,
  type EventoAgenda,
  type StatusReuniao,
} from "@/lib/radar";

/* Agenda no Painel, em formato de calendário e só para a frente: mostra de hoje em diante.
   Reuniões que já aconteceram DESDE que a agenda foi conectada e ainda não foram marcadas
   aparecem em "para marcar" (nada de antes da conexão). Realizada e no-show entram
   sozinhas na rotina (aba Weekly). */

const SITUACOES: { valor: StatusReuniao; rotulo: string; icon: typeof Check; cor: string }[] = [
  { valor: "realizada", rotulo: "Realizada", icon: Check, cor: "bg-primary text-white" },
  { valor: "noshow", rotulo: "No-show", icon: UserX, cor: "bg-destructive text-white" },
  { valor: "remarcada", rotulo: "Remarcada", icon: RotateCcw, cor: "bg-warning text-ink" },
  { valor: "cancelada", rotulo: "Cancelada", icon: X, cor: "bg-ink text-white" },
];

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"];
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const diaLongo = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" });
// Meia-noite de Brasília de um dia "AAAA-MM-DD", em ISO.
const meiaNoite = (dia: string) => `${dia}T03:00:00.000Z`;
type Resposta = { conectada: boolean; conectadaEm?: string; eventos: EventoAgenda[] };

function useAgenda(inicio: string, fim: string, habilitado = true) {
  return useQuery({
    queryKey: ["agenda", inicio, fim],
    enabled: habilitado,
    queryFn: () => chamar<Resposta>({ method: "POST", body: JSON.stringify({ acao: "agenda", inicio, fim }) }),
    staleTime: 60_000,
    retry: 0,
  });
}

export function Agendamentos({ className = "" }: { className?: string }) {
  const { email } = useEu();
  const radar = useRadar();
  const acao = useAcaoRadar();
  const hoje = hojeISO();
  const [mes, setMes] = useState(() => hoje.slice(0, 7)); // "AAAA-MM"
  // Dia aberto na janela ("AAAA-MM-DD"), "pendentes" (as que faltam marcar) ou nada.
  const [aberto, setAberto] = useState<string | null>(null);
  const [soComConvidados, setSoComConvidados] = useState(true);

  const mesAtual = hoje.slice(0, 7);
  const primeiroDoMes = `${mes}-01`;
  const [ano, m] = mes.split("-").map(Number);
  const ultimoDoMes = `${mes}-${String(new Date(ano, m, 0).getDate()).padStart(2, "0")}`;
  // Só para a frente: do maior entre hoje e o dia 1 do mês, até o fim do mês.
  const inicioMes = primeiroDoMes > hoje ? primeiroDoMes : hoje;
  const agenda = useAgenda(meiaNoite(inicioMes), meiaNoite(somarDias(ultimoDoMes, 1)));

  // Para marcar: do dia em que a agenda foi conectada (no máx. 30 dias atrás) até agora.
  const conectadaEm = agenda.data?.conectadaEm?.slice(0, 10);
  const inicioPendentes = conectadaEm ? (conectadaEm > somarDias(hoje, -30) ? conectadaEm : somarDias(hoje, -30)) : hoje;
  // "Agora" fixo (arredondado a 10 min) para a busca não mudar a cada atualização da tela.
  const [agoraBusca] = useState(() => new Date(Math.ceil(Date.now() / 600_000) * 600_000).toISOString());
  const passadas = useAgenda(meiaNoite(inicioPendentes), agoraBusca, !!agenda.data?.conectada && inicioPendentes < hoje);

  const marcadas = radar.data?.rotina?.[email]?.reunioes ?? {};
  const filtrar = (lista: EventoAgenda[] = []) => lista.filter((e) => !soComConvidados || e.convidados.length > 0);
  const eventos = filtrar(agenda.data?.eventos);
  const agora = Date.now();
  const pendentes = [...filtrar(passadas.data?.eventos), ...eventos]
    .filter((e) => new Date(e.inicio).getTime() <= agora && !marcadas[e.id])
    .filter((e, i, l) => l.findIndex((x) => x.id === e.id) === i);
  // Calendário: daqui para a frente + as que já aconteceram desde a conexão (para marcar).
  const passadasFiltradas = filtrar(passadas.data?.eventos);
  const porDia = useMemo(() => {
    const mapa: Record<string, EventoAgenda[]> = {};
    const vistos = new Set<string>();
    for (const e of [...passadasFiltradas, ...eventos]) {
      if (vistos.has(e.id)) continue;
      vistos.add(e.id);
      (mapa[e.data] ??= []).push(e);
    }
    for (const l of Object.values(mapa)) l.sort((a, b) => a.inicio.localeCompare(b.inicio));
    return mapa;
  }, [passadasFiltradas, eventos]);

  // No-show do que já foi marcado neste mês (contando desde a conexão).
  const doMes = Object.values(marcadas).filter((r) => r.data.startsWith(mesAtual));
  const realizadas = doMes.filter((r) => r.status === "realizada").length;
  const noshow = doMes.filter((r) => r.status === "noshow").length;
  const proximos7 = eventos.filter((e) => e.data >= hoje && e.data < somarDias(hoje, 7) && new Date(e.inicio).getTime() > agora).length;

  // Grade do mês (segunda a domingo).
  const grade = useMemo(() => {
    const desloc = (new Date(ano, m - 1, 1).getDay() + 6) % 7;
    const total = new Date(ano, m, 0).getDate();
    const celulas: (string | null)[] = Array(desloc).fill(null);
    for (let d = 1; d <= total; d++) celulas.push(`${mes}-${String(d).padStart(2, "0")}`);
    while (celulas.length % 7) celulas.push(null);
    return celulas;
  }, [mes, ano, m]);

  const trocarMes = (delta: number) => {
    const d = new Date(ano, m - 1 + delta, 1);
    const novo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (novo < mesAtual) return;
    setMes(novo);
  };

  function marcar(e: EventoAgenda, status: StatusReuniao) {
    const atual = marcadas[e.id]?.status;
    acao.mutate({ acao: "marcarReuniao", eventoId: e.id, data: e.data, status: atual === status ? null : status, titulo: e.titulo, inicio: e.inicio });
  }

  const lista = aberto === "pendentes" ? pendentes : aberto ? porDia[aberto] ?? [] : [];

  return (
    <section className={cn("cartao flex flex-col p-5", className)}>
      <div className="flex items-start gap-2.5">
        <IconeCirculo icon={CalendarClock} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-[17px] font-black text-ink">Agenda</h2>
          <p className="text-[13px] text-muted-foreground">Clique num dia para ver as reuniões e marcar o no-show</p>
        </div>
        {agenda.data?.conectada && <DesconectarAgenda />}
      </div>

      {agenda.isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Lendo sua agenda…</p>
      ) : agenda.isError ? (
        <p className="mt-5 text-sm text-destructive">Não consegui ler a agenda: {(agenda.error as Error).message}</p>
      ) : !agenda.data?.conectada ? (
        <ConectarAgenda />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                ["Próx. 7 dias", proximos7, "text-ink"],
                ["Realizadas no mês", realizadas, "text-primary"],
                ["No-show no mês", realizadas + noshow ? `${noshow} · ${Math.round((noshow / (realizadas + noshow)) * 100)}%` : "0", "text-destructive"],
              ] as const
            ).map(([rotulo, valor, cor]) => (
              <div key={rotulo} className="rounded-xl border border-[#ece3f6] bg-white px-3 py-2">
                <div className={cn("num text-lg leading-tight", cor)}>{valor}</div>
                <div className="text-[11px] leading-tight text-muted-foreground">{rotulo}</div>
              </div>
            ))}
          </div>

          {/* Calendário do mês */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() => trocarMes(-1)}
                disabled={mes <= mesAtual}
                aria-label="Mês anterior"
                className="botao-chevron disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-black text-ink">
                {MESES[m - 1]} {ano}
              </span>
              <button onClick={() => trocarMes(1)} aria-label="Próximo mês" className="botao-chevron">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {SEMANA.map((s, i) => (
                <span key={i} className="text-[11px] font-bold text-muted-foreground">
                  {s}
                </span>
              ))}
              {grade.map((d, i) => {
                if (!d) return <span key={i} />;
                const doDia = porDia[d] ?? [];
                // Dias passados só abrem se tiverem reuniões desde a conexão (para marcar no-show).
                const clicavel = doDia.length > 0 && (d >= hoje || d >= inicioPendentes);
                const faltaMarcar = doDia.some((e) => new Date(e.inicio).getTime() <= agora && !marcadas[e.id]);
                const ativo = aberto === d;
                return (
                  <button
                    key={d}
                    disabled={!clicavel}
                    onClick={() => setAberto(d)}
                    title={doDia.length ? `${doDia.length} ${doDia.length === 1 ? "reunião" : "reuniões"}` : undefined}
                    className={cn(
                      "relative flex h-9 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                      d < hoje ? "text-muted-foreground/40" : "text-ink",
                      clicavel ? "hover:bg-accent" : "cursor-default",
                      ativo && "bg-accent",
                      d === hoje && "font-black text-primary ring-1 ring-primary/40",
                    )}
                  >
                    {Number(d.slice(8))}
                    {doDia.length > 0 && (
                      <span
                        className={cn(
                          "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                          faltaMarcar ? "bg-warning" : d < hoje ? "bg-primary/40" : "bg-primary",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {pendentes.length > 0 && (
            <button
              onClick={() => setAberto("pendentes")}
              className="mt-3 flex items-center gap-2 rounded-xl bg-warning/15 px-3 py-2 text-left text-sm font-bold text-ink hover:bg-warning/25"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {pendentes.length} {pendentes.length === 1 ? "reunião já aconteceu e falta marcar" : "reuniões já aconteceram e faltam marcar"}
            </button>
          )}
        </>
      )}

      {/* Reuniões do dia clicado (ou as que faltam marcar), numa janela */}
      <Dialog open={!!aberto} onOpenChange={(v) => !v && setAberto(null)}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-ink first-letter:uppercase">
              {aberto === "pendentes" ? "Reuniões para marcar" : aberto === hoje ? `Hoje · ${diaLongo(hoje)}` : aberto ? diaLongo(aberto) : ""}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {lista.length} {lista.length === 1 ? "reunião" : "reuniões"} · depois que a reunião começa, marque como foi
            </p>
          </DialogHeader>
          <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
            {lista.length === 0 && (
              <li className="rounded-xl border-2 border-dashed border-[#e3d5ef] px-3 py-5 text-center text-xs text-muted-foreground">
                Nenhuma reunião nesse dia.
              </li>
            )}
            {lista.map((e) => {
              const marca = marcadas[e.id]?.status;
              const aconteceu = new Date(e.inicio).getTime() <= agora;
              return (
                <li key={e.id} className={cn("rounded-xl border px-3 py-2", aconteceu && !marca ? "border-warning/60 bg-warning/5" : "border-[#ece3f6] bg-white")}>
                  <div className="flex items-center gap-2">
                    <span className="num shrink-0 text-xs text-ink">
                      {aberto === "pendentes" &&`${e.data.slice(8)}/${e.data.slice(5, 7)} · `}
                      {hora(e.inicio)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink" title={`${e.titulo}${e.convidados.length ? ` — com ${e.convidados.join(", ")}` : ""}`}>
                      {e.titulo}
                    </span>
                    {!aconteceu && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Agendada</span>}
                  </div>
                  {aconteceu && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {SITUACOES.map(({ valor, rotulo, icon: I, cor }) => (
                        <button
                          key={valor}
                          onClick={() => marcar(e, valor)}
                          disabled={acao.isPending}
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors",
                            marca === valor ? cor : "bg-muted text-muted-foreground hover:text-ink",
                          )}
                        >
                          <I className="h-3 w-3" /> {rotulo}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" className="accent-primary" checked={soComConvidados} onChange={(e) => setSoComConvidados(e.target.checked)} />
            Só com convidados
          </label>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ConectarAgenda() {
  const qc = useQueryClient();
  const [link, setLink] = useState("");
  const conectar = useMutation({
    mutationFn: () => chamar({ method: "POST", body: JSON.stringify({ acao: "conectarAgenda", url: link }) }),
    onSuccess: () => {
      toast.success("Agenda conectada!");
      setLink("");
      qc.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-4 space-y-3">
      <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink">
        <li>
          No <b>Google Agenda</b> (computador): engrenagem → <b>Configurações</b>.
        </li>
        <li>
          Clique na <b>sua agenda</b> → <b>Integrar agenda</b>.
        </li>
        <li>
          Copie o <b>Endereço secreto no formato iCal</b> e cole abaixo.
        </li>
      </ol>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (link.trim()) conectar.mutate();
        }}
      >
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
          aria-label="Endereço secreto no formato iCal"
        />
        <Button type="submit" disabled={!link.trim() || conectar.isPending}>
          <Link2 className="h-4 w-4" /> {conectar.isPending ? "Conectando…" : "Conectar agenda"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">Só leitura. O link fica guardado só no servidor e ninguém vê.</p>
    </div>
  );
}

function DesconectarAgenda() {
  const qc = useQueryClient();
  const desconectar = useMutation({
    mutationFn: () => chamar({ method: "POST", body: JSON.stringify({ acao: "desconectarAgenda" }) }),
    onSuccess: () => {
      toast.success("Agenda desconectada");
      qc.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <button
      onClick={() => confirm("Desconectar sua agenda do Radar? As marcações já feitas continuam salvas.") && desconectar.mutate()}
      title="Desconectar agenda"
      aria-label="Desconectar agenda"
      className="shrink-0 rounded-full p-1.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-destructive"
    >
      <Unplug className="h-3.5 w-3.5" />
    </button>
  );
}
