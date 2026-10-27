import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Gift, Info, LockOpen, Target, TrendingUp, Users } from "lucide-react";
import { Cartao, Coroa, Grade, Secao } from "@/components/Layout";
import { Modal } from "@/components/Editor";

type Nivel = { nome: string; clientes: string; frase: string; libera?: string[]; beneficios?: string[] };

const GRUPOS: { nome: string; descricao: string; niveis: Nivel[] }[] = [
  {
    nome: "Iniciantes",
    descricao: "Entrada no programa e primeiro passo da trilha.",
    niveis: [
      {
        nome: "Cadastrado",
        clientes: "Entrada",
        frase: "Entrada no programa, antes da primeira venda.",
        libera: [
          "Acesso básico ao portal e ao quadro de leads, onde pode adicionar oportunidades manualmente.",
          "Ainda não tem acesso a: página de captura, indicadores, mapa de prospecção, faturas e comissões, inadimplência, roleplays, certificações, minha equipe e calculadora de comissão.",
        ],
      },
      {
        nome: "Graduado",
        clientes: "1 cliente",
        frase: "Tudo começa aqui. Bem-vindo ao time!",
        libera: ["Página de captura"],
        beneficios: ["Treinamento ao vivo sobre o uso da página de captura"],
      },
    ],
  },
  {
    nome: "Aspirantes",
    descricao: "Quem está construindo ritmo para virar Estrela.",
    niveis: [
      {
        nome: "Consultor",
        clientes: "3 clientes",
        frase: "Primeiras conquistas, mais oportunidades.",
        libera: ["Mapa de prospecção (mapa de oportunidades)", "Certificações, que passam a ser obrigatórias para subir de nível"],
        beneficios: ["Formatura com kit de boas-vindas", "Treinamento completo de CRM (mapa e página de captura)"],
      },
      {
        nome: "Executivo",
        clientes: "5 clientes",
        frase: "Você já se destaca no mercado.",
        libera: ["Faturas, comissões e inadimplência"],
        beneficios: ["Treinamento sobre as novas abas", "Entrada no Rota 25, um acompanhamento personalizado feito pela Beatriz"],
      },
      {
        nome: "Executivo II",
        clientes: "10 clientes",
        frase: "Mais resultados, mais visibilidade.",
        libera: ["Roleplays e sala de call"],
        beneficios: ["Treinamento sobre o uso da sala de call"],
      },
    ],
  },
  {
    nome: "Estrelas",
    descricao: "Valhalla, influência e títulos de liderança.",
    niveis: [
      {
        nome: "Executivo III",
        clientes: "25 clientes",
        frase: "Referência entre os representantes. Desbloqueia o Valhalla.",
        libera: [
          "Calculadora de comissão, atualizada para calcular uma venda individual e as vendas do mês, e não só o forecast total",
          "Conselho, com encontro mensal, e voz ativa",
          "Assistente de vendas",
        ],
        beneficios: [
          "Vídeo de boas-vindas gravado pela Beatriz, com template para o representante postar no Instagram",
          "Participação em eventos, a partir deste nível",
          "Acesso ao Valhalla, com relação mais próxima e estratégica com a Cardápio Web",
        ],
      },
      {
        nome: "Pré-diretor",
        clientes: "50 clientes",
        frase: "Mais influência. Mais resultados. Mais reconhecimento.",
        libera: ["Indicadores"],
        beneficios: [
          "Placa de conquista do cargo",
          "Acesso antecipado às novidades, com um pré-changelog exclusivo",
          "Planejamento trimestral ou semestral com o PSM",
        ],
      },
      {
        nome: "Diretor de Expansão",
        clientes: "100 clientes",
        frase: "Você lidera pelo exemplo e inspira outros representantes.",
        libera: ["Minha equipe"],
        beneficios: ["Evento presencial com imersão e conversa com a liderança do time Cardápio Web", "Gravação de case de sucesso"],
      },
      {
        nome: "Diretor Regional",
        clientes: "500 clientes",
        frase: "Expansão de mercado e desenvolvimento de novos talentos.",
        beneficios: [
          "Apoio para uma ação comercial na região (evento, campanha conjunta etc.)",
          "Possibilidade de atuar por licença: compra a licença e revende, no mínimo, pelo preço da Cardápio Web (modelo a definir)",
        ],
      },
      {
        nome: "VP de Expansão",
        clientes: "1.000+ clientes",
        frase: "O mais alto nível da carreira de representantes da Cardápio Web.",
        beneficios: ["Modelo de franquia (a definir com a liderança)", "Evento exclusivo para VPs de Expansão e Diretores Regionais"],
      },
    ],
  },
];

function Lista({ titulo, itens, icon: I, cor }: { titulo: string; itens: string[]; icon: typeof Gift; cor: string }) {
  return (
    <div className="mt-4">
      <p className={`sobretitulo !text-[0.65rem] ${cor}`}>{titulo}</p>
      <ul className="mt-2 space-y-1.5">
        {itens.map((i) => (
          <li key={i} className="flex gap-2 text-sm text-suave">
            <I className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cor}`} />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const IMAGEM: Record<string, string> = {
  Graduado: "graduado",
  Consultor: "consultor",
  Executivo: "executivo",
  "Executivo II": "executivo-2",
  "Executivo III": "executivo-3",
  "Pré-diretor": "pre-diretor",
  "Diretor de Expansão": "diretor-expansao",
  "Diretor Regional": "diretor-regional",
  "VP de Expansão": "vp-expansao",
};

/** Os 9 níveis com cliente (o Cadastrado fica de fora, como no mockup). */
const TRILHA = GRUPOS.flatMap((g) => g.niveis.map((n) => ({ ...n, grupo: g.nome }))).filter((n) => IMAGEM[n.nome]);

function CartaoNivel({ nivel, onAbrir }: { nivel: (typeof TRILHA)[number]; onAbrir: () => void }) {
  // No cartão, o número sem "+" e a frase curta (como no mockup); o detalhe completo fica no modal.
  const [numero, ...resto] = nivel.clientes.replace("+", "").split(" ");
  const frase = nivel.frase.replace(" Desbloqueia o Valhalla.", "");
  const topo = nivel.nome === "Diretor Regional" || nivel.nome === "VP de Expansão";
  return (
    <button
      onClick={onAbrir}
      className={`cartao cartao-link group relative flex items-center gap-3 p-4 text-left ${topo ? "!border-[#ffe2a3] !bg-[#fff6e0]" : ""}`}
    >
      <img src={`/brand/niveis/${IMAGEM[nivel.nome]}.webp`} alt="" className="h-[92px] w-[92px] shrink-0 rounded-2xl object-cover" />
      <span className="min-w-0 flex-1">
        <span className={`titulo block text-2xl leading-none ${topo ? "text-[#e0301e]" : "text-texto"}`}>{numero}</span>
        <span className="block text-sm font-bold">{resto.join(" ")}</span>
        <span className="titulo mt-1.5 block text-lg leading-tight">{nivel.nome}</span>
        <span className="mt-1 block text-xs leading-snug text-suave">{frase}</span>
      </span>
      <span
        className={`absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full ${topo ? "bg-amarelo/30 text-dourado" : "bg-lavanda text-roxo"}`}
      >
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function Banner() {
  return (
    <div className="relative mt-6 overflow-visible">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#f1e8ff] via-[#ebe0ff] to-[#e3d4ff] px-6 py-8 sm:px-12 sm:py-10">
        {/* Faixas decorativas. */}
        <span className="absolute top-10 left-[48%] h-9 w-40 -rotate-[28deg] rounded-full bg-[#c9a6ff]/60" />
        <span className="absolute bottom-6 left-[52%] h-10 w-56 -rotate-[28deg] rounded-full bg-[#b98aff]/50" />
        <span className="absolute -top-6 right-24 h-14 w-72 -rotate-[28deg] rounded-full bg-white/50" />
        <span className="absolute right-[34%] bottom-10 hidden h-3 w-16 -rotate-[60deg] rounded-full bg-amarelo md:block" />
        <span className="absolute top-14 right-[36%] hidden h-3 w-10 -rotate-[60deg] rounded-full bg-amarelo md:block" />

        <div className="relative z-10 max-w-md">
          <p className="flex items-center gap-2 text-xs font-black tracking-[0.25em] text-roxo-claro">
            <Coroa className="h-6 w-6 text-amarelo" /> CARDÁPIO WEB
          </p>
          <p className="mt-3 leading-[0.9]">
            <span className="titulo text-[54px] font-[1000] tracking-tight sm:text-[64px]">Trilha</span>{" "}
            <span className="titulo text-4xl sm:text-[44px]">do</span>
            <br />
            <span className="titulo text-[48px] font-[1000] tracking-tight text-roxo sm:text-[62px]">Representante</span>
          </p>
          <p className="mt-3 flex items-center gap-3 text-lg text-suave">
            <span className="h-1.5 w-12 -rotate-6 rounded-full bg-amarelo" /> Cada cliente é uma nova conquista.
          </p>
          <Link to="/jornada" className="botao botao-primario mt-6 !px-6 !py-3 !text-base">
            Explorar a jornada <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mao absolute top-1/2 right-6 z-10 hidden -translate-y-1/2 -rotate-12 text-right text-[30px] leading-[1.05] text-roxo xl:block">
          Evolua.
          <br />
          Conquiste.
          <br />
          Lidere.
          <br />
          Faça parte
          <br />
          dessa história.
          <span className="mt-1 ml-auto block h-1 w-24 rounded-full bg-amarelo" />
        </p>
      </div>
      <img
        src="/brand/cardapinho-viking.webp"
        alt="Cardapinho viking com espada e escudo"
        className="pointer-events-none absolute right-[16%] -bottom-2 z-20 hidden h-[118%] select-none drop-shadow-[0_20px_25px_rgba(60,20,120,0.35)] md:block xl:right-[19%]"
      />
    </div>
  );
}

export function NiveisPage() {
  const [aberto, setAberto] = useState<(typeof TRILHA)[number] | null>(null);
  return (
    <>
      <h1 className="titulo-ouro text-4xl sm:text-[46px] sm:leading-[1.05]">
        Seu próximo nível <em>começa aqui.</em>
      </h1>
      <p className="mt-1 text-lg text-suave">Venda, evolua e conquiste novos espaços na Cardápio Web.</p>

      <Banner />

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        <h2 className="text-2xl sm:text-[30px]">Uma jornada de crescimento</h2>
        <span className="flex items-center gap-2 text-sm text-suave">
          <TrendingUp className="h-5 w-5 text-roxo" /> <b className="text-texto">9 níveis</b> • do primeiro cliente à expansão
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TRILHA.slice(0, 5).map((n) => (
          <CartaoNivel key={n.nome} nivel={n} onAbrir={() => setAberto(n)} />
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRILHA.slice(5).map((n) => (
          <CartaoNivel key={n.nome} nivel={n} onAbrir={() => setAberto(n)} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1.1fr]">
        <a href="#como-avancar" className="cartao cartao-link flex items-center gap-4 p-5">
          <span className="icone-tile h-14 w-14 shrink-0">
            <Target className="h-7 w-7" />
          </span>
          <span className="flex-1">
            <span className="titulo block text-lg">Como avançar</span>
            <span className="text-sm text-suave">Ative clientes e acompanhe sua evolução.</span>
          </span>
          <ChevronRight className="h-5 w-5 text-roxo" />
        </a>
        <Link to="/estrelas" className="cartao cartao-link flex items-center gap-4 !border-[#ffe2a3] !bg-[#fff6e0] p-5">
          <span className="icone-tile h-14 w-14 shrink-0 !bg-white">
            <Users className="h-7 w-7" />
          </span>
          <span className="flex-1">
            <span className="titulo block text-lg">Conselho de Embaixadores</span>
            <span className="text-sm text-suave">Um novo espaço de participação a partir de 25 clientes.</span>
          </span>
          <ChevronRight className="h-5 w-5 text-dourado" />
        </Link>
      </div>

      <p className="mt-5 flex items-center gap-3 text-sm text-suave">
        <Info className="h-5 w-5 shrink-0" /> A assinatura do contrato acontece após a ativação do primeiro cliente.
        <span className="h-px flex-1 bg-borda" />
      </p>

      <div id="como-avancar" className="scroll-mt-6">
        <Secao titulo="Como avançar" descricao="O nível é definido pela quantidade de clientes ativos na carteira. Cada nível libera novas áreas no portal e concede novos benefícios — e o acesso é cumulativo.">
          <Grade colunas={2}>
            <Cartao titulo="Antes do 1º cliente: Cadastrado">
              {GRUPOS[0].niveis[0].libera?.map((t) => (
                <p key={t} className="mt-1">
                  {t}
                </p>
              ))}
            </Cartao>
            <Cartao titulo="Grupos da trilha">
              Iniciantes (Cadastrado e Graduado), Aspirantes (Consultor, Executivo e Executivo II) e Estrelas (Executivo III em diante). Os nomes
              dos grupos são provisórios e o fechamento dos níveis ainda está na pauta da tierização.
            </Cartao>
          </Grade>
        </Secao>
      </div>

      {aberto && (
        <Modal titulo={aberto.nome} onFechar={() => setAberto(null)}>
          <div className="overflow-y-auto px-5 py-5">
            <div className="flex items-center gap-4">
              <img src={`/brand/niveis/${IMAGEM[aberto.nome]}.webp`} alt="" className="h-24 w-24 rounded-2xl object-cover" />
              <div>
                <span className="pilula pilula-roxa">{aberto.grupo}</span>
                <p className="titulo mt-2 text-2xl">{aberto.clientes}</p>
                <p className="text-suave">{aberto.frase}</p>
              </div>
            </div>
            {aberto.libera && <Lista titulo="Libera no portal" itens={aberto.libera} icon={LockOpen} cor="text-roxo" />}
            {aberto.beneficios && <Lista titulo="Benefícios" itens={aberto.beneficios} icon={Gift} cor="text-dourado" />}
          </div>
        </Modal>
      )}

      <Secao titulo="Liberação automática por nível" descricao="O que o portal faz sozinho quando o representante muda de nível.">
        <Grade>
          <Cartao titulo="Nível automático">O portal calcula o nível do representante pela quantidade de clientes ativos.</Cartao>
          <Cartao titulo="Liberação de abas">
            Ao subir de nível, as abas daquele nível são liberadas automaticamente. O acesso é cumulativo: cada nível mantém as abas dos
            anteriores.
          </Cartao>
          <Cartao titulo="Bloqueio">Se a carteira cair abaixo do mínimo, o representante perde o nível e as abas correspondentes.</Cartao>
          <Cartao titulo="Saída do programa">Sem ativação no mês de ABC, o acesso ao portal é encerrado.</Cartao>
          <Cartao titulo="Aviso de subida">
            Ao mudar de nível, o representante recebe um aviso com o que foi desbloqueado e quanto falta para o próximo nível.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Definições" descricao="As regras que valem para toda a jornada.">
        <Grade>
          <Cartao titulo="Sem ativação no ABC">
            Se o representante não ativar o primeiro cliente dentro do mês de ABC, ele sai do programa.
          </Cartao>
          <Cartao titulo="Contagem de clientes ativos">Cada cliente ativo conta como 1 para os níveis da jornada.</Cartao>
          <Cartao titulo="Queda de carteira">
            Se a carteira cair abaixo do mínimo do nível, o representante perde o nível — e, abaixo de 25 clientes ativos, perde o acesso ao
            Valhalla.
          </Cartao>
          <Cartao titulo="Responsável pelo Conselho e pela Voz ativa">
            Beatriz Andrade conduz o Conselho de Representantes e responde às sugestões da Voz ativa.
          </Cartao>
          <Cartao titulo="Cargos são títulos do programa">
            Executivo, Diretor de Expansão, VP e demais cargos são títulos dentro do programa e não cargos da Cardápio Web. Ponto levantado
            pelo Rafa por motivos jurídicos e que deve ficar claro na comunicação.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Decisões e justificativas" descricao="O que foi decidido sobre liberações e o motivo de cada escolha.">
        <Grade colunas={2}>
          <Cartao titulo="Mapa de prospecção só no Consultor (3 clientes)">
            Liberar logo no início reduz o valor percebido, e o esforço até a 1ª venda já é alto. O contraponto discutido foi que, sem o mapa, a
            2ª venda fica mais difícil. A decisão foi liberar no Consultor e cobrar o uso ativamente durante o ABC.
          </Cartao>
          <Cartao titulo="Minha equipe só a partir do Diretor de Expansão (100 clientes)">
            Antes disso, a renda do representante não sustenta a contratação de pessoas.
          </Cartao>
          <Cartao titulo="Calculadora de comissão atualizada">Passa a calcular por venda individual e por vendas do mês.</Cartao>
          <Cartao titulo="Sugestões e ideias de produto liberadas para todos os níveis">Uma boa sugestão pode vir de qualquer representante.</Cartao>
          <Cartao titulo="Eventos por nível">
            Nem todos vão ao mesmo evento. A prioridade considera região e volume de clientes.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Pontos em aberto" descricao="Temas que ainda precisam de definição.">
        <Grade colunas={2}>
          <Cartao titulo="Modelo de licença do Diretor Regional">Como funciona a compra de licença e revenda pelo preço da Cardápio Web.</Cartao>
          <Cartao titulo="Modelo de franquia do VP de Expansão">A definir com a liderança.</Cartao>
        </Grade>
      </Secao>
    </>
  );
}
