import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { dataBR, pct } from "@/lib/apadrinhamento";

interface Snapshot {
  id: string;
  data: string;
  cadastrados: number;
  com_cliente: number;
  ativados_60d: number;
  tempo_medio_dias: number | null;
  novos_mes: number | null;
}

type Campo = "data" | "cadastrados" | "com_cliente" | "ativados_60d" | "tempo_medio_dias" | "novos_mes";

const VAZIO: Record<Campo, string> = {
  data: new Date().toISOString().slice(0, 10),
  cadastrados: "",
  com_cliente: "",
  ativados_60d: "",
  tempo_medio_dias: "",
  novos_mes: "",
};

const CAMPOS: [Campo, string, string?][] = [
  ["data", "Data", "date"],
  ["cadastrados", "Cadastrados"],
  ["com_cliente", "Com ao menos 1 cliente"],
  ["ativados_60d", "Ativados em até 60 dias"],
  ["tempo_medio_dias", "Tempo médio até 1ª venda (dias)"],
  ["novos_mes", "Novos representantes no mês"],
];

export function BasePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(VAZIO);
  const { data: snapshots = [] } = useQuery({
    queryKey: ["base"],
    queryFn: async () => {
      const { data, error } = await supabase.from("base_snapshots").select("*").order("data");
      if (error) throw error;
      return data as Snapshot[];
    },
  });
  const ultimo = snapshots[snapshots.length - 1];
  const maxCadastrados = Math.max(1, ...snapshots.map((s) => s.cadastrados));

  async function registrar(e: FormEvent) {
    e.preventDefault();
    const num = (v: string) => (v === "" ? null : Number(v));
    const { error } = await supabase.from("base_snapshots").insert({
      data: form.data,
      cadastrados: num(form.cadastrados) ?? 0,
      com_cliente: num(form.com_cliente) ?? 0,
      ativados_60d: num(form.ativados_60d) ?? 0,
      tempo_medio_dias: num(form.tempo_medio_dias),
      novos_mes: num(form.novos_mes),
    });
    if (error) return toast.error(error.message);
    toast.success("Fotografia registrada");
    setForm(VAZIO);
    qc.invalidateQueries({ queryKey: ["base"] });
  }

  const card = (titulo: string, valor: string, nota?: string) => (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-sm text-muted-foreground">{titulo}</div>
      <div className="num mt-2 text-3xl font-semibold">{valor}</div>
      {nota && <div className="text-xs text-muted-foreground">{nota}</div>}
    </div>
  );

  return (
    <AppLayout title="Base geral" subtitle="Registre periodicamente os números da base de representantes">
      {ultimo && (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {card("Cadastrados", String(ultimo.cadastrados), `em ${dataBR(ultimo.data)}`)}
          {card(
            "Com ao menos 1 cliente",
            pct(ultimo.cadastrados ? ultimo.com_cliente / ultimo.cadastrados : null),
            `${ultimo.com_cliente} representantes`,
          )}
          {card(
            "Ativados em até 60 dias",
            pct(ultimo.cadastrados ? ultimo.ativados_60d / ultimo.cadastrados : null),
            `${ultimo.ativados_60d} representantes`,
          )}
          {card(
            "Tempo médio até a 1ª venda",
            ultimo.tempo_medio_dias == null ? "—" : `${ultimo.tempo_medio_dias} dias`,
            ultimo.novos_mes == null ? undefined : `${ultimo.novos_mes} novos no mês`,
          )}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Evolução</h2>
          {snapshots.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum registro ainda.</p>
          ) : (
            <>
              <div className="mt-6 flex h-48 items-end gap-3">
                {snapshots.map((s) => (
                  <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="relative w-full max-w-12 rounded-t-md bg-muted"
                      style={{ height: `${(s.cadastrados / maxCadastrados) * 160}px` }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-t-md bg-primary"
                        style={{ height: `${s.cadastrados ? (s.com_cliente / s.cadastrados) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{dataBR(s.data).slice(0, 5)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  Cadastrados
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full bg-primary" />
                  Com cliente
                </span>
              </div>
              <table className="mt-6 w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2">Data</th>
                    <th>Cadastrados</th>
                    <th>Com cliente</th>
                    <th>Ativ. 60d</th>
                    <th>Tempo médio</th>
                    <th>Novos</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2">{dataBR(s.data)}</td>
                      <td>{s.cadastrados}</td>
                      <td>{s.com_cliente}</td>
                      <td>{s.ativados_60d}</td>
                      <td>{s.tempo_medio_dias ?? "—"}</td>
                      <td>{s.novos_mes ?? "—"}</td>
                      <td>
                        <button
                          aria-label="Excluir"
                          onClick={async () => {
                            await supabase.from("base_snapshots").delete().eq("id", s.id);
                            qc.invalidateQueries({ queryKey: ["base"] });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
        <form onSubmit={registrar} className="h-fit space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Nova fotografia</h2>
          {CAMPOS.map(([campo, rotulo, tipo]) => (
            <div key={campo} className="space-y-1">
              <Label className="text-xs">{rotulo}</Label>
              <Input
                type={tipo ?? "number"}
                required={campo === "data" || campo === "cadastrados"}
                value={form[campo]}
                onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
              />
            </div>
          ))}
          <Button type="submit" className="w-full">
            Registrar
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
