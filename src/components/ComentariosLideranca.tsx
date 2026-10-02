import { useState } from "react";
import { Crown, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { dataHoraBR, useAcaoRadar, useEu, type ComentarioLideranca } from "@/lib/radar";

/** "Comentários da Liderança": só masters escrevem (o servidor confere); todo mundo lê. */
export function ComentariosLideranca({ duplaId, comentarios }: { duplaId: string; comentarios: ComentarioLideranca[] }) {
  const { master } = useEu();
  const acao = useAcaoRadar();
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);

  return (
    <section className="cartao-escuro overflow-hidden">
      <header className="flex items-center gap-2.5 px-5 pb-3 pt-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning text-ink">
          <Crown className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-black leading-tight">Comentários da Liderança</h2>
          <p className="text-xs text-white/70">{master ? "Visível para o PSM desta dupla" : "Orientações da liderança para esta dupla"}</p>
        </div>
      </header>

      {master && (
        <form
          className="px-5 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!texto.trim()) return;
            acao.mutate(
              { acao: "comentarioLideranca", duplaId, texto },
              {
                onSuccess: () => {
                  setTexto("");
                  toast.success("Comentário da liderança salvo");
                },
              },
            );
          }}
        >
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva um comentário ou orientação para o PSM…"
            className="min-h-20 border-white/20 bg-white/10 text-white placeholder:text-white/50"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" disabled={acao.isPending || !texto.trim()}>
              Comentar
            </Button>
          </div>
        </form>
      )}

      {comentarios.length === 0 && !master && (
        <p className="border-t border-white/15 px-5 py-4 text-sm text-white/70">Nenhum comentário da liderança ainda.</p>
      )}
      {comentarios.length > 0 && (
        <ul className="space-y-2.5 border-t border-white/15 px-5 py-4">
          {comentarios.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white/10 p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-xs text-white/70">
                <span className="font-bold text-warning">{c.autor.split("@")[0]}</span>
                <span>· {dataHoraBR(c.criadoEm)}</span>
                {c.editadoEm && <span>(editado)</span>}
                {master && (
                  <div className="ml-auto flex">
                    <button
                      aria-label="Editar comentário"
                      className="cursor-pointer rounded-md p-1 hover:bg-white/15"
                      onClick={() => setEditando({ id: c.id, texto: c.texto })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Apagar comentário"
                      className="cursor-pointer rounded-md p-1 hover:bg-white/15"
                      onClick={() =>
                        confirm("Apagar este comentário da liderança?") &&
                        acao.mutate({ acao: "apagarComentarioLideranca", duplaId, comentarioId: c.id })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {editando?.id === c.id ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    acao.mutate(
                      { acao: "editarComentarioLideranca", duplaId, comentarioId: c.id, texto: editando.texto },
                      { onSuccess: () => setEditando(null) },
                    );
                  }}
                >
                  <Textarea
                    autoFocus
                    value={editando.texto}
                    onChange={(e) => setEditando({ id: c.id, texto: e.target.value })}
                    className="min-h-20 border-white/20 bg-white/10 text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditando(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={!editando.texto.trim()}>
                      Salvar
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.texto}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
