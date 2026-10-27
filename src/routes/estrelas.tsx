import { Bot, Calculator, Crown, Megaphone, MessagesSquare, PlaySquare, UserRoundCheck } from "lucide-react";
import { CabecalhoPagina, Cartao, Grade, Secao } from "@/components/Layout";

export function EstrelasPage() {
  return (
    <>
      <CabecalhoPagina sobre="A partir de 25 clientes ativos" titulo="Estrelas e Valhalla">
        Ao alcançar 25 clientes ativos, o representante desbloqueia o Valhalla e passa a ter uma relação mais próxima e estratégica com a
        Cardápio Web.
      </CabecalhoPagina>

      <div className="alerta-ouro p-6">
        <p className="sobretitulo !text-dourado">A pergunta que o Valhalla responde</p>
        <p className="titulo mt-2 text-2xl">“Tenho 25 clientes. Como a CW me ajuda a chegar aos 50 e depois aos 100?”</p>
      </div>

      <Secao titulo="O que o representante recebe" descricao="Benefícios e áreas liberadas a partir do nível Executivo III.">
        <Grade>
          <Cartao icon={Crown} titulo="O que é o Conselho?">
            Ao alcançar 25 clientes ativos, o representante desbloqueia o acesso ao conselho e passa a ter uma relação mais próxima e
            estratégica com a Cardápio Web.
          </Cartao>
          <Cartao icon={MessagesSquare} titulo="Conselho de Representantes">
            Encontro mensal com os membros do Valhalla para ouvir quem está na ponta — sugestões, necessidades dos clientes, melhorias de
            processos e ideias para Produto, Comercial, Marketing e outras áreas.
          </Cartao>
          <Cartao icon={Megaphone} titulo="Voz ativa">
            Espaço no portal para registrar sugestões e acompanhar o status de cada uma — recebida, em análise, priorizada, em desenvolvimento
            ou implementada.
          </Cartao>
          <Cartao icon={PlaySquare} titulo="Conteúdos exclusivos">
            Conteúdos e direcionamentos do Glauton, lideranças e outros times da CW, aproximando os representantes da estratégia da empresa.
          </Cartao>
          <Cartao icon={Bot} titulo="IA do Assistente">
            IA voltada para a operação do representante, que analisa carteira, metas, forecast e evolução e ajuda a construir planos de ação.
          </Cartao>
          <Cartao icon={Calculator} titulo="Calculadora de Forecast">
            Simulação de onde o representante estará em 3, 6 ou 12 meses, quantos clientes precisa vender para atingir um objetivo e a projeção
            da comissão.
          </Cartao>
          <Cartao icon={UserRoundCheck} titulo="Acompanhamento da Agente de Sucesso">
            Área com comentários, orientações, histórico de acompanhamento e planos de ação definidos junto à agente.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Em avaliação" selo="EM VALIDAÇÃO" descricao="Ideias e ajustes em teste para esta faixa da trilha.">
        <Grade colunas={2}>
          <Cartao interno titulo="Acompanhamento atual dos Estrelas">
            Follow-up a cada 5 dias, cada um com um objetivo específico; no mês, meta definida no início e conversa de ajuste no fim.
          </Cartao>
          <Cartao interno titulo="Abordagem padronizada">
            Padronizar a abordagem das mensagens (variações A, B e C), sem copia-e-cola. O assistente de IA é o único agente que fala com o
            rep Estrela.
          </Cartao>
          <Cartao interno titulo="Apadrinhamento (a validar)">
            O Estrela ganha um percentual (ex.: 10%) sobre as primeiras vendas dos reps do ABC que ele apadrinhar. Validar depois de mais 1 mês
            de dados do ABC.
          </Cartao>
          <Cartao interno titulo="Experiência exclusiva (ideia)">
            Uma experiência exclusiva, por exemplo um CRM ou app próprio, que gere desejo nos níveis abaixo.
          </Cartao>
        </Grade>
      </Secao>
    </>
  );
}
