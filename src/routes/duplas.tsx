import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  STATUS_LABEL,
  aderencia,
  dataBR,
  diasDesde,
  pct,
  reunioesFeitas,
  type Dupla,
} from "@/lib/apadrinhamento";

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
  "Status",
  "Reuniões",
  "Leads",
  "Check-ins",
  "Originada",
  "Conduzida",
  "Horas",
  "",
];

export function DuplasPage() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const { data: duplas = [] } = useQuery({
    queryKey: ["duplas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("duplas").select("*").order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Dupla[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (dupla: Rascunho) => {
      const { id, created_at: _criado, ...campos } = Object.fromEntries(
        Object.entries(dupla).map(([k, v]) => [k, v === "" ? null : v]),
      ) as Rascunho;
      const res = id
        ? await supabase.from("duplas").update(campos).eq("id", id)
        : await supabase.from("duplas").insert(campos);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duplas"] });
      setEditando(null);
      toast.success("Dupla salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("duplas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["duplas"] }),
  });

  const alterar =
    (campo: string, numero = false) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setEditando((d) => ({ ...d, [campo]: numero ? Number(e.target.value) : e.target.value }));

  const campo = (nome: string, rotulo: string, tipo = "text") => (
    <div className="space-y-1">
      <Label className="text-xs">{rotulo}</Label>
      <Input
        type={tipo}
        value={(editando?.[nome] as string | number | undefined) ?? ""}
        onChange={alterar(nome, tipo === "number")}
        step={tipo === "number" ? "any" : undefined}
      />
    </div>
  );

  return (
    <AppLayout
      title="Duplas"
      subtitle="Registro de reuniões, check-ins, leads e vendas"
      actions={
        <Button onClick={() => setEditando(NOVA)}>
          <Plus className="h-4 w-4" /> Nova dupla
        </Button>
      }
    >
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {COLUNAS.map((c) => (
                <th key={c} className="px-4 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {duplas.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma dupla ainda. Clique em “Nova dupla”.
                </td>
              </tr>
            )}
            {duplas.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3 font-medium">{d.afilhado}</td>
                <td className="px-4 py-3">{d.padrinho}</td>
                <td className="px-4 py-3">{d.ciclo}</td>
                <td className="num px-4 py-3">D{diasDesde(d.data_inicio)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{STATUS_LABEL[d.status] ?? d.status}</span>
                </td>
                <td className="num px-4 py-3">{reunioesFeitas(d)}/4</td>
                <td className="num px-4 py-3">
                  {d.leads_entregues} <span className="text-muted-foreground">+{d.leads_novos}</span>
                </td>
                <td className="px-4 py-3">{pct(aderencia(d))}</td>
                <td className="px-4 py-3">{dataBR(d.venda_originada)}</td>
                <td className="px-4 py-3">{dataBR(d.venda_conduzida)}</td>
                <td className="num px-4 py-3">{(Number(d.horas_padrinho) + Number(d.horas_psm)).toFixed(1)}h</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditando(d as Rascunho)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => confirm("Excluir esta dupla?") && excluir.mutate(d.id)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editando} onOpenChange={(aberto) => !aberto && setEditando(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando?.id ? "Editar dupla" : "Nova dupla"}</DialogTitle>
          </DialogHeader>
          {editando && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                salvar.mutate(editando);
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
                    value={editando.status ?? ""}
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
                <legend className="mb-2 text-sm font-semibold">Fluxo ABC — datas das reuniões</legend>
                {campo("reuniao1", "Reunião 1", "date")}
                {campo("reuniao2", "Reunião 2", "date")}
                {campo("reuniao3", "Reunião 3", "date")}
                {campo("reuniao4", "Reunião 4", "date")}
              </fieldset>
              <fieldset className="grid gap-3 sm:grid-cols-4">
                <legend className="mb-2 text-sm font-semibold">Leads e check-ins</legend>
                {campo("leads_entregues", "Leads iniciais", "number")}
                {campo("leads_novos", "Leads novos", "number")}
                {campo("checkins_realizados", "Check-ins feitos", "number")}
                {campo("checkins_faltados", "Check-ins faltados", "number")}
              </fieldset>
              <fieldset className="grid gap-3 sm:grid-cols-4">
                <legend className="mb-2 text-sm font-semibold">Vendas e horas</legend>
                {campo("venda_originada", "1ª venda originada", "date")}
                {campo("venda_conduzida", "1ª venda conduzida", "date")}
                {campo("horas_padrinho", "Horas padrinho", "number")}
                {campo("horas_psm", "Horas PSM", "number")}
              </fieldset>
              <div className="space-y-1">
                <Label className="text-xs">Observações</Label>
                <Textarea value={editando.observacoes ?? ""} onChange={alterar("observacoes")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditando(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvar.isPending}>
                  Salvar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
