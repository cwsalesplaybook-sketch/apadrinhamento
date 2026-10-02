import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SITUACAO_LABEL, diasDesde, reunioesFeitas, type Dupla, type Situacao } from "@/lib/apadrinhamento";

interface Weekly {
  id: string;
  data: string | null;
  participantes: string | null;
  pauta: string | null;
  decisoes: string | null;
  objecoes: string | null;
}
interface WeeklyUpdate {
  id: string;
  dupla_id: string;
  situacao: Situacao | null;
  nota: string | null;
}
interface Acao {
  id: string;
  descricao: string;
  responsavel: string | null;
  prazo: string | null;
  concluida: boolean;
}

const COR_SITUACAO: Record<Situacao, string> = {
  no_ritmo: "bg-primary text-primary-foreground",
  atencao: "bg-warning text-warning-foreground",
  risco: "bg-destructive text-destructive-foreground",
  concluida: "bg-ink text-ink-foreground",
};

const CAMPOS_ATA = {
  pauta: "Pauta",
  decisoes: "Decisões tomadas",
  objecoes: "Objeções e aprendizados (roda de padrinhos)",
} as const;

export function WeeklyPage() {
  const { id } = useParams({ from: "/_authenticated/weeklies/$id" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const recarregar = () => qc.invalidateQueries({ queryKey: ["weekly", id] });

  const { data } = useQuery({
    queryKey: ["weekly", id],
    queryFn: async () => {
      const [w, d, u, a] = await Promise.all([
        supabase.from("weeklies").select("*").eq("id", id).single(),
        supabase.from("duplas").select("*").neq("status", "encerrado").order("afilhado"),
        supabase.from("weekly_updates").select("*").eq("weekly_id", id),
        supabase.from("acoes").select("*").eq("weekly_id", id).order("created_at"),
      ]);
      if (w.error) throw w.error;
      return {
        weekly: w.data as Weekly,
        duplas: (d.data ?? []) as Dupla[],
        updates: (u.data ?? []) as WeeklyUpdate[],
        acoes: (a.data ?? []) as Acao[],
      };
    },
  });

  const [ata, setAta] = useState<Partial<Weekly>>({});
  useEffect(() => {
    if (data) setAta(data.weekly);
  }, [data?.weekly.id]);

  const salvarAta = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("weeklies")
        .update({
          data: ata.data,
          participantes: ata.participantes,
          pauta: ata.pauta,
          decisoes: ata.decisoes,
          objecoes: ata.objecoes,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ata salva");
      recarregar();
      qc.invalidateQueries({ queryKey: ["weeklies"] });
    },
  });

  async function atualizarDupla(duplaId: string, campos: Partial<WeeklyUpdate>) {
    const existente = data?.updates.find((u) => u.dupla_id === duplaId);
    const res = existente
      ? await supabase.from("weekly_updates").update(campos).eq("id", existente.id)
      : await supabase.from("weekly_updates").insert({ weekly_id: id, dupla_id: duplaId, ...campos });
    if (res.error) toast.error(res.error.message);
    else recarregar();
  }

  const [novaAcao, setNovaAcao] = useState({ descricao: "", responsavel: "", prazo: "" });
  async function adicionarAcao(e: FormEvent) {
    e.preventDefault();
    if (!novaAcao.descricao) return;
    const { error } = await supabase.from("acoes").insert({
      weekly_id: id,
      descricao: novaAcao.descricao,
      responsavel: novaAcao.responsavel || null,
      prazo: novaAcao.prazo || null,
    });
    if (error) return toast.error(error.message);
    setNovaAcao({ descricao: "", responsavel: "", prazo: "" });
    recarregar();
  }

  if (!data) {
    return (
      <AppLayout title="Weekly" icon={CalendarPlus}>
        <p className="text-muted-foreground">Carregando…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      icon={CalendarPlus}
      title="Weekly"
      subtitle="Atualize a ata, o status das duplas e os próximos passos"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/weeklies">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm("Excluir esta weekly?")) return;
              await supabase.from("weeklies").delete().eq("id", id);
              navigate({ to: "/weeklies" });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="space-y-4 cartao p-5">
            <h2 className="text-lg font-black text-ink">Ata e decisões</h2>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <Input type="date" value={ata.data ?? ""} onChange={(e) => setAta({ ...ata, data: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Participantes</Label>
                <Input
                  value={ata.participantes ?? ""}
                  onChange={(e) => setAta({ ...ata, participantes: e.target.value })}
                />
              </div>
            </div>
            {(Object.keys(CAMPOS_ATA) as (keyof typeof CAMPOS_ATA)[]).map((campo) => (
              <div key={campo} className="space-y-1">
                <Label className="text-xs">{CAMPOS_ATA[campo]}</Label>
                <Textarea
                  rows={3}
                  value={ata[campo] ?? ""}
                  onChange={(e) => setAta({ ...ata, [campo]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={() => salvarAta.mutate()} disabled={salvarAta.isPending}>
                Salvar ata
              </Button>
            </div>
          </section>

          <section className="cartao p-5">
            <h2 className="text-lg font-black text-ink">Status por dupla</h2>
            {data.duplas.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Nenhuma dupla ativa.</p>}
            <div className="mt-4 space-y-3">
              {data.duplas.map((d) => {
                const upd = data.updates.find((u) => u.dupla_id === d.id);
                return (
                  <div key={d.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b>{d.afilhado}</b>{" "}
                        <span className="text-sm text-muted-foreground">
                          · {d.padrinho} · D{diasDesde(d.data_inicio)} · {reunioesFeitas(d)}/4 reuniões
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(Object.entries(SITUACAO_LABEL) as [Situacao, string][]).map(([valor, rotulo]) => (
                          <button
                            key={valor}
                            onClick={() => atualizarDupla(d.id, { situacao: valor })}
                            className={`rounded-full px-3 py-1 text-xs ${upd?.situacao === valor ? COR_SITUACAO[valor] : "bg-muted text-muted-foreground"}`}
                          >
                            {rotulo}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      className="mt-3"
                      rows={2}
                      placeholder="Atualização da semana (reuniões, leads, vendas, bloqueios)…"
                      defaultValue={upd?.nota ?? ""}
                      onBlur={(e) => e.target.value !== (upd?.nota ?? "") && atualizarDupla(d.id, { nota: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              As notas são salvas ao sair do campo. Para atualizar reuniões e vendas, edite a dupla em “Duplas”.
            </p>
          </section>
        </div>

        <section className="h-fit cartao p-5">
          <h2 className="text-lg font-black text-ink">Próximos passos</h2>
          <form onSubmit={adicionarAcao} className="mt-4 space-y-2">
            <Input
              placeholder="Ação"
              value={novaAcao.descricao}
              onChange={(e) => setNovaAcao({ ...novaAcao, descricao: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Responsável"
                value={novaAcao.responsavel}
                onChange={(e) => setNovaAcao({ ...novaAcao, responsavel: e.target.value })}
              />
              <Input
                type="date"
                value={novaAcao.prazo}
                onChange={(e) => setNovaAcao({ ...novaAcao, prazo: e.target.value })}
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full">
              Adicionar ação
            </Button>
          </form>
          <ul className="mt-4 space-y-2">
            {data.acoes.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 accent-primary"
                  checked={a.concluida}
                  onChange={async () => {
                    await supabase.from("acoes").update({ concluida: !a.concluida }).eq("id", a.id);
                    recarregar();
                  }}
                />
                <div className="flex-1">
                  <div className={a.concluida ? "text-muted-foreground line-through" : ""}>{a.descricao}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.responsavel ?? "Sem responsável"}
                    {a.prazo ? ` · até ${new Date(a.prazo + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                  </div>
                </div>
                <button
                  aria-label="Remover"
                  onClick={async () => {
                    await supabase.from("acoes").delete().eq("id", a.id);
                    recarregar();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
