import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Link2, RotateCcw, Unplug, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconeCirculo } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import {
  chamar,
  diasDaSemana,
  hojeISO,
  somarDias,
  useAcaoRadar,
  useEu,
  useRadar,
  type EventoAgenda,
  type StatusReuniao,
} from "@/lib/radar";

/* Agendamentos da agenda (iCal) no Painel: cada reunião vira uma linha que a pessoa
   marca como realizada / no-show / remarcada / cancelada. Realizada e no-show
   entram sozinhas na rotina (aba Weekly). */

const SITUACOES: { valor: StatusReuniao; rotulo: string; icon: typeof Check; cor: string }[] = [
  { valor: "realizada", rotulo: "Realizada", icon: Check, cor: "bg-primary text-white" },
  { valor: "noshow", rotulo: "No-show", icon: UserX, cor: "bg-destructive text-white" },
  { valor: "remarcada", rotulo: "Remarcada", icon: RotateCcw, cor: "bg-warning text-ink" },
  { valor: "cancelada", rotulo: "Cancelada", icon: X, cor: "bg-ink text-white" },
];

const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
// Segunda 00:00 e a segunda seguinte, no horário de Brasília.
const limites = (seg: string) => ({ inicio: `${seg}T03:00:00.000Z`, fim: `${somarDias(seg, 7)}T03:00:00.000Z` });

export function Agendamentos() {
  const { email } = useEu();
  const radar = useRadar();
  const acao = useAcaoRadar();
  const [segunda, setSegunda] = useState(() => diasDaSemana(hojeISO())[0]);
  const [soComConvidados, setSoComConvidados] = useState(true);
  const dias = useMemo(() => diasDaSemana(segunda), [segunda]);

  const agenda = useQuery({
    queryKey: ["agenda", segunda],
    queryFn: () => chamar<{ conectada: boolean; eventos: EventoAgenda[] }>({
      method: "POST",
      body: JSON.stringify({ acao: "agenda", ...limites(segunda) }),
    }),
    staleTime: 60_000,
    retry: 0,
  });

  const marcadas = radar.data?.rotina?.[email]?.reunioes ?? {};
  const eventos = (agenda.data?.eventos ?? []).filter((e) => !soComConvidados || e.convidados.length > 0);
  const agora = Date.now();
  const contagem = (s: StatusReuniao) => eventos.filter((e) => marcadas[e.id]?.status === s).length;
  const passadas = eventos.filter((e) => new Date(e.inicio).getTime() <= agora);
  const pendentes = passadas.filter((e) => !marcadas[e.id]).length;
  const base = contagem("realizada") + contagem("noshow");
  const ehEstaSemana = segunda === diasDaSemana(hojeISO())[0];

  function marcar(e: EventoAgenda, status: StatusReuniao) {
    const atual = marcadas[e.id]?.status;
    acao.mutate({
      acao: "marcarReuniao",
      eventoId: e.id,
      data: e.data,
      status: atual === status ? null : status,
      titulo: e.titulo,
      inicio: e.inicio,
    });
  }

  return (
    <section className="cartao p-6">
      <div className="flex flex-wrap items-start gap-3">
        <IconeCirculo icon={CalendarClock} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-lg font-black text-ink">Agendamentos</h2>
          <p className="text-sm text-muted-foreground">
            Reuniões da sua agenda · marque como foi para contar o no-show
          </p>
        </div>
        {agenda.data?.conectada && (
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="outline" onClick={() => setSegunda(somarDias(segunda, -7))} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-bold text-ink">
              {ehEstaSemana ? "Esta semana" : `${diaMes(dias[0])} a ${diaMes(dias[6])}`}
            </span>
            <Button size="icon" variant="outline" onClick={() => setSegunda(somarDias(segunda, 7))} aria-label="Próxima semana">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {agenda.isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Lendo sua agenda…</p>
      ) : agenda.isError ? (
        <p className="mt-5 text-sm text-destructive">Não consegui ler a agenda: {(agenda.error as Error).message}</p>
      ) : !agenda.data?.conectada ? (
        <ConectarAgenda />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(
              [
                ["Agendadas", eventos.length, "text-ink"],
                ["Realizadas", contagem("realizada"), "text-primary"],
                ["No-show", contagem("noshow"), "text-destructive"],
                ["Sem marcar", pendentes, pendentes ? "text-warning" : "text-ink"],
                ["Taxa de no-show", base ? `${Math.round((contagem("noshow") / base) * 100)}%` : "—", "text-ink"],
              ] as const
            ).map(([rotulo, valor, cor]) => (
              <div key={rotulo} className="rounded-2xl border border-[#ece3f6] bg-white px-4 py-3">
                <div className={cn("num text-2xl", cor)}>{valor}</div>
                <div className="text-xs text-muted-foreground">{rotulo}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink">
              <input
                type="checkbox"
                className="accent-primary"
                checked={soComConvidados}
                onChange={(e) => setSoComConvidados(e.target.checked)}
              />
              Só eventos com convidados (esconde lembretes e compromissos pessoais)
            </label>
            <DesconectarAgenda />
          </div>

          {eventos.length === 0 ? (
            <p className="mt-5 rounded-2xl border-2 border-dashed border-[#e3d5ef] px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma reunião na agenda nessa semana.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {dias.map((dia, n) => {
                const doDia = eventos.filter((e) => e.data === dia);
                if (!doDia.length) return null;
                return (
                  <div key={dia}>
                    <div className={cn("rotulo mb-2 text-xs", dia === hojeISO() ? "text-primary" : "text-muted-foreground")}>
                      {NOMES_DIA[n]} {diaMes(dia)} {dia === hojeISO() && "· hoje"}
                    </div>
                    <ul className="space-y-2">
                      {doDia.map((e) => {
                        const marca = marcadas[e.id]?.status;
                        const aconteceu = new Date(e.inicio).getTime() <= agora;
                        return (
                          <li
                            key={e.id}
                            className={cn(
                              "flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3",
                              marca ? "border-[#ece3f6] bg-white" : aconteceu ? "border-warning/60 bg-warning/5" : "border-[#ece3f6] bg-white",
                            )}
                          >
                            <span className="num w-24 shrink-0 text-sm text-ink">
                              {hora(e.inicio)}–{hora(e.fim)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-bold text-ink" title={e.titulo}>
                                {e.titulo}
                              </div>
                              {e.convidados.length > 0 && (
                                <div className="truncate text-xs text-muted-foreground">com {e.convidados.join(", ")}</div>
                              )}
                            </div>
                            {aconteceu ? (
                              <div className="flex flex-wrap gap-1.5">
                                {SITUACOES.map(({ valor, rotulo, icon: I, cor }) => (
                                  <button
                                    key={valor}
                                    onClick={() => marcar(e, valor)}
                                    disabled={acao.isPending}
                                    className={cn(
                                      "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                                      marca === valor ? cor : "bg-muted text-muted-foreground hover:text-ink",
                                    )}
                                  >
                                    <I className="h-3.5 w-3.5" /> {rotulo}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Agendada</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Realizada e no-show entram sozinhas na sua rotina da semana (aba Weekly). Clique de novo para desmarcar.
          </p>
        </>
      )}
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
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_minmax(0,420px)]">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink">
        <li>
          Abra o <b>Google Agenda</b> no computador e clique na engrenagem → <b>Configurações</b>.
        </li>
        <li>
          Na esquerda, em "Configurações das minhas agendas", clique na <b>sua agenda</b> (seu nome).
        </li>
        <li>
          Desça até <b>Integrar agenda</b> e copie o <b>Endereço secreto no formato iCal</b> (termina em <code>.ics</code>).
        </li>
        <li>Cole aqui ao lado e clique em Conectar.</li>
        <li className="text-muted-foreground">
          O link fica guardado só no servidor (ninguém vê, nem no navegador) e é só leitura: o Radar nunca mexe na sua agenda.
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
      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive"
    >
      <Unplug className="h-3.5 w-3.5" /> Desconectar agenda
    </button>
  );
}
