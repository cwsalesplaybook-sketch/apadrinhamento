import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  Flag,
  Gauge,
  Handshake,
  Map as Mapa,
  Rocket,
  Scale,
  Target,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { dataHoraBR, useAcaoRadar, useRadar } from "@/lib/radar";

/* Playbook de ativação: o "Modelo de Apadrinhamento dos Representantes" (v2, set/2026)
   transformado em guia de operação. O checklist fica salvo no servidor (marcarPlaybook). */

const SECOES = [
  { id: "visao", rotulo: "Visão geral", icon: Target },
  { id: "passos", rotulo: "Passo a passo", icon: Mapa },
  { id: "papeis", rotulo: "Papéis", icon: Users },
  { id: "abc", rotulo: "Fluxo ABC", icon: Handshake },
  { id: "cadencia", rotulo: "Cadência e ritos", icon: CalendarDays },
  { id: "criterios", rotulo: "Entrada e saída", icon: Scale },
  { id: "metas", rotulo: "Metas", icon: Gauge },
  { id: "cronograma", rotulo: "Cronograma ciclo 1", icon: Flag },
  { id: "riscos", rotulo: "Riscos", icon: AlertTriangle },
] as const;

/* ---------- Passo a passo (checklist) ---------- */

const FASES: { id: string; titulo: string; quando: string; itens: { id: string; texto: string; quem: string }[] }[] = [
  {
    id: "f0",
    titulo: "Fase 0 · Preparação",
    quando: "Antes do D0",
    itens: [
      { id: "f0-decisoes", texto: "Aprovar as 6 decisões com a coordenação (grupo, D30 como decisão, prospecção paralela, certificação fora da 1ª venda, remuneração até 23/10, ciclo 1 com equipe interna)", quem: "Coordenação" },
      { id: "f0-dados", texto: "Levantar os dados: distribuição do tempo até a 1ª venda, taxa de comparecimento, horas de PSM por rep novo, veteranos que aceitariam ser padrinho", quem: "Gestor + RevOps" },
      { id: "f0-rubrica", texto: "Preparar a rubrica do pitch simulado (clareza, objeção, fechamento — 0 a 3 cada)", quem: "Gestor" },
      { id: "f0-controle", texto: "Configurar o controle das duplas aqui no Radar (funil, duplas, campos de reuniões, check-ins, leads e vendas)", quem: "Gestor" },
      { id: "f0-condutores", texto: "Alinhar os condutores do ciclo 1 (teto de 3 afilhados cada, carga de ~8h por afilhado)", quem: "Gestor" },
      { id: "f0-grupo", texto: "Marcar o horário do acompanhamento em grupo semanal (1h; dividir acima de 12 pessoas)", quem: "Gestor" },
    ],
  },
  {
    id: "f1",
    titulo: "Fase 1 · Entrada e seleção",
    quando: "D0 a D5",
    itens: [
      { id: "f1-boasvindas", texto: "D0: entrada, contrato e reunião de boas-vindas", quem: "Gestor / PSM" },
      { id: "f1-treino", texto: "D0–D5: treinamento ao vivo e prospecção dos 6 leads nominais em paralelo", quem: "Afilhado" },
      { id: "f1-leads", texto: "Conferir os 6 leads (nome, contato, cidade, fora da base e sem outro rep)", quem: "Gestor" },
      { id: "f1-pitch", texto: "Avaliar o pitch simulado de 10 min (aprova com 6+ de 9)", quem: "Gestor + condutor" },
      { id: "f1-selecao", texto: "Selecionar as duplas (desempate: leads acima de 6 → nota do pitch → presença no grupo → antiguidade)", quem: "Gestor" },
      { id: "f1-pareamento", texto: "D5: reunião de pareamento (30 min) e cadastro das duplas no Radar", quem: "A, B e Gestor" },
    ],
  },
  {
    id: "f2",
    titulo: "Fase 2 · Reuniões ABC",
    quando: "D6 a D22",
    itens: [
      { id: "f2-r1", texto: "Reunião 1 (D6–D10): padrinho conduz, afilhado observa", quem: "A e B" },
      { id: "f2-r2", texto: "Reunião 2 (D10–D14): padrinho conduz, afilhado participa em pontos pontuais", quem: "A e B" },
      { id: "f2-r3", texto: "Reunião 3 (D14–D18): afilhado conduz, padrinho apoia (passagem de bastão)", quem: "A e B" },
      { id: "f2-r4", texto: "Reunião 4 (D18–D22): afilhado conduz sozinho, padrinho só acompanha", quem: "A e B" },
      { id: "f2-feedback", texto: "Feedback de 5–10 min depois de cada reunião: o que funcionou, o que travou, o que muda", quem: "A e B" },
      { id: "f2-checkins", texto: "Check-ins 2x por semana (20 min), registrando quem faltou", quem: "A e B" },
    ],
  },
  {
    id: "f3",
    titulo: "Fase 3 · Checkpoints",
    quando: "D15 e D30",
    itens: [
      { id: "f3-d15", texto: "D15: checkpoint intermediário com cada afilhado", quem: "Gestor e B" },
      { id: "f3-d12", texto: "Encerrar duplas sem nenhuma reunião até D12 ou com menos de 3 reuniões até D22", quem: "Gestor" },
      { id: "f3-d30", texto: "D30: checkpoint de decisão por dupla (ver tabela de decisão do D30)", quem: "Gestor e B" },
      { id: "f3-validacao", texto: "Encerramentos de duplas conduzidas pelo próprio gestor validados pela coordenação", quem: "Coordenação" },
    ],
  },
  {
    id: "f4",
    titulo: "Fase 4 · Recuperação e autonomia",
    quando: "D30 a D60",
    itens: [
      { id: "f4-recuperacao", texto: "Janela de recuperação até D45 para quem foi prorrogado (check-in semanal com o mesmo padrinho)", quem: "A e B" },
      { id: "f4-d45", texto: "D45: fechar a janela — formatura ou conclusão sem ativação (volta ao grupo)", quem: "Gestor" },
      { id: "f4-d60", texto: "D60: verificar o marco de autonomia (1ª venda conduzida)", quem: "Gestor e B" },
    ],
  },
  {
    id: "f5",
    titulo: "Fase 5 · Leitura do ciclo",
    quando: "Depois do D60",
    itens: [
      { id: "f5-indicadores", texto: "Fechar os indicadores do ciclo, sempre em par originada / conduzida", quem: "Gestor" },
      { id: "f5-parada", texto: "Checar o critério de parada (menos de 2 formaturas ou aderência média abaixo de 60%)", quem: "Coordenação" },
      { id: "f5-roteiro", texto: "Transformar o que funcionou em roteiro de formação dos padrinhos veteranos", quem: "Gestor" },
      { id: "f5-ciclo2", texto: "Decidir o ciclo 2 (veteranos como padrinho, grupo como critério de seleção)", quem: "Coordenação e Gestor" },
    ],
  },
];

function PassoAPasso() {
  const radar = useRadar();
  const acao = useAcaoRadar();
  const feitos = radar.data?.playbook ?? {};
  const total = FASES.reduce((s, f) => s + f.itens.length, 0);
  const prontos = FASES.reduce((s, f) => s + f.itens.filter((i) => feitos[i.id]).length, 0);

  return (
    <>
      <div className="cartao mb-4 flex items-center gap-4 px-5 py-4">
        <div className="num text-3xl text-ink">
          {prontos}
          <span className="text-lg text-muted-foreground">/{total}</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-ink">Progresso do ciclo</div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(prontos / total) * 100}%` }} />
          </div>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:block">O checklist é compartilhado com o time</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {FASES.map((f) => {
          const n = f.itens.filter((i) => feitos[i.id]).length;
          return (
            <section key={f.id} className="cartao p-5">
              <header className="mb-3 flex items-baseline justify-between gap-2">
                <h3 className="font-black text-ink">{f.titulo}</h3>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {f.quando} · {n}/{f.itens.length}
                </span>
              </header>
              <ul className="space-y-1">
                {f.itens.map((i) => {
                  const marca = feitos[i.id];
                  return (
                    <li key={i.id}>
                      <button
                        disabled={!radar.data}
                        onClick={() => acao.mutate({ acao: "marcarPlaybook", itemId: i.id, feito: !marca })}
                        className="flex w-full cursor-pointer gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                            marca ? "border-primary bg-primary text-white" : "border-[#d9c7ea] bg-white",
                          )}
                        >
                          {marca && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-sm leading-snug text-ink", marca && "text-muted-foreground line-through")}>
                            {i.texto}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {i.quem}
                            {marca && ` · feito por ${marca.por.split("@")[0]} em ${dataHoraBR(marca.em)}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Calculadora do pitch e decisão do D30 ---------- */

function RubricaPitch() {
  const itens = ["Clareza da proposta", "Contorno de uma objeção", "Tentativa de fechamento"];
  const [notas, setNotas] = useState([0, 0, 0]);
  const soma = notas.reduce((a, b) => a + b, 0);
  const aprovado = soma >= 6;
  return (
    <div className="cartao p-5">
      <h4 className="font-black text-ink">Rubrica do pitch simulado</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">10 minutos · nota de 0 a 3 em cada item · aprova a partir de 6</p>
      <div className="mt-4 space-y-3">
        {itens.map((rotulo, i) => (
          <div key={rotulo} className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">{rotulo}</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setNotas((n) => n.map((x, j) => (j === i ? v : x)))}
                  className={cn(
                    "num h-8 w-8 cursor-pointer rounded-lg text-sm transition-colors",
                    notas[i] === v ? "bg-primary text-white" : "bg-muted text-ink hover:bg-[#e6d6f3]",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "mt-4 flex items-center justify-between rounded-xl px-4 py-3 font-bold",
          aprovado ? "bg-emerald-100 text-emerald-800" : "bg-destructive/10 text-destructive",
        )}
      >
        <span>Total: {soma}/9</span>
        <span>{aprovado ? "Aprovado" : "Não aprovado"}</span>
      </div>
    </div>
  );
}

function DecisaoD30() {
  const [reunioes, setReunioes] = useState(4);
  const [aderencia, setAderencia] = useState(true);
  const [venda, setVenda] = useState(false);
  const r = venda
    ? { leitura: "Ativou", decisao: "Segue para formatura (precisa também de 3 leads novos próprios)", cor: "bg-emerald-100 text-emerald-800" }
    : reunioes < 3
      ? { leitura: "Já encerrado no D22", decisao: "Volta ao acompanhamento em grupo", cor: "bg-destructive/10 text-destructive" }
      : reunioes === 3
        ? { leitura: "Pipeline insuficiente", decisao: "Volta ao acompanhamento em grupo", cor: "bg-destructive/10 text-destructive" }
        : aderencia
          ? { leitura: "Executou o combinado", decisao: "Prorroga até D45", cor: "bg-warning/25 text-ink" }
          : { leitura: "Cumpriu o campo, não a cadência", decisao: "Volta ao acompanhamento em grupo", cor: "bg-destructive/10 text-destructive" };

  const opcao = (ativo: boolean, onClick: () => void, rotulo: string) => (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-bold transition-colors",
        ativo ? "bg-primary text-white" : "bg-muted text-ink hover:bg-[#e6d6f3]",
      )}
    >
      {rotulo}
    </button>
  );

  return (
    <div className="cartao p-5">
      <h4 className="font-black text-ink">Decisão no D30</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">Baseada no que o representante controla: reuniões realizadas, não a venda</p>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-ink">Reuniões realizadas</span>
          <div className="flex gap-1">
            {opcao(reunioes === 4, () => setReunioes(4), "4")}
            {opcao(reunioes === 3, () => setReunioes(3), "3")}
            {opcao(reunioes < 3, () => setReunioes(2), "Menos de 3")}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-ink">Aderência aos check-ins</span>
          <div className="flex gap-1">
            {opcao(aderencia, () => setAderencia(true), "80% ou mais")}
            {opcao(!aderencia, () => setAderencia(false), "Abaixo de 80%")}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-ink">Já tem venda originada?</span>
          <div className="flex gap-1">
            {opcao(venda, () => setVenda(true), "Sim")}
            {opcao(!venda, () => setVenda(false), "Não")}
          </div>
        </div>
      </div>
      <div className={cn("mt-4 rounded-xl px-4 py-3", r.cor)}>
        <div className="text-xs font-bold uppercase tracking-wide opacity-80">{r.leitura}</div>
        <div className="font-black">{r.decisao}</div>
      </div>
    </div>
  );
}

/* ---------- blocos de conteúdo ---------- */

function Tabela({ cab, linhas }: { cab: string[]; linhas: ReactNode[][] }) {
  return (
    <div className="cartao overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {cab.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t align-top">
              {l.map((c, j) => (
                <td key={j} className={cn("px-4 py-3 text-ink", j === 0 && "font-bold")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Destaque({ children, tom = "roxo" }: { children: ReactNode; tom?: "roxo" | "amarelo" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 px-5 py-4 text-sm leading-relaxed",
        tom === "roxo" ? "border-primary bg-primary/8 text-ink" : "border-warning bg-[#fff8e1] text-ink",
      )}
    >
      {children}
    </div>
  );
}

function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {itens.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-snug text-ink">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Secao({ id, titulo, subtitulo, icon: I, children }: { id: string; titulo: string; subtitulo?: string; icon: typeof Target; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-4 flex items-center gap-3">
        <span className="tile-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
          <I className="h-5 w-5" />
        </span>
        <div>
          <h2 className="titulo-h1 text-2xl leading-none text-ink">{titulo}</h2>
          {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* ---------- página ---------- */

export function PlaybookPage() {
  const [ativa, setAtiva] = useState<string>("visao");

  // Destaca na barra a seção que está na tela.
  useEffect(() => {
    const aoRolar = () => {
      let atual: string = SECOES[0].id;
      for (const { id } of SECOES) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) atual = id;
      }
      setAtiva(atual);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const ir = (id: string) => {
    setAtiva(id);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  };

  return (
    <AppLayout icon={BookOpenCheck} title="Playbook de ativação" subtitle="Como montar e rodar o apadrinhamento dos representantes">
      <nav className="sticky top-0 z-20 -mx-1 mb-6 flex gap-2 overflow-x-auto bg-[#f3ecfa]/85 px-1 py-2 backdrop-blur">
        {SECOES.map(({ id, rotulo, icon: I }) => (
          <button
            key={id}
            onClick={() => ir(id)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors",
              ativa === id ? "border-primary bg-primary text-white" : "border-[#ece3f6] bg-white text-ink hover:border-primary/50",
            )}
          >
            <I className="h-4 w-4" /> {rotulo}
          </button>
        ))}
      </nav>

      <div className="space-y-12 pb-16">
        <Secao id="visao" titulo="Visão geral" subtitulo="Por que o programa existe e o que ele resolve" icon={Target}>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["116", "representantes na base"],
              ["25,9%", "com ao menos um cliente"],
              ["18,1%", "ativados em até 60 dias (piso)"],
              ["24 dias", "até a 1ª venda, entre quem vendeu"],
            ].map(([n, r]) => (
              <div key={r} className="cartao px-4 py-3">
                <div className="num text-2xl text-ink">{n}</div>
                <div className="text-xs text-muted-foreground">{r}</div>
              </div>
            ))}
          </div>
          <Destaque>
            <strong>O problema não é de velocidade, é de conversão.</strong> A maior parte da base nunca vende, e quem vende vende
            cedo. A ativação se decide no primeiro mês, justamente quando o representante termina o treinamento e fica sozinho. É
            nessa janela que o apadrinhamento atua.
          </Destaque>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="cartao p-5">
              <h3 className="font-black text-ink">Apadrinhamento — o programa</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Quem acompanha quem, com que frequência e até quando. Núcleo de 30 dias, com marcos de recuperação e autonomia até
                D60.
              </p>
            </div>
            <div className="cartao p-5">
              <h3 className="font-black text-ink">ABC Acelerado — o método de campo</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Quatro reuniões em que o padrinho (A) passa aos poucos a condução da venda para o afilhado (B), diante do cliente
                (C).
              </p>
            </div>
          </div>
          <Destaque tom="amarelo">
            Ataca a hipótese 3 (falta de estrutura de ativação). O critério de entrada também gera um dado sobre a hipótese 1
            (qualificação na entrada). A hipótese 2 (perfil renda extra) não é testada aqui.
          </Destaque>
          <Tabela
            cab={["Termo", "Significado"]}
            linhas={[
              ["Ativação", "Primeira venda originada: o rep já trouxe um cliente, mesmo que o padrinho tenha conduzido"],
              ["Autonomia", "Primeira venda conduzida: o rep já vende sozinho, sem o padrinho na condução"],
              ["Venda originada", "Fechada a partir de um lead prospectado pelo afilhado, independente de quem conduziu"],
              ["Venda conduzida", "Afilhado conduziu apresentação e fechamento sem intervenção do padrinho"],
              ["Lead nominal", "Restaurante com nome, contato e cidade, fora da base e sem outro representante"],
              ["Cliente ativo", "Contrato assinado, implantação concluída e ainda na base"],
            ]}
          />
        </Secao>

        <Secao id="passos" titulo="Passo a passo" subtitulo="Marque cada etapa conforme o ciclo anda — o time inteiro vê" icon={Mapa}>
          <PassoAPasso />
          <Destaque>
            O controle das duplas (reuniões, check-ins, leads e vendas) é feito aqui no Radar: cadastre cada dupla em{" "}
            <Link to="/duplas" className="font-bold text-primary underline">
              Duplas
            </Link>
            , mova pelas etapas do funil e acompanhe a evolução semanal no{" "}
            <Link to="/historico" className="font-bold text-primary underline">
              Histórico
            </Link>
            .
          </Destaque>
        </Secao>

        <Secao id="papeis" titulo="Papéis" subtitulo="A clareza da fronteira entre os papéis é o que faz o modelo funcionar" icon={Users}>
          <Tabela
            cab={["Papel", "Responde por", "Não responde por"]}
            linhas={[
              ["A · Padrinho", "Conduzir as 2 primeiras reuniões, apoiar a 3ª, acompanhar a 4ª, feedback após cada uma, check-ins", "Sistema, implantação, contrato"],
              ["B · Afilhado", "Prospectar os próprios leads, cumprir a cadência, assumir a condução a partir da 3ª reunião", "—"],
              ["PSM", "Sistema, implantação, certificação e suporte técnico", "Ensinar a vender"],
              ["Gestor do programa", "Formar as duplas, acompanhar a cadência, decidir formatura ou encerramento, contrato e comissão", "Operar a dupla no dia a dia"],
            ]}
          />
          <div className="cartao-escuro p-5">
            <h3 className="font-black">Regra de fronteira</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ["Dúvida de venda", "Padrinho"],
                ["Dúvida de sistema, implantação ou suporte", "PSM"],
                ["Dúvida de contrato ou comissão", "Gestor do programa"],
              ].map(([q, r]) => (
                <div key={q} className="rounded-xl bg-white/10 px-4 py-3">
                  <div className="text-xs text-white/70">{q}</div>
                  <div className="font-black text-warning">{r}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/75">
              É o que tira o PSM da posição de canal único — e vale mesmo que nada mais do modelo seja aprovado.
            </p>
          </div>
          <Destaque tom="amarelo">
            <strong>Ciclo 1:</strong> o padrinho é a equipe interna (supervisor + channel acquisition; a partir de outubro pode
            entrar o PSM de ativação). Os veteranos assumem no ciclo 2. Se o gestor conduzir duplas, os encerramentos dessas duplas
            são validados pela coordenação.
          </Destaque>
        </Secao>

        <Secao id="abc" titulo="Fluxo ABC" subtitulo="Quatro reuniões, quatro leads diferentes, todos prospectados pelo afilhado" icon={Handshake}>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["1ª", "D6–D10", "Conduz e apresenta", "Observa", "B só assiste — zero pressão"],
              ["2ª", "D10–D14", "Conduz e apresenta", "Participa", "B entra em pontos pontuais"],
              ["3ª", "D14–D18", "Apoia", "Conduz e apresenta", "B assume, A é a rede de segurança"],
              ["4ª", "D18–D22", "Apenas acompanha", "Conduz e apresenta", "B prova a si mesmo que consegue"],
            ].map(([n, janela, a, b, muda], i) => (
              <div key={n} className="cartao relative p-4">
                <div className="flex items-baseline justify-between">
                  <span className="num text-3xl text-primary">{n}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{janela}</span>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Padrinho (A): </span>
                    <span className="font-bold text-ink">{a}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Afilhado (B): </span>
                    <span className="font-bold text-ink">{b}</span>
                  </div>
                </div>
                <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">{muda}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(i + 1) * 25}%` }} />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">condução do afilhado</div>
              </div>
            ))}
          </div>
          <Lista
            itens={[
              <>Reuniões em <strong>janelas</strong>, não datas fixas. O que é fixo são os marcos D15, D30, D45 e D60.</>,
              <><strong>6 leads, não 4:</strong> os 2 de folga evitam que o ciclo trave na 3ª reunião, onde o bastão passa (pode subir para 8 conforme a taxa de comparecimento).</>,
              <><strong>Feedback obrigatório</strong> de 5–10 min depois de cada reunião: o que funcionou, o que travou, o que muda na próxima.</>,
              <>O padrinho está presente na 3ª e na 4ª reunião para a conversa com o cliente não se perder.</>,
            ]}
          />
        </Secao>

        <Secao id="cadencia" titulo="Cadência e ritos" subtitulo="Dias corridos; reunião em dia não útil vai para o próximo dia útil, sem mexer nos marcos" icon={CalendarDays}>
          <div className="cartao overflow-x-auto p-5">
            <ol className="flex min-w-[760px] items-start">
              {[
                ["D0", "Entrada, contrato e boas-vindas", "Gestor / PSM"],
                ["D0–D5", "Treino ao vivo + prospecção dos 6 leads", "Afilhado"],
                ["D5", "Critério de entrada e pareamento", "A, B e Gestor"],
                ["D6–D22", "As 4 reuniões ABC", "A e B"],
                ["D15", "Checkpoint intermediário", "Gestor e B"],
                ["D30", "Checkpoint de decisão (ativação)", "Gestor e B"],
                ["D45", "Fecha a recuperação", "Gestor"],
                ["D60", "Marco de autonomia", "Gestor e B"],
              ].map(([d, oque, quem], i, arr) => (
                <li key={d} className="relative flex-1 px-1.5 text-center">
                  {i < arr.length - 1 && <span className="absolute left-1/2 top-4 h-0.5 w-full bg-[#e3d5ef]" />}
                  <span
                    className={cn(
                      "num relative z-10 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-xs",
                      ["D15", "D30", "D45", "D60"].includes(d) ? "bg-primary text-white" : "bg-white text-primary ring-2 ring-primary/40",
                    )}
                  >
                    {d}
                  </span>
                  <div className="mt-2 text-xs font-bold leading-tight text-ink">{oque}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{quem}</div>
                </li>
              ))}
            </ol>
          </div>
          <Tabela
            cab={["Rito", "Participantes", "Frequência", "Duração"]}
            linhas={[
              ["Pareamento", "A, B e Gestor", "Uma vez, no D5", "30 min"],
              ["Check-in individual", "A e B", "2x por semana até D30", "20 min"],
              ["Feedback pós-reunião", "A e B", "Após cada reunião ABC", "5 a 10 min"],
              ["Acompanhamento em grupo", "Gestor ou A + entrantes", "Semanal", "60 min"],
              ["Roda de padrinhos", "Gestor e todos os A", "Quinzenal", "30 min"],
              ["Checkpoint", "Gestor e B", "D15 e D30", "20 min"],
            ]}
          />
          <Destaque tom="amarelo">
            <strong>Carga do padrinho:</strong> ~8 horas por afilhado no núcleo de 30 dias (~4h são as próprias reuniões). Esse
            número precisa estar no convite ao veterano. <strong>Mudança na jornada:</strong> a prospecção passa a ser paralela ao
            treinamento, não depois dele.
          </Destaque>
        </Secao>

        <Secao id="criterios" titulo="Entrada e saída" subtitulo="Quem pode ser padrinho, quem entra como afilhado e como cada dupla termina" icon={Scale}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="cartao p-5">
              <h3 className="mb-3 font-black text-ink">Quem pode ser padrinho</h3>
              <Lista
                itens={[
                  "Pelo menos 3 clientes ativos vendidos e 90 dias de programa",
                  "No máximo 1 cancelamento na carteira nos últimos 90 dias",
                  "Aceite do compromisso de agenda (carga de 8h declarada)",
                  "Teto de 1 afilhado por vez (veteranos); no ciclo 1, até 3 por condutor interno",
                  "A partir do ciclo 2: trilha de vendas concluída",
                ]}
              />
            </div>
            <div className="cartao p-5">
              <h3 className="mb-3 font-black text-ink">Quem entra como afilhado</h3>
              <Lista
                itens={[
                  "Presença no treinamento ao vivo",
                  "6 leads nominais registrados",
                  "Pitch simulado de 10 min com 6+ pontos na rubrica",
                  "Disponibilidade declarada de no mínimo 6 horas por semana",
                ]}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RubricaPitch />
            <DecisaoD30 />
          </div>
          <Tabela
            cab={["Saída", "Quando acontece", "O que acontece"]}
            linhas={[
              ["Formatura", "4 reuniões + 1ª venda originada + 3 leads novos próprios (além dos 6)", "Vira representante ativo"],
              ["Marco de autonomia", "1ª venda conduzida até D60", "Mede o objetivo real; fica fora da formatura de propósito"],
              ["Prorrogação", "Uma vez, até D45: 4 reuniões e aderência de 80%+ sem venda", "Se vender até D45, forma normalmente"],
              ["Conclusão sem ativação", "Prorrogado que não vendeu até D45", "Volta ao grupo; não conta contra o padrinho"],
              ["Encerramento", "Nenhuma reunião até D12, menos de 3 até D22, 2 faltas seguidas sem aviso ou quebra de conduta", "Volta ao grupo e a vaga é liberada"],
              ["Reentrada", "Uma vez, no ciclo seguinte", "Cumpre o critério de entrada de novo, sem prioridade"],
              ["Saída do padrinho", "2 afilhados seguidos encerrados por falha de cadência do padrinho", "Perde o papel"],
            ]}
          />
          <Destaque>
            <strong>Mais aprovados que vagas?</strong> Desempate nesta ordem: leads entregues acima de 6 → nota do pitch → presença
            no acompanhamento em grupo (a partir do ciclo 2) → ordem de entrada no programa. Quem não pega vaga fica no
            acompanhamento em grupo e concorre no ciclo seguinte.
          </Destaque>
        </Secao>

        <Secao id="metas" titulo="Metas" subtitulo="Ativação sempre reportada em par: originada / conduzida" icon={Gauge}>
          <Tabela
            cab={["Indicador do ciclo", "Meta", "Para que serve"]}
            linhas={[
              ["Entrantes aprovados no critério de entrada", "medir", "Dado sobre a hipótese 1"],
              ["Bastão passado (3ª reunião conduzida pelo B)", "5 de 6", "Mede a execução do método"],
              ["Ativação: 1ª venda originada até D30", "4 de 6, com piso de 2 conduzidas", "Pode incluir venda fechada pelo padrinho"],
              ["Autonomia: 1ª venda conduzida até D60", "3 de 6", "O objetivo real do programa"],
              ["Aderência à cadência, por dupla", "80% ou mais", "Abaixo de 60% na média aciona parada"],
              ["Presença média no acompanhamento em grupo", "60% ou mais", "Mede a camada de cobertura"],
              ["Horas de PSM por representante novo", "−30% vs. linha de base", "Segundo objetivo do programa"],
              ["Conversão das reuniões 3 e 4", "medir", "Comparada com as reuniões 1 e 2"],
              ["Cancelamento dos clientes das duplas em 90 dias", "medir", "Comparado com a base no mesmo período"],
            ]}
          />
          <div className="cartao-escuro flex items-start gap-3 p-5">
            <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm leading-relaxed">
              <strong className="text-warning">Critério de parada:</strong> se o ciclo terminar com menos de 2 formaturas ou
              aderência média abaixo de 60%, o programa não escala sem revisar o critério de entrada e o perfil de quem está sendo
              recrutado. O ciclo 1 prova o mecanismo, não a eficácia.
            </p>
          </div>
        </Secao>

        <Secao id="cronograma" titulo="Cronograma do ciclo 1" subtitulo="6 duplas, padrinhos da equipe interna, dois condutores · 72 horas no total" icon={Flag}>
          <Tabela
            cab={["Data", "Etapa", "Responsável"]}
            linhas={[
              ["até 18/09", "Decisões necessárias", "Coordenação"],
              ["21 a 25/09", "Preparação: rubrica do pitch, controle das duplas, alinhamento dos condutores", "Gestor"],
              ["29/09", "D0 — entrada da turma, contrato e boas-vindas", "Gestor / PSM"],
              ["29/09 a 05/10", "Treinamento ao vivo e prospecção dos 6 leads", "Afilhados"],
              ["05/10", "D5 — critério de entrada, seleção das 6 duplas e pareamento", "Gestor"],
              ["06 a 21/10", "As quatro reuniões ABC, dentro das janelas", "Duplas"],
              ["14/10", "D15 — checkpoint intermediário", "Gestor"],
              ["até 23/10", "Modelo de remuneração do padrinho (incl. comissão das reuniões 1 e 2)", "Coordenação"],
              ["29/10", "D30 — checkpoint de decisão por dupla", "Gestor"],
              ["até 05/11", "Leitura preliminar e decisão sobre o ciclo 2", "Coordenação e Gestor"],
              ["13/11", "D45 — fecha a janela de recuperação", "Gestor"],
              ["30/11", "D60 — verificação do marco de autonomia", "Gestor"],
              ["até 04/12", "Leitura final do ciclo 1, com autonomia medida", "Coordenação e Gestor"],
            ]}
          />
          <Tabela
            cab={["Custo em horas", "Cálculo", "Total"]}
            linhas={[
              ["Padrinho, D0 a D30", "6 duplas × 8h", "48 h"],
              ["Acompanhamento em grupo", "4 sessões × 1h30", "6 h"],
              ["Gestão (pareamento, checkpoints, roda)", "—", "10 h"],
              ["Acompanhamento D30 a D60", "6 duplas × ~1h30", "8 h"],
              ["Ciclo completo", "—", "72 h"],
            ]}
          />
        </Secao>

        <Secao id="riscos" titulo="Riscos" subtitulo="O que pode dar errado e como o modelo se protege" icon={AlertTriangle}>
          <Tabela
            cab={["Risco", "Mitigação"]}
            linhas={[
              ["Condutor não sustenta a agenda", "Carga declarada, janelas em vez de datas; se indisponível por 5+ dias úteis: suspender novas duplas, alongar janelas, reduzir para 4 duplas"],
              ["Afilhado não entrega os 6 leads", "Filtro no D5: quem não entrega fica no grupo e não consome vaga"],
              ["Gestor acumula o papel de padrinho", "Encerramentos das duplas dele validados pela coordenação"],
              ["Padrinho retoma o bastão para não perder a venda", "Autonomia medida em D60, fora da formatura; venda conduzida como indicador separado"],
              ["Sobrecarga do PSM com implantações antecipadas", "Teto de 6 implantações antecipadas; horas de PSM medidas"],
              ["Conflito de lead entre representantes", "Lead nominal exclui restaurante já atribuído; conferência no D5"],
              ["Amostra pequena leva a conclusão errada", "Ciclo 1 comunicado como prova de mecanismo; escala decidida com 3 ciclos"],
              ["Cliente mal atendido nas reuniões 3 e 4", "Padrinho presente; conversão 3–4 vs. 1–2; cancelamento acompanhado por 90 dias"],
            ]}
          />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" /> Fonte: Modelo de Apadrinhamento dos Representantes · versão 2 · setembro de 2026
          </p>
        </Secao>
      </div>
    </AppLayout>
  );
}
