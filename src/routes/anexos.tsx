import { useState } from "react";
import { Copy, ExternalLink, FileSpreadsheet, FileText, Link2, Palette, Paperclip, Pencil, Plus, Presentation, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataHoraBR, nomeDe, useAcaoRadar, useRadar, type Anexo } from "@/lib/radar";

/* Anexo: links e materiais que o time usa no programa. */

function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Ícone e nome do serviço pelo endereço do link. */
function servico(url: string) {
  const d = dominio(url);
  if (d.includes("canva.com")) return { icon: Palette, nome: "Canva", cor: "#00c4cc" };
  if (d.includes("docs.google.com") && url.includes("/spreadsheets")) return { icon: FileSpreadsheet, nome: "Google Planilhas", cor: "#0f9d58" };
  if (d.includes("docs.google.com") && url.includes("/presentation")) return { icon: Presentation, nome: "Google Apresentações", cor: "#f4b400" };
  if (d.includes("docs.google.com") || d.includes("drive.google.com")) return { icon: FileText, nome: "Google Drive", cor: "#4285f4" };
  if (d.includes("youtube.com") || d.includes("youtu.be") || d.includes("loom.com")) return { icon: Video, nome: "Vídeo", cor: "#ff5959" };
  return { icon: Link2, nome: d, cor: "#a543fa" };
}

export function AnexosPage() {
  const radar = useRadar();
  const [editando, setEditando] = useState<Partial<Anexo> | null>(null);
  const anexos = radar.data?.anexos ?? [];

  return (
    <AppLayout
      icon={Paperclip}
      title="Anexo"
      subtitle="Links e materiais que usamos no programa"
      actions={
        <Button onClick={() => setEditando({})}>
          <Plus className="h-4 w-4" /> Novo anexo
        </Button>
      }
    >
      {radar.isError ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">
          Não consegui carregar os anexos: {(radar.error as Error).message}
        </div>
      ) : !radar.data ? (
        <div className="cartao px-6 py-10 text-center text-muted-foreground">Carregando…</div>
      ) : anexos.length === 0 ? (
        <div className="cartao px-6 py-12 text-center">
          <p className="font-bold text-ink">Nenhum anexo ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro em “Novo anexo”.</p>
        </div>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {anexos.map((a) => (
            <CartaoAnexo key={a.id} a={a} editar={() => setEditando(a)} perfis={radar.data?.perfis} />
          ))}
        </div>
      )}
      <EditorAnexo anexo={editando} fechar={() => setEditando(null)} />
    </AppLayout>
  );
}

function CartaoAnexo({ a, editar, perfis }: { a: Anexo; editar: () => void; perfis?: Parameters<typeof nomeDe>[1] }) {
  const acao = useAcaoRadar();
  const s = servico(a.url);
  const I = s.icon;
  return (
    <article className="cartao flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: s.cor }}>
          <I className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-black leading-tight text-ink" title={a.titulo}>
            {a.titulo}
          </h3>
          <div className="truncate text-xs text-muted-foreground">{s.nome}</div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar anexo" onClick={editar}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label="Apagar anexo"
          onClick={() =>
            confirm(`Apagar o anexo "${a.titulo}"?`) &&
            acao.mutate({ acao: "apagarAnexo", anexoId: a.id }, { onSuccess: () => toast.success("Anexo apagado") })
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {a.descricao && <p className="mt-3 text-sm leading-snug text-ink">{a.descricao}</p>}
      <div className="mt-auto pt-4">
        <div className="mb-3 truncate text-[11px] text-muted-foreground">
          {nomeDe(a.atualizadoEm ? a.autor : a.autor, perfis)} · {dataHoraBR(a.atualizadoEm ?? a.criadoEm)}
        </div>
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Abrir
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(a.url);
                toast.success("Link copiado");
              } catch {
                toast.error("Não consegui copiar o link");
              }
            }}
          >
            <Copy className="h-4 w-4" /> Copiar link
          </Button>
        </div>
      </div>
    </article>
  );
}

function EditorAnexo({ anexo, fechar }: { anexo: Partial<Anexo> | null; fechar: () => void }) {
  const acao = useAcaoRadar();
  const [rascunho, setRascunho] = useState<Partial<Anexo>>({});
  const [aberto, setAberto] = useState<Partial<Anexo> | null>(null);
  if (anexo !== aberto) {
    setAberto(anexo);
    setRascunho(anexo ?? {});
  }

  return (
    <Dialog open={!!anexo} onOpenChange={(a) => !a && fechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rascunho.id ? "Editar anexo" : "Novo anexo"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            acao.mutate(
              { acao: "salvarAnexo", anexo: rascunho },
              {
                onSuccess: () => {
                  toast.success("Anexo salvo");
                  fechar();
                },
              },
            );
          }}
        >
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input
              required
              value={rascunho.titulo ?? ""}
              onChange={(e) => setRascunho((r) => ({ ...r, titulo: e.target.value }))}
              placeholder="Ex.: Apresentação do programa"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Link</Label>
            <Input
              required
              type="url"
              value={rascunho.url ?? ""}
              onChange={(e) => setRascunho((r) => ({ ...r, url: e.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição (opcional)</Label>
            <Textarea
              value={rascunho.descricao ?? ""}
              onChange={(e) => setRascunho((r) => ({ ...r, descricao: e.target.value }))}
              placeholder="Para que serve esse material"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={acao.isPending}>
              Salvar anexo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
