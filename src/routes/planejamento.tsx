import { TriangleAlert } from "lucide-react";
import { CabecalhoPagina, Cartao, Grade, Secao } from "@/components/Layout";

const TIERIZACAO = [
  [
    "Estrutura em 3 grandes grupos",
    "Os níveis passam a ser organizados em três grandes grupos, cada um com seus níveis internos: Iniciantes, Aspirantes e Estrelas (nomes provisórios).",
  ],
  [
    "Analogia das fases",
    "Escola Técnica de Aceleração de Vendas (ETAV): o ABC. Faculdade / Pós-graduação: a fase entre 3 e 5 clientes, até o rep virar Executivo. Mestrado: fase acompanhada pela Beatriz. Doutorado: o antigo Elite.",
  ],
  [
    "Pós-graduação (3 a 5 clientes)",
    "Objetivo: ser o divisor de águas entre quem vai virar Estrela e quem se acomoda com 3 clientes, gerando desejo de chegar a Executivo (5 clientes). Hoje, cerca de 15% dos reps ativados estão nessa faixa.",
  ],
  ["Acompanhamento da pós-graduação", "Rodízio de PSM entre Gabi e Beatriz, com follow-up semanal (e não a cada 2 dias)."],
  ["Estratégia conforme o ritmo", "Um plano para o rep acelerado e outro para o rep lento, com planos de contingência baseados no RFV / Health Score."],
  [
    "Benefício da fase de pós-graduação",
    "IA tira-dúvidas (objeções, dúvidas do dia a dia). Ao virar Estrela, essa IA ganha upgrade para assistente de vendas. Esse discurso é apresentado na formatura do ABC.",
  ],
  ["Kit na pós-graduação", "Não enviar um novo kit nessa fase, por causa do custo."],
  ["Agentes de IA", "Proposta de três agentes separados: um para reps em ativação (ABC), um para reps ativados e um para reps Estrelas."],
];

const AQUISICAO = [
  [
    "Slides",
    "Atualizar com as sugestões já enviadas ao Marketing e incluir a trilha de crescimento (vender o sonho), mostrando o que o rep tem antes do 1º cliente e o que ele desbloqueia depois.",
  ],
  ["Contrato", "Apresentado e assinado somente após a 1ª ativação; essa etapa passa a ficar com a Gabi."],
  ["Discurso de certificação", "Os certificados podem ser feitos em até 3 meses, sem pressão imediata."],
  [
    "Script de reunião",
    "Sai o treinamento ao vivo; o PSM passa a ser apresentado como agente de relacionamento, para o rep não precisar entender o termo Partner Success Manager.",
  ],
  ["Gatilho de 1 mês", "O rep tem um mês para fazer a primeira venda; sem venda, sai do programa."],
  ["Taxa de adesão", "Mantida como filtro de engajamento. A remoção pode ser testada como hipótese."],
];

const ABAS = [
  ["ABC (antes do contrato)", "Início, Jornada/ABC, Materiais de venda e Agente de Onboarding."],
  ["Graduado (1 cliente ativo)", "Acrescenta Meus clientes e Comissão."],
  ["Consultor (3 clientes ativos)", "Acrescenta Acompanhamento da Agente de Sucesso."],
  ["Executivo (5 clientes ativos)", "Acrescenta Gestão da operação."],
  ["Executivo II (10 clientes ativos)", "Acrescenta Calculadora de Forecast."],
  ["Executivo III (25 clientes ativos)", "Acrescenta a aba de Reps Estrelas: Conselho de Representantes, Voz ativa, Conteúdos exclusivos e IA."],
  ["Pré-diretor (50 clientes ativos)", "A definir."],
  ["Diretor de Expansão (100 clientes ativos)", "A definir."],
  ["Diretor Regional (500 clientes ativos)", "A definir."],
  ["VP de Expansão (1.000 clientes ativos)", "A definir."],
];

const ATENCAO = [
  [
    "ABC termina na 1ª ativação ou na formatura com 3 clientes?",
    "Na guia de 22/10, Graduado era 1 cliente e Consultor era 3. Agora a formatura do ABC é com 3 clientes, mas o corte de 1 mês continua valendo para a 1ª venda. Precisa ficar claro se o ABC termina na 1ª ativação ou na formatura com 3.",
  ],
  ["Cursos do Executivo", "Obrigatórios ou opcionais? Na reunião surgiram as duas visões."],
  ["Capacidade", "Com cerca de 55 reps no ABC, o agente de onboarding é pré-requisito para o modelo funcionar."],
];

const cartoes = (lista: string[][]) => lista.map(([t, d]) => <Cartao key={t} interno titulo={t}>{d}</Cartao>);

export function PlanejamentoPage() {
  return (
    <>
      <CabecalhoPagina sobre="Uso interno do time" titulo="Planejamento">
        Continuação da tierização, mudanças na aquisição e pontos que seguem em discussão.
      </CabecalhoPagina>

      <div className="alerta-ouro flex gap-3 p-5">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-dourado" />
        <div>
          <p className="font-bold text-dourado">Notas internas em validação</p>
          <p className="mt-1 text-sm text-suave">
            Este trecho reúne notas de planejamento do time. Parte das definições ainda não foi fechada e pode mudar até a aprovação final.
          </p>
        </div>
      </div>

      <Secao titulo="Continuidade da tierização" selo="EM VALIDAÇÃO" descricao="Aquisição, ABC, pós-graduação e Estrelas.">
        <Grade colunas={2}>{cartoes(TIERIZACAO)}</Grade>
      </Secao>
      <Secao titulo="Aquisição: o que muda" selo="EM VALIDAÇÃO" descricao="Mudanças combinadas na entrada do representante no programa.">
        <Grade colunas={2}>{cartoes(AQUISICAO)}</Grade>
      </Secao>
      <Secao titulo="Abas por nível (proposta inicial)" selo="EM VALIDAÇÃO" descricao="Proposta anterior à definição de benefícios e liberações por nível.">
        <Grade>{cartoes(ABAS)}</Grade>
      </Secao>
      <Secao titulo="Pontos de atenção" selo="EM VALIDAÇÃO" descricao="Questões que seguem em discussão e precisam de decisão.">
        <Grade>{cartoes(ATENCAO)}</Grade>
      </Secao>
    </>
  );
}
