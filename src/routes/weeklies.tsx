import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { dataBR } from "@/lib/apadrinhamento";

interface WeeklyResumo {
  id: string;
  data: string;
  pauta: string | null;
  acoes: { id: string; concluida: boolean }[];
  weekly_updates: { id: string }[];
}

export function WeekliesPage() {
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
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
            Nenhuma weekly registrada ainda.
          </div>
        )}
        {weeklies.map((w) => {
          const abertas = w.acoes.filter((a) => !a.concluida).length;
          return (
            <Link
              key={w.id}
              to="/weeklies/$id"
              params={{ id: w.id }}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 hover:border-primary"
            >
              <div>
                <div className="num text-lg font-semibold">{dataBR(w.data)}</div>
                <div className="line-clamp-1 text-sm text-muted-foreground">{w.pauta || "Sem pauta registrada"}</div>
              </div>
              <div className="flex gap-6 text-sm">
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
