import { Fragment, useRef, useState, type ReactNode } from "react";
import { Camera, Heart, MessagesSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, reduzirFoto } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { nomeDe, useAcaoRadar, useEu, useRadar, type Perfil, type PostDaily } from "@/lib/radar";

/* Daily: feed (estilo Twitter) de atualizações diárias do projeto. */

const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

function diaPorExtenso(data: string) {
  const d = new Date(data + "T12:00:00");
  const hoje = hojeBR();
  const ontem = new Date(Date.now() - 3 * 3600e3 - 864e5).toISOString().slice(0, 10);
  const rotulo = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  if (data === hoje) return `Hoje · ${rotulo}`;
  if (data === ontem) return `Ontem · ${rotulo}`;
  return rotulo[0].toUpperCase() + rotulo.slice(1);
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dataCurta = (data: string) => new Date(data + "T12:00:00").toLocaleDateString("pt-BR");

/** Texto com links clicáveis. */
function ComLinks({ texto }: { texto: string }) {
  const partes = texto.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {partes.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all font-bold text-primary underline">
            {p}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function DailyPage() {
  const radar = useRadar();
  const eu = useEu();
  const [filtro, setFiltro] = useState<"todos" | "meus">("todos");
  const perfis = radar.data?.perfis;
  const posts = (radar.data?.daily ?? [])
    .filter((p) => filtro === "todos" || p.autor === eu.email)
    .sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));

  // Agrupa por dia
  const dias: { data: string; posts: PostDaily[] }[] = [];
  for (const p of posts) {
    const ultimo = dias.at(-1);
    if (ultimo?.data === p.data) ultimo.posts.push(p);
    else dias.push({ data: p.data, posts: [p] });
  }

  return (
    <AppLayout icon={MessagesSquare} title="Daily" subtitle="Atualizações diárias do andamento do projeto">
      <div className="mx-auto max-w-2xl">
        {radar.isError ? (
          <div className="cartao px-6 py-10 text-center text-muted-foreground">
            Não consegui carregar a Daily: {(radar.error as Error).message}
          </div>
        ) : (
          <>
            <Composer email={eu.email} perfis={perfis} pronto={!!radar.data} />

            <div className="mb-4 mt-6 flex gap-1 border-b">
              {(
                [
                  ["todos", "Todas as atualizações"],
                  ["meus", "Só as minhas"],
                ] as const
              ).map(([v, rotulo]) => (
                <button
                  key={v}
                  onClick={() => setFiltro(v)}
                  className={cn(
                    "-mb-px cursor-pointer border-b-[3px] px-4 pb-2.5 text-sm font-bold transition-colors",
                    filtro === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-ink",
                  )}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            {!radar.data ? (
              <div className="cartao px-6 py-10 text-center text-muted-foreground">Carregando…</div>
            ) : dias.length === 0 ? (
              <div className="cartao px-6 py-12 text-center">
                <img src="/brand/cardapinho-oculos.webp" alt="" aria-hidden className="mx-auto mb-3 h-28 select-none" />
                <p className="font-bold text-ink">Nenhuma atualização ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">Conte como foi o seu dia aí em cima.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dias.map((dia) => (
                  <section key={dia.data}>
                    <h3 className="rotulo sticky top-0 z-10 mb-2.5 bg-[#f3ecfa]/90 py-1.5 text-xs text-primary backdrop-blur">
                      {diaPorExtenso(dia.data)}
                    </h3>
                    <div className="cartao divide-y overflow-hidden">
                      {dia.posts.map((p) => (
                        <Post key={p.id} post={p} eu={eu.email} master={eu.master} perfis={perfis} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Composer({ email, perfis, pronto }: { email: string; perfis?: Record<string, Perfil>; pronto: boolean }) {
  const acao = useAcaoRadar();
  const [texto, setTexto] = useState("");
  const [data, setData] = useState(hojeBR());
  const arquivo = useRef<HTMLInputElement>(null);

  function publicar() {
    if (!texto.trim()) return;
    acao.mutate(
      { acao: "postarDaily", texto, data },
      {
        onSuccess: () => {
          setTexto("");
          toast.success("Atualização publicada");
        },
      },
    );
  }

  async function trocarFoto(f: File | undefined) {
    if (!f) return;
    try {
      const foto = await reduzirFoto(f);
      acao.mutate({ acao: "salvarPerfil", foto }, { onSuccess: () => toast.success("Ícone atualizado") });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="cartao p-5">
      <div className="flex gap-3.5">
        <button
          type="button"
          title="Trocar meu ícone"
          onClick={() => arquivo.current?.click()}
          className="group relative h-12 w-12 shrink-0 cursor-pointer self-start rounded-full"
        >
          {email && <Avatar email={email} perfis={perfis} tamanho={48} />}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={arquivo}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            trocarFoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-ink">{email ? nomeDe(email, perfis) : "…"}</span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Data
              <input
                type="date"
                value={data}
                max={hojeBR()}
                onChange={(e) => setData(e.target.value || hojeBR())}
                className="rounded-lg border bg-white px-2 py-1 text-sm text-ink"
              />
            </label>
          </div>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) publicar();
            }}
            placeholder="Como foi o dia? Ex.: hoje fiz 5 reuniões, o lead XX falou comigo…"
            className="mt-2.5 min-h-24 resize-y border-0 bg-muted/50 px-3.5 py-3 text-[15px] shadow-none focus-visible:ring-1"
          />
          <div className="mt-2.5 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Ctrl + Enter para publicar</span>
            <span className={cn("ml-auto text-xs", texto.length > 4500 ? "text-destructive" : "text-muted-foreground")}>
              {texto.length}/5000
            </span>
            <Button onClick={publicar} disabled={!pronto || acao.isPending || !texto.trim() || texto.length > 5000}>
              Publicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Post({ post, eu, master, perfis }: { post: PostDaily; eu: string; master: boolean; perfis?: Record<string, Perfil> }) {
  const acao = useAcaoRadar();
  const [editando, setEditando] = useState<{ texto: string; data: string } | null>(null);
  const curtidas = post.curtidas ?? [];
  const curti = curtidas.includes(eu);
  const meu = post.autor === eu;

  const acaoIcone = (rotulo: string, onClick: () => void, children: ReactNode, extra?: string) => (
    <button
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
      className={cn("flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors hover:bg-accent", extra)}
    >
      {children}
    </button>
  );

  return (
    <article className="flex gap-3.5 px-5 py-4 transition-colors hover:bg-[#fbf8fd]">
      <Avatar email={post.autor} perfis={perfis} tamanho={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-black text-ink">{nomeDe(post.autor, perfis)}</span>
          <span className="text-xs text-muted-foreground">
            {dataCurta(post.data)} · postado às {hora(post.criadoEm)}
            {post.editadoEm && " · editado"}
          </span>
        </div>

        {editando ? (
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              acao.mutate(
                { acao: "editarDaily", postId: post.id, texto: editando.texto, data: editando.data },
                { onSuccess: () => setEditando(null) },
              );
            }}
          >
            <Textarea
              autoFocus
              value={editando.texto}
              onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
              className="min-h-24"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editando.data}
                max={hojeBR()}
                onChange={(e) => setEditando({ ...editando, data: e.target.value || post.data })}
                className="rounded-lg border bg-white px-2 py-1 text-sm text-ink"
              />
              <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={!editando.texto.trim()}>
                Salvar
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
            <ComLinks texto={post.texto} />
          </p>
        )}

        {!editando && (
          <div className="-ml-2 mt-2 flex items-center gap-1 text-muted-foreground">
            {acaoIcone(
              curti ? "Descurtir" : "Curtir",
              () => acao.mutate({ acao: "curtirDaily", postId: post.id }),
              <>
                <Heart className={cn("h-4 w-4", curti && "fill-destructive text-destructive")} />
                {curtidas.length > 0 && <span className={cn(curti && "text-destructive")}>{curtidas.length}</span>}
              </>,
              "hover:text-destructive",
            )}
            {curtidas.length > 0 && (
              <span className="truncate text-[11px]" title={curtidas.map((e) => nomeDe(e, perfis)).join(", ")}>
                {curtidas
                  .slice(0, 2)
                  .map((e) => nomeDe(e, perfis).split(" ")[0])
                  .join(", ")}
                {curtidas.length > 2 && ` e mais ${curtidas.length - 2}`}
              </span>
            )}
            <div className="ml-auto flex">
              {meu && acaoIcone("Editar", () => setEditando({ texto: post.texto, data: post.data }), <Pencil className="h-3.5 w-3.5" />)}
              {(meu || master) &&
                acaoIcone(
                  "Apagar",
                  () => confirm("Apagar esta atualização?") && acao.mutate({ acao: "apagarDaily", postId: post.id }),
                  <Trash2 className="h-3.5 w-3.5" />,
                  "hover:text-destructive",
                )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
