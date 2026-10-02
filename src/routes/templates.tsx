import { useState } from "react";
import { Check, Copy, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { dataHoraBR, useAcaoRadar, useRadar, type Template } from "@/lib/radar";

/** Templates de mensagens do PSM. Ficam no mesmo armazenamento dos funis (api/radar.js). */
export function TemplatesPage() {
  const radar = useRadar();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [editando, setEditando] = useState<Partial<Template> | null>(null);

  const templates = radar.data?.templates ?? [];
  const categorias = [...new Set(templates.map((t) => t.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const termo = busca.trim().toLowerCase();
  const visiveis = templates.filter(
    (t) =>
      (!categoria || t.categoria === categoria) &&
      (!termo || `${t.titulo} ${t.texto} ${t.categoria}`.toLowerCase().includes(termo)),
  );

  return (
    <AppLayout
      icon={FileText}
      title="Templates"
      subtitle="Mensagens prontas do PSM: clique para copiar"
      actions={
        <Button onClick={() => setEditando({ categoria: categoria ?? "" })}>
          <Plus className="h-4 w-4" /> Novo template
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <label className="cartao flex h-10 items-center gap-2 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar template"
            className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        {categorias.length > 1 &&
          [null, ...categorias].map((c) => (
            <button
              key={c ?? "todas"}
              onClick={() => setCategoria(c)}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors",
                categoria === c ? "border-primary bg-primary text-white" : "border-[#ece3f6] bg-white text-ink hover:border-primary/50",
              )}
            >
              {c ?? "Todas"}
            </button>
          ))}
      </div>

      {radar.isError ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">
          Não consegui carregar os templates: {(radar.error as Error).message}
        </div>
      ) : !radar.data ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">Carregando templates…</div>
      ) : templates.length === 0 ? (
        <div className="cartao px-6 py-12 text-center">
          <img src="/brand/cardapinho-oculos.webp" alt="" aria-hidden className="mx-auto mb-3 h-28 select-none" />
          <p className="font-bold text-ink">Nenhum template ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro em “Novo template”.</p>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">Nenhum template encontrado.</div>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {visiveis.map((t) => (
            <CartaoTemplate key={t.id} t={t} editar={() => setEditando(t)} />
          ))}
        </div>
      )}

      <EditorTemplate template={editando} categorias={categorias} fechar={() => setEditando(null)} />
    </AppLayout>
  );
}

function CartaoTemplate({ t, editar }: { t: Template; editar: () => void }) {
  const acao = useAcaoRadar();
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(t.texto);
      setCopiado(true);
      toast.success("Template copiado");
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      toast.error("Não consegui copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <article className="cartao flex flex-col p-5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{t.categoria}</span>
          <h3 className="mt-2 font-black leading-tight text-ink">{t.titulo}</h3>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar template" onClick={editar}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label="Apagar template"
          onClick={() =>
            confirm(`Apagar o template "${t.titulo}"?`) &&
            acao.mutate({ acao: "apagarTemplate", templateId: t.id }, { onSuccess: () => toast.success("Template apagado") })
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <button
        onClick={copiar}
        title="Clique para copiar"
        className="mt-3 flex-1 cursor-pointer rounded-2xl bg-muted/60 p-3.5 text-left transition-colors hover:bg-muted"
      >
        <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-ink">{t.texto}</p>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <span className="min-w-0 truncate text-[11px] text-muted-foreground">
          {(t.atualizadoPor ?? t.autor).split("@")[0]} · {dataHoraBR(t.atualizadoEm ?? t.criadoEm)}
        </span>
        <Button size="sm" className="ml-auto" onClick={copiar}>
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </article>
  );
}

function EditorTemplate({
  template,
  categorias,
  fechar,
}: {
  template: Partial<Template> | null;
  categorias: string[];
  fechar: () => void;
}) {
  const acao = useAcaoRadar();
  const [rascunho, setRascunho] = useState<Partial<Template>>({});
  const [aberto, setAberto] = useState<Partial<Template> | null>(null);

  // Recomeça o formulário sempre que abre outro template.
  if (template !== aberto) {
    setAberto(template);
    setRascunho(template ?? {});
  }

  return (
    <Dialog open={!!template} onOpenChange={(a) => !a && fechar()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rascunho.id ? "Editar template" : "Novo template"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            acao.mutate(
              { acao: "salvarTemplate", template: rascunho },
              {
                onSuccess: () => {
                  toast.success("Template salvo");
                  fechar();
                },
              },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input
                required
                value={rascunho.titulo ?? ""}
                onChange={(e) => setRascunho((r) => ({ ...r, titulo: e.target.value }))}
                placeholder="Ex.: Boas-vindas ao afilhado"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Input
                list="categorias-template"
                value={rascunho.categoria ?? ""}
                onChange={(e) => setRascunho((r) => ({ ...r, categoria: e.target.value }))}
                placeholder="Geral"
              />
              <datalist id="categorias-template">
                {categorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Texto</Label>
            <Textarea
              required
              value={rascunho.texto ?? ""}
              onChange={(e) => setRascunho((r) => ({ ...r, texto: e.target.value }))}
              placeholder="Escreva a mensagem como ela vai ser enviada…"
              className="min-h-64"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={acao.isPending}>
              Salvar template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
