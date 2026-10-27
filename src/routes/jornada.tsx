import { Bot, CalendarClock, CircleCheck, CircleDashed, Clock, Footprints, Target, UserCheck, UserX } from "lucide-react";
import { CabecalhoPagina, Cartao, Fluxo, Grade, Secao } from "@/components/Layout";

export function JornadaPage() {
  return (
    <>
      <CabecalhoPagina sobre="Do cadastro ao primeiro nível" titulo="Jornada e ABC">
        Ao entrar no Programa de Aceleração, o representante tem um mês para passar pelo ABC, ativar o primeiro cliente e assinar o contrato.
      </CabecalhoPagina>

      <Secao titulo="Fluxo da jornada" descricao="As seis etapas entre a entrada no programa e o próximo nível da trilha.">
        <Fluxo />
      </Secao>

      <Secao titulo="Como funciona o ABC" descricao="Um mês para aprender vendendo, com acompanhamento próximo.">
        <Grade>
          <Cartao icon={Footprints} titulo="Ao entrar no Programa de Aceleração">
            O representante inicia a jornada e tem o primeiro mês para passar pelo ABC com a Gabi.
          </Cartao>
          <Cartao icon={Clock} titulo="Duração">
            O representante permanece no ABC por apenas 1 mês.
          </Cartao>
          <Cartao icon={Target} titulo="Foco do período">
            Vender e chegar à primeira ativação, com acompanhamento próximo.
          </Cartao>
          <Cartao icon={CircleDashed} titulo="Capacitação enxuta e aplicada">
            Só o necessário para o representante prospectar, apresentar e fechar. Sem carga pesada de certificação — o tempo dele deve ir para
            vendas.
          </Cartao>
          <Cartao icon={CalendarClock} titulo="Ao final do ABC">
            O próximo passo do representante precisa estar muito claro.
          </Cartao>
          <Cartao icon={CircleCheck} titulo="Após a primeira ativação">
            Ele avança para a próxima etapa da jornada e o REP realiza a assinatura do contrato.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Critérios de entrada" descricao="Quem entra no Programa de Aceleração.">
        <Grade colunas={2}>
          <Cartao icon={UserCheck} titulo="Perfil preferencial">
            Vendedores comerciais, como revendedores de software e software houses, empresas de TI, automação comercial, maquininhas e meios
            de pagamento, representantes comerciais de outros segmentos, donos ou gerentes de restaurante e quem ainda não vende para
            restaurantes.
          </Cartao>
          <Cartao icon={UserCheck} titulo="Cliente Cardápio Web">
            Permanece no ABC, com possibilidade de duas vertentes: Programa 01 — Programa de Aceleração (sem agendamento com a Gabi) e Programa
            02 — ABC (com agendamento com a Gabi).
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Critérios de não entrada" descricao="Quem segue por outro caminho, sem passar pelo ABC.">
        <Grade>
          <Cartao icon={UserX} titulo="Consultor de food service">
            Ativa de forma autônoma, com apoio de um assistente/IA para dúvidas.
          </Cartao>
          <Cartao icon={UserX} titulo="Agência de marketing">
            Não entra no ABC.
          </Cartao>
          <Cartao icon={UserX} titulo="Sem disponibilidade para venda presencial ou híbrida">
            Das ativações recentes, todas foram presenciais. Por enquanto vale só para o ABC; depois do teste, pode passar para a Aquisição.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Prazos dentro do ABC" descricao="O ritmo esperado dentro do mês de aceleração.">
        <Grade>
          <Cartao titulo="Passo a passo próprio">Cada rep entra com um passo a passo próprio: data de entrada, responsável (Gabi) e prazos.</Cartao>
          <Cartao titulo="Ritmo de referência">
            Primeira prospecção nos primeiros dias, primeira reunião cerca de 7 dias depois e a segunda na mesma semana.
          </Cartao>
          <Cartao titulo="Quatro reuniões">
            Manter 4 reuniões (e não 3), para que o rep consiga ativar mesmo que um dos leads não feche. O gatilho de 1 mês para a primeira
            venda segue valendo.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Formatura do ABC" descricao="O que é obrigatório e o que é opcional para se formar.">
        <Grade colunas={2}>
          <Cartao titulo="Formatura: obrigatório">3 clientes ativos. Ao se formar, o rep recebe o kit de boas-vindas.</Cartao>
          <Cartao titulo="Formatura: opcional">Cursos.</Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Agente de Onboarding" descricao="Como o agente dá escala ao acompanhamento durante o ABC.">
        <Grade>
          <Cartao icon={Bot} titulo="Objetivo">
            Auxiliar a Gabrielly no acompanhamento dos representantes durante o ABC, dando escala ao onboarding.
          </Cartao>
          <Cartao icon={Bot} titulo="Dúvidas frequentes">
            Responder dúvidas sobre produto, portal, processo comercial e comissão.
          </Cartao>
          <Cartao icon={Bot} titulo="Próximos passos">
            Orientar o representante sobre o que fazer em cada etapa até a 1ª ativação.
          </Cartao>
          <Cartao icon={Bot} titulo="Alertas">
            Sinalizar para a Gabrielly os representantes parados ou em risco de não ativar dentro do mês de ABC.
          </Cartao>
          <Cartao icon={Bot} titulo="Papel da Gabrielly">
            Segue à frente da mentoria, das objeções e dos pontos de decisão; o agente cuida do operacional.
          </Cartao>
        </Grade>
      </Secao>

      <Secao titulo="Pendências do ABC" selo="EM VALIDAÇÃO" descricao="O que ainda depende de Tecnologia para o modelo funcionar.">
        <Grade>
          <Cartao interno titulo="Automação">Disparador de follow-up com datas padronizadas.</Cartao>
          <Cartao interno titulo="Agente de onboarding">
            Agente que conversa com os reps em nome da Gabi, com script configurável. Hoje são cerca de 55 reps no ABC e poucos respondem.
          </Cartao>
          <Cartao interno titulo="Envio automático do contrato">Envio automático do contrato na 1ª ativação.</Cartao>
          <Cartao interno titulo="Mapa e zona">Liberados somente após o 1º cliente.</Cartao>
          <Cartao interno titulo="Dashboard do ABC">Campo de prazo do 1º cliente e status (ativou / não ativou).</Cartao>
          <Cartao interno titulo="Reps em risco">
            Reps em risco (60 dias sem vender) vão para a carteira de reativação, para a carteira do ABC não acumular.
          </Cartao>
          <Cartao interno titulo="Aplicação dos novos critérios">
            Definir se os novos critérios valem também para os reps que já estão no programa ou só para os novos.
          </Cartao>
        </Grade>
      </Secao>
    </>
  );
}
