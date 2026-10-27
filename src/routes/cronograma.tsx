import { useState } from "react";
import { Plus, User } from "lucide-react";
import { CabecalhoPagina, Secao } from "@/components/Layout";
import { EditorLinha } from "@/components/Editor";
import { Carregando } from "@/routes/trilha";
import { corStatus, useDados, type Linha, type TabelaId } from "@/lib/trilha";

const FILTROS = [
  ["", "Todos"],
  ["Pendente", "Pendentes"],
  ["Em andamento", "Em andamento"],
  ["Concluído", "Concluídos"],
] as const;

export function CronogramaPage() {
  const { data, isLoading, error } = useDados();
  const [filtro, setFiltro] = useState("");
  const [aberta, setAberta] = useState<{ tabela: TabelaId; linha: Linha | null } | null>(null);

  const marcos = data?.tabelas.marcos ?? [];
  const acoes = (data?.tabelas.acoes ?? []).filter((a) => !filtro || a.status === filtro);

  return (
    <>
      <CabecalhoPagina sobre="Datas, status e responsáveis" titulo="Cronograma e próximos passos">
        O que já foi fechado, o que está marcado e quem é responsável por cada frente da jornada.
      </CabecalhoPagina>

      <Carregando carregando={isLoading} erro={error}>
        <Secao titulo="Marcos" descricao="Datas que marcam a construção da jornada.">
          <div className="space-y-3">
            {marcos.map((m) => (
              <button key={m.id} onClick={() => setAberta({ tabela: "marcos", linha: m })} className="cartao cartao-link flex w-full flex-wrap gap-4 p-5 text-left sm:flex-nowrap">
                <div className="w-36 shrink-0">
                  <p className="titulo text-lg text-dourado">{m.data || "Sem data"}</p>
                  {m.horario && <p className="text-xs text-suave">{m.horario}</p>}
                  {m.status && <span className={`pilula mt-2 ${corStatus(m.status)}`}>{m.status.toUpperCase()}</span>}
                </div>
                <div>
                  <h3 className="text-lg">{m.titulo}</h3>
                  {m.descricao && <p className="mt-1 text-sm text-suave">{m.descricao}</p>}
                  {m.responsavel && <p className="mt-2 text-xs text-fraco">Responsável: {m.responsavel}</p>}
                </div>
              </button>
            ))}
            <button className="botao botao-fantasma" onClick={() => setAberta({ tabela: "marcos", linha: null })}>
              <Plus className="h-4 w-4" /> Novo marco
            </button>
          </div>
        </Secao>

        <Secao titulo="Ações e próximos passos" descricao="Acompanhe o status de cada ação combinada no time.">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTROS.map(([valor, rotulo]) => (
              <button key={rotulo} onClick={() => setFiltro(valor)} className={`nav-item border border-borda ${filtro === valor ? "nav-ativo" : ""}`}>
                {rotulo}
              </button>
            ))}
            <div className="flex-1" />
            <button className="botao botao-primario" onClick={() => setAberta({ tabela: "acoes", linha: null })}>
              <Plus className="h-4 w-4" /> Nova ação
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {acoes.map((a) => (
              <button key={a.id} onClick={() => setAberta({ tabela: "acoes", linha: a })} className="cartao cartao-link flex flex-col p-5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[17px] leading-snug">{a.titulo}</h3>
                  <span className={`pilula ${corStatus(a.status)}`}>{(a.status || "Pendente").toUpperCase()}</span>
                </div>
                {a.descricao && <p className="mt-1.5 text-sm text-suave">{a.descricao}</p>}
                {(a.responsavel || a.prazo) && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fraco">
                    {a.responsavel && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {a.responsavel}
                      </span>
                    )}
                    {a.prazo && <span>Prazo: {a.prazo}</span>}
                  </div>
                )}
              </button>
            ))}
            {acoes.length === 0 && <p className="text-sm text-suave">Nenhuma ação com esse status.</p>}
          </div>
          <p className="mt-4 text-xs text-fraco">
            Clique numa ação ou marco para mudar status, data ou responsável. As ações são combinados internos do time e não geram notificação
            automática.
          </p>
        </Secao>
      </Carregando>

      {aberta && (
        <EditorLinha
          tabela={aberta.tabela}
          linha={aberta.linha}
          titulo={aberta.linha?.titulo || (aberta.tabela === "marcos" ? "Marco" : "Ação")}
          onFechar={() => setAberta(null)}
        />
      )}
    </>
  );
}
