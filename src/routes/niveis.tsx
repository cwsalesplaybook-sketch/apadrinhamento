import { Gift, LockOpen } from "lucide-react";
import { CabecalhoPagina, Cartao, Grade, Secao } from "@/components/Layout";

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

export function NiveisPage() {
  let n = 0;
  return (
    <>
      <CabecalhoPagina sobre="Tierização" titulo="Níveis da jornada">
        O nível é definido pela quantidade de clientes ativos na carteira. Cada nível libera novas áreas no portal e concede novos benefícios —
        e o acesso é cumulativo.
      </CabecalhoPagina>

      {GRUPOS.map((g) => (
        <section key={g.nome} className="mt-10">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl sm:text-[28px]">{g.nome}</h2>
            <span className="pilula pilula-roxa">{g.niveis.length} níveis</span>
          </div>
          <p className="mt-1 text-sm text-suave">{g.descricao}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.niveis.map((nivel) => {
              n += 1;
              return (
                <div key={nivel.nome} className="cartao flex flex-col p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="titulo text-3xl font-semibold text-roxo">{n}</span>
                    <span className="pilula pilula-ouro">{nivel.clientes}</span>
                  </div>
                  <p className="sobretitulo mt-3 !text-[0.65rem] !text-fraco">{g.nome}</p>
                  <h3 className="mt-1 text-xl">{nivel.nome}</h3>
                  <p className="mt-1 text-sm text-suave">{nivel.frase}</p>
                  {nivel.libera && <Lista titulo="Libera no portal" itens={nivel.libera} icon={LockOpen} cor="text-roxo-claro" />}
                  {nivel.beneficios && <Lista titulo="Benefícios" itens={nivel.beneficios} icon={Gift} cor="text-dourado" />}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="mt-6 text-sm text-fraco">
        Os nomes dos grupos (Iniciantes, Aspirantes e Estrelas) são provisórios e o fechamento dos níveis dentro de cada grupo ainda está na
        pauta da tierização.
      </p>

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
