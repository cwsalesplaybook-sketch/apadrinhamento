import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  COLUNAS,
  brParaIso,
  corEtapa,
  corStatus,
  hojeBR,
  isoParaBr,
  novoId,
  useAlterar,
  type Coluna,
  type Linha,
  type TabelaId,
} from "@/lib/trilha";

export function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onFechar]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onFechar}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-borda bg-fundo-2 shadow-2xl sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-borda px-5 py-4">
          <h2 className="text-xl">{titulo}</h2>
          <button onClick={onFechar} className="rounded-lg p-1.5 text-suave hover:bg-white/10" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BotaoCopiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="botao botao-fantasma !px-2.5 !py-1 text-xs"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        });
      }}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {ok ? "Copiado" : rotulo}
    </button>
  );
}

function Campo({ coluna, valor, onMudar }: { coluna: Coluna; valor: string; onMudar: (v: string) => void }) {
  switch (coluna.tipo) {
    case "longo":
      return <textarea className="campo min-h-32 resize-y" value={valor} onChange={(e) => onMudar(e.target.value)} />;
    case "data":
      return <input type="date" className="campo" value={brParaIso(valor)} onChange={(e) => onMudar(isoParaBr(e.target.value))} />;
    case "numero":
      return <input type="number" min={0} className="campo" value={valor} onChange={(e) => onMudar(e.target.value)} />;
    case "simnao":
      return (
        <div className="flex gap-2">
          {["Sim", "Não"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onMudar(o)}
              className={`botao flex-1 ${valor === o ? (o === "Sim" ? "bg-verde/20 text-verde" : "bg-vermelho/15 text-vermelho") : "botao-fantasma"}`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    case "opcao": {
      const opcoes = coluna.opcoes ?? [];
      return (
        <select className="campo" value={valor} onChange={(e) => onMudar(e.target.value)}>
          <option value="">—</option>
          {/* Valor antigo fora da lista continua aparecendo. */}
          {valor && !opcoes.includes(valor) && <option value={valor}>{valor}</option>}
          {opcoes.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    }
    default:
      return <input className="campo" value={valor} onChange={(e) => onMudar(e.target.value)} />;
  }
}

/** Formulário de uma linha: cria, edita e apaga. */
export function EditorLinha({
  tabela,
  linha,
  titulo,
  onFechar,
}: {
  tabela: TabelaId;
  linha: Linha | null;
  titulo: string;
  onFechar: () => void;
}) {
  const colunas = COLUNAS[tabela];
  const nova = !linha;
  const [form, setForm] = useState<Linha>(() => linha ?? { id: novoId() });
  const alterar = useAlterar();

  function mudar(chave: string, v: string) {
    setForm((f) => {
      const proximo = { ...f, [chave]: v };
      // Trocar de etapa no ABC reinicia o "Na etapa desde".
      if (tabela === "abc" && chave === "etapa" && v !== (linha?.etapa ?? "")) proximo.desde = hojeBR();
      return proximo;
    });
  }

  function salvar() {
    alterar.mutate(
      { acao: "salvarLinha", tabela, linha: form },
      {
        onSuccess: () => {
          toast.success("Salvo");
          onFechar();
        },
      },
    );
  }

  function apagar() {
    if (!linha || !confirm("Apagar este registro?")) return;
    alterar.mutate({ acao: "apagarLinha", tabela, id: linha.id }, { onSuccess: () => (toast.success("Apagado"), onFechar()) });
  }

  return (
    <Modal titulo={nova ? `Novo — ${titulo}` : titulo} onFechar={onFechar}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
      >
        <div className="grid gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
          {colunas.map((c) => (
            <label key={c.chave} className={`block ${c.tipo === "longo" ? "sm:col-span-2" : ""}`}>
              <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-fraco">
                {c.rotulo}
                {c.copiar && form[c.chave] && <BotaoCopiar texto={form[c.chave]} />}
              </span>
              <Campo coluna={c} valor={form[c.chave] ?? ""} onMudar={(v) => mudar(c.chave, v)} />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-borda px-5 py-4">
          {!nova && (
            <button type="button" onClick={apagar} className="botao botao-perigo" disabled={alterar.isPending}>
              <Trash2 className="h-4 w-4" /> Apagar
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onFechar} className="botao botao-fantasma">
            Cancelar
          </button>
          <button type="submit" className="botao botao-primario" disabled={alterar.isPending}>
            {alterar.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Célula da lista: pílula para etapa/status/sim-não, texto cortado para campos longos. */
function Celula({ coluna, linha }: { coluna: Coluna; linha: Linha }) {
  const v = linha[coluna.chave] ?? "";
  if (!v) return <span className="text-fraco">—</span>;
  if (coluna.chave === "etapa") return <span className={`pilula ${corEtapa(v)}`}>{v}</span>;
  if (coluna.chave === "status") return <span className={`pilula ${corStatus(v)}`}>{v}</span>;
  if (coluna.tipo === "simnao") return <span className={`pilula ${v === "Sim" ? "pilula-verde" : "pilula-vermelha"}`}>{v}</span>;
  if (coluna.tipo === "longo")
    return (
      <div className="flex items-start gap-2">
        <span className="line-clamp-3 whitespace-pre-line text-suave">{v}</span>
        {coluna.copiar && <BotaoCopiar texto={v} />}
      </div>
    );
  return <span className={coluna.chave === "representante" || coluna.chave === "situacao" ? "font-semibold" : ""}>{v}</span>;
}

export type Extra = { rotulo: string; valor: (l: Linha) => ReactNode; depoisDe: string };

/** Tabela com busca, filtro e "+ Novo"; clicar numa linha abre o formulário. */
export function TabelaEditavel({
  tabela,
  linhas,
  titulo,
  filtro,
  extras = [],
  vazio = "Nada por aqui ainda.",
}: {
  tabela: TabelaId;
  linhas: Linha[];
  titulo: string;
  filtro?: { chave: string; opcoes: string[] };
  extras?: Extra[];
  vazio?: string;
}) {
  const [busca, setBusca] = useState("");
  const [filtroValor, setFiltroValor] = useState("");
  const [aberta, setAberta] = useState<Linha | null | "nova">(null);

  const colunas = COLUNAS[tabela].filter((c) => c.lista);
  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter(
      (l) =>
        (!filtroValor || l[filtro!.chave] === filtroValor) &&
        (!termo || Object.values(l).some((v) => String(v).toLowerCase().includes(termo))),
    );
  }, [linhas, busca, filtroValor, filtro]);

  const cabecalhos: { rotulo: string; render: (l: Linha) => ReactNode }[] = [];
  for (const c of colunas) {
    cabecalhos.push({ rotulo: c.rotulo, render: (l) => <Celula coluna={c} linha={l} /> });
    for (const x of extras.filter((x) => x.depoisDe === c.chave)) cabecalhos.push({ rotulo: x.rotulo, render: x.valor });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fraco" />
          <input className="campo !pl-9" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {filtro && (
          <select className="campo !w-auto" value={filtroValor} onChange={(e) => setFiltroValor(e.target.value)}>
            <option value="">Todas as etapas</option>
            {filtro.opcoes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        )}
        <button className="botao botao-primario" onClick={() => setAberta("nova")}>
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      <div className="cartao overflow-x-auto">
        <table className="tabela w-full min-w-[720px]">
          <thead>
            <tr>
              {cabecalhos.map((h) => (
                <th key={h.rotulo}>{h.rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l) => (
              <tr key={l.id} onClick={() => setAberta(l)}>
                {cabecalhos.map((h) => (
                  <td key={h.rotulo} className="max-w-md">
                    {h.render(l)}
                  </td>
                ))}
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={cabecalhos.length} className="py-10 text-center text-suave">
                  {linhas.length ? "Nenhum resultado para esse filtro." : vazio}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-fraco">
        {visiveis.length} de {linhas.length} · clique numa linha para editar
      </p>

      {aberta && (
        <EditorLinha
          key={aberta === "nova" ? "nova" : aberta.id}
          tabela={tabela}
          linha={aberta === "nova" ? null : aberta}
          titulo={aberta === "nova" ? titulo : aberta.representante || aberta.situacao || aberta.titulo || titulo}
          onFechar={() => setAberta(null)}
        />
      )}
    </div>
  );
}
