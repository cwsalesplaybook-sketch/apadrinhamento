import { useMemo, useState, type ReactNode } from "react";
import { AlarmClock, CalendarCheck, CalendarPlus, CalendarX, Check, Hourglass, MessageCircle, PhoneCall, ShieldAlert, UserX } from "lucide-react";
import { Fluxo, Secao } from "@/components/Layout";
import { EditorLinha, Modal } from "@/components/Editor";
import { Carregando } from "@/routes/trilha";
import {
  ETAPAS_ABC,
  brParaIso,
  contatos,
  corEtapa,
  haQuanto,
  hojeBR,
  hojeMais,
  isoParaBr,
  useAlterar,
  useDados,
  type Contato,
} from "@/lib/trilha";
import { toast } from "sonner";

const whatsapp = (tel = "") => {
  const d = tel.replace(/\D/g, "");
  return d.length >= 10 ? `https://wa.me/55${d}` : "";
};

function Indicador({ icon: I, valor, rotulo, tom }: { icon: typeof AlarmClock; valor: number; rotulo: string; tom: string }) {
  return (
    <div className="cartao flex items-center gap-3 p-4">
      <span className={`icone-tile h-11 w-11 shrink-0 ${tom}`}>
        <I className="h-5 w-5" />
      </span>
      <div>
        <p className="titulo text-[28px] leading-none">{valor}</p>
        <p className="mt-1 text-xs leading-snug text-suave">{rotulo}</p>
      </div>
    </div>
  );
}

/** Registrar um follow: data do contato, próximo contato e anotação (vai para o feedback). */
function RegistrarContato({ c, onFechar }: { c: Contato; onFechar: () => void }) {
  const [data, setData] = useState(hojeBR());
  const [proximo, setProximo] = useState(hojeMais(3));
  const [nota, setNota] = useState("");
  const alterar = useAlterar();
  const atalhos = [
    ["Amanhã", 1],
    ["2 dias", 2],
    ["3 dias", 3],
    ["5 dias", 5],
    ["7 dias", 7],
    ["15 dias", 15],
  ] as const;

  function salvar() {
    const rep = c.rep;
    const dia = data.slice(0, 5);
    const feedback = nota.trim() ? `${rep.feedback ? rep.feedback + "\n" : ""}Follow ${dia}: ${nota.trim()}` : rep.feedback ?? "";
    alterar.mutate(
      { acao: "salvarLinha", tabela: "abc", linha: { ...rep, ultimoContato: data, proximoContato: proximo, feedback } },
      { onSuccess: () => (toast.success(`Contato com ${rep.representante.split(" ")[0]} registrado`), onFechar()) },
    );
  }

  return (
    <Modal titulo={`Registrar contato — ${c.rep.representante}`} onFechar={onFechar}>
      <div className="space-y-5 overflow-y-auto px-5 py-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black tracking-wider text-fraco uppercase">Data do contato</span>
          <input type="date" className="campo" value={brParaIso(data)} onChange={(e) => setData(isoParaBr(e.target.value))} />
        </label>
        <div>
          <span className="mb-1.5 block text-xs font-black tracking-wider text-fraco uppercase">Próximo contato</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {atalhos.map(([r, d]) => (
              <button
                key={r}
                type="button"
                onClick={() => setProximo(hojeMais(d))}
                className={`botao !py-1.5 text-xs ${proximo === hojeMais(d) ? "botao-primario" : "botao-fantasma"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <input type="date" className="campo" value={brParaIso(proximo)} onChange={(e) => setProximo(isoParaBr(e.target.value))} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-black tracking-wider text-fraco uppercase">O que aconteceu (opcional)</span>
          <textarea
            className="campo min-h-24"
            placeholder="Ex.: mandei o follow no WhatsApp, vai visitar 2 restaurantes amanhã"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <span className="mt-1 block text-xs text-fraco">Entra no feedback do rep como "Follow {data.slice(0, 5)}: …".</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-borda px-5 py-4">
        <button onClick={onFechar} className="botao botao-fantasma">
          Cancelar
        </button>
        <button onClick={salvar} className="botao botao-primario" disabled={alterar.isPending || !data}>
          <Check className="h-4 w-4" /> {alterar.isPending ? "Salvando…" : "Registrar"}
        </button>
      </div>
    </Modal>
  );
}

function LinhaRep({ c, detalhe, acao }: { c: Contato; detalhe: ReactNode; acao: ReactNode }) {
  const wa = whatsapp(c.rep.telefone);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borda px-4 py-3 first:border-t-0">
      <div className="min-w-48 flex-1">
        <p className="font-black">{c.rep.representante}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-suave">
          {c.rep.etapa && <span className={`pilula ${corEtapa(c.rep.etapa)}`}>{c.rep.etapa}</span>}
          {detalhe}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" className="botao botao-fantasma !px-2.5" title="Abrir WhatsApp">
            <MessageCircle className="h-4 w-4 text-verde" />
          </a>
        )}
        {acao}
      </div>
    </li>
  );
}

function Lista({ titulo, icon: I, tom, vazio, children, total }: { titulo: string; icon: typeof AlarmClock; tom: string; vazio: string; children: ReactNode[]; total?: number }) {
  return (
    <section className="cartao overflow-hidden">
      <header className="flex items-center gap-3 border-b border-borda px-4 py-3.5">
        <span className={`icone-tile h-9 w-9 ${tom}`}>
          <I className="h-[18px] w-[18px]" />
        </span>
        <h2 className="flex-1 text-lg">{titulo}</h2>
        <span className="pilula">{total ?? children.length}</span>
      </header>
      {children.length ? <ul>{children}</ul> : <p className="px-4 py-8 text-center text-sm text-suave">{vazio}</p>}
    </section>
  );
}

export function InicioPage() {
  const { data, isLoading, error } = useDados();
  const [etapa, setEtapa] = useState("");
  const [registrar, setRegistrar] = useState<Contato | null>(null);
  const [marcar, setMarcar] = useState<Contato | null>(null);
  const [verTodos, setVerTodos] = useState(false);

  const todos = useMemo(() => (data ? contatos(data.tabelas.abc, data.tabelas.frente) : []), [data]);
  const lista = todos.filter((c) => !etapa || c.rep.etapa === etapa);

  const hoje = lista.filter((c) => c.diasAteProximo != null && c.diasAteProximo <= 0).sort((a, b) => a.diasAteProximo! - b.diasAteProximo!);
  const proximos = lista.filter((c) => c.diasAteProximo != null && c.diasAteProximo > 0 && c.diasAteProximo <= 7).sort((a, b) => a.diasAteProximo! - b.diasAteProximo!);
  // Mais tempo sem follow: quem nunca teve contato registrado vem primeiro.
  const semFollow = [...lista].sort((a, b) => (b.diasSemContato ?? 9999) - (a.diasSemContato ?? 9999));
  const faltaUmAum = lista.filter((c) => c.umAum === "falta");
  const marcados = lista.filter((c) => c.umAum === "marcado").sort((a, b) => brParaIso(a.dataUmAum).localeCompare(brParaIso(b.dataUmAum)));

  const botaoRegistrar = (c: Contato) => (
    <button onClick={() => setRegistrar(c)} className="botao botao-primario !py-1.5 text-xs">
      <PhoneCall className="h-3.5 w-3.5" /> Registrar contato
    </button>
  );

  return (
    <>
      <h1 className="titulo-ouro text-4xl sm:text-[46px] sm:leading-[1.05]">
        Nenhum rep sem <em>ponto de contato.</em>
      </h1>
      <p className="mt-1 text-lg text-suave">Quem precisa de follow hoje, quem está há mais tempo sem contato e quem falta marcar o De frente com Gabi.</p>

      <Carregando carregando={isLoading} erro={error}>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-suave">Etapa:</span>
          {["", ...ETAPAS_ABC].map((e) => (
            <button key={e || "todas"} onClick={() => setEtapa(e)} className={`nav-item border border-borda ${etapa === e ? "nav-ativo" : "bg-white"}`}>
              {e || "Todas"}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <Indicador icon={CalendarX} valor={hoje.filter((c) => c.diasAteProximo! < 0).length} rotulo="Follows atrasados" tom="!bg-[#fdeaea] !text-vermelho" />
          <Indicador icon={AlarmClock} valor={hoje.filter((c) => c.diasAteProximo === 0).length} rotulo="Follows para hoje" tom="" />
          <Indicador icon={CalendarPlus} valor={lista.filter((c) => !c.proximo).length} rotulo="Sem próximo contato agendado" tom="!bg-[#fff4dc] !text-dourado" />
          <Indicador icon={Hourglass} valor={lista.filter((c) => c.diasSemContato == null || c.diasSemContato >= 7).length} rotulo="7+ dias sem contato (ou nunca)" tom="!bg-[#fff4dc] !text-dourado" />
          <Indicador icon={UserX} valor={faltaUmAum.length} rotulo="Falta marcar o De frente com Gabi" tom="!bg-[#fdeaea] !text-vermelho" />
        </div>

        <div className="mt-6">
          <Lista titulo="Fazer hoje" icon={AlarmClock} tom="" vazio="Nenhum follow atrasado ou para hoje. Ao registrar um contato, escolha a data do próximo — ele aparece aqui no dia.">
            {hoje.map((c) => (
              <LinhaRep
                key={c.rep.id}
                c={c}
                detalhe={
                  <>
                    <span className={`font-black ${c.diasAteProximo! < 0 ? "text-vermelho" : "text-roxo"}`}>
                      {c.diasAteProximo! < 0 ? `Atrasado ${-c.diasAteProximo!} dia${c.diasAteProximo === -1 ? "" : "s"}` : "Hoje"}
                    </span>
                    <span>Último contato {haQuanto(c.diasSemContato)}</span>
                  </>
                }
                acao={botaoRegistrar(c)}
              />
            ))}
          </Lista>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Lista titulo="Há mais tempo sem follow" icon={Hourglass} tom="!bg-[#fff4dc] !text-dourado" vazio="Nenhum rep nesta etapa." total={semFollow.length}>
            {[
              ...(verTodos ? semFollow : semFollow.slice(0, 8)).map((c) => (
                <LinhaRep
                  key={c.rep.id}
                  c={c}
                  detalhe={
                    <>
                      <span className={`font-black ${c.diasSemContato == null || c.diasSemContato >= 7 ? "text-vermelho" : "text-texto"}`}>
                        Último contato {haQuanto(c.diasSemContato)}
                      </span>
                      <span>Próximo: {c.proximo || "não agendado"}</span>
                    </>
                  }
                  acao={botaoRegistrar(c)}
                />
              )),
              semFollow.length > 8 && (
                <li key="mais" className="border-t border-borda px-4 py-2.5 text-center">
                  <button onClick={() => setVerTodos(!verTodos)} className="text-sm font-black text-roxo">
                    {verTodos ? "Ver menos" : `Ver todos (${semFollow.length})`}
                  </button>
                </li>
              ),
            ].filter(Boolean)}
          </Lista>

          <div className="space-y-4">
            <Lista titulo="Falta marcar o De frente com Gabi" icon={UserX} tom="!bg-[#fdeaea] !text-vermelho" vazio="Todo mundo desta etapa já tem 1:1 feito ou marcado.">
              {faltaUmAum.map((c) => (
                <LinhaRep
                  key={c.rep.id}
                  c={c}
                  detalhe={<span>Nenhum 1:1 registrado</span>}
                  acao={
                    <button onClick={() => setMarcar(c)} className="botao botao-fantasma !py-1.5 text-xs">
                      <CalendarCheck className="h-3.5 w-3.5 text-roxo" /> Marcar 1:1
                    </button>
                  }
                />
              ))}
            </Lista>
            <Lista titulo="Próximos 7 dias" icon={CalendarCheck} tom="" vazio="Nenhum follow agendado para os próximos 7 dias.">
              {[
                ...proximos.map((c) => (
                  <LinhaRep
                    key={c.rep.id}
                    c={c}
                    detalhe={<span className="font-black text-roxo">Follow em {c.proximo}</span>}
                    acao={botaoRegistrar(c)}
                  />
                )),
                ...marcados.map((c) => (
                  <LinhaRep key={`1a1-${c.rep.id}`} c={c} detalhe={<span className="font-black text-verde">De frente com Gabi em {c.dataUmAum}</span>} acao={null} />
                )),
              ]}
            </Lista>
          </div>
        </div>
      </Carregando>

      <div className="alerta-ouro mt-10 flex gap-4 p-5">
        <span className="icone-tile h-10 w-10 shrink-0 !bg-white !text-dourado">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg">Regra principal da jornada</h2>
          <p className="mt-1 text-sm text-suave">
            O contrato só é assinado se o representante ativar o primeiro cliente. A conclusão do ABC, sozinha, não garante a entrada
            definitiva no programa.
          </p>
        </div>
      </div>

      <Secao titulo="Fluxo da jornada" descricao="Do primeiro dia no programa até o próximo nível da trilha.">
        <Fluxo />
      </Secao>

      {registrar && <RegistrarContato key={registrar.rep.id} c={registrar} onFechar={() => setRegistrar(null)} />}
      {marcar && (
        <EditorLinha
          tabela="frente"
          linha={null}
          inicial={{ representante: marcar.rep.representante, telefone: marcar.rep.telefone ?? "" }}
          titulo="De frente com Gabi"
          onFechar={() => setMarcar(null)}
        />
      )}
    </>
  );
}
