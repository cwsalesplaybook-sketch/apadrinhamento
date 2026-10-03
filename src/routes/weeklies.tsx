import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout, Vazio } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { dataBR } from "@/lib/apadrinhamento";
import { diasDaSemana, useEu, useRadar } from "@/lib/radar";

interface WeeklyResumo {
  id: string;
  data: string;
  pauta: string | null;
  acoes: { id: string; concluida: boolean }[];
  weekly_updates: { id: string }[];
}

export function WeekliesPage() {
  const radar = useRadar();
  const { email: eu } = useEu();
  const navigate = useNavigate();
  const { data: weeklies = [] } = useQuery({
    queryKey: ["weeklies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weeklies")
        .select("*, acoes(id, concluida), weekly_updates(id)")
        .order("data", { ascending: false });
      if (error) throw error;
      return data as WeeklyResumo[];
    },
  });
  const criar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("weeklies").insert({}).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => navigate({ to: "/weeklies/$id", params: { id } }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout
      icon={CalendarPlus}
      title="Weeklies"
      subtitle="Ata, status das duplas, objeções e próximos passos"
      actions={
        <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
          <Plus className="h-4 w-4" /> Nova weekly
        </Button>
      }
    >
      <div className="space-y-3">
        {weeklies.length === 0 && (
          <Vazio imagem="/brand/cardapinho-acenando.webp">
            <p className="text-muted-foreground">Nenhuma weekly registrada ainda.</p>
          </Vazio>
        )}
        {weeklies.map((w) => {
          const abertas = w.acoes.filter((a) => !a.concluida).length;
          const semana = w.data ? diasDaSemana(w.data) : [];
          const soma = (id: string) =>
            semana.reduce((s, dia) => s + (radar.data?.rotina?.[eu]?.dias?.[dia]?.valores[id] ?? 0), 0);
          const reunioes = soma("reunioes");
          const noshow = soma("noshow");
          return (
            <Link
              key={w.id}
              to="/weeklies/$id"
              params={{ id: w.id }}
              className="flex flex-wrap items-center justify-between gap-4 cartao p-5 transition-transform hover:-translate-y-0.5"
            >
              <div>
                <div className="num text-lg">{dataBR(w.data)}</div>
                <div className="line-clamp-1 text-sm text-muted-foreground">{w.pauta || "Sem pauta registrada"}</div>
              </div>
              <div className="flex gap-6 text-sm">
                {(reunioes > 0 || noshow > 0) && (
                  <span title="Da sua rotina nessa semana">
                    <b className="num">{reunioes}</b> reuniões · <b className="num">{noshow}</b> no-show
                  </span>
                )}
                <span>
                  <b className="num">{w.weekly_updates.length}</b> atualizações
                </span>
                <span className={abertas ? "text-primary" : "text-muted-foreground"}>
                  <b className="num">{abertas}</b> ações abertas
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}
