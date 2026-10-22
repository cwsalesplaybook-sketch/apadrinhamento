import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Briefcase, ListOrdered, MessageCircleQuestion, Signal, UserPlus } from "lucide-react";
import { AppLayout, Destaque, ListaEstrela, Secao } from "@/components/AppLayout";

const PERFIS = [
  {
    nome: "Prospecção (SDR)",
    faz: "Encontra restaurantes, faz o primeiro contato e agenda a reunião de apresentação.",
    busca: "Comunicativo, organizado, não tem medo de ligar e de ouvir “não”.",
  },
  {
    nome: "Vendas (closer)",
    faz: "Conduz a apresentação do Cardápio Web, monta a proposta e fecha a venda.",
    busca: "Já vendeu algo antes, sabe ouvir o dono do restaurante e negociar.",
  },
  {
    nome: "Implantação e suporte",
    faz: "Configura o sistema com o cliente, treina a equipe dele e acompanha os primeiros dias.",
    busca: "Paciente, didático, gosta de tecnologia e de resolver problemas.",
  },
];

const ETAPAS = [
  { titulo: "Defina a função e a meta", texto: "Escolha um dos perfis abaixo e escreva o que a pessoa precisa entregar no primeiro mês." },
  { titulo: "Divulgue a vaga", texto: "Use os textos prontos da aba Forms da vaga e publique no WhatsApp, Instagram e LinkedIn.", link: "/vaga" as const },
  { titulo: "Faça a triagem", texto: "Leia as respostas do formulário e separe quem tem o perfil. Responda todo mundo, inclusive quem não passou." },
  { titulo: "Entrevista", texto: "Conversa de 30 minutos com o roteiro de perguntas abaixo. Anote as respostas para comparar candidatos." },
  { titulo: "Teste prático", texto: "Simule uma ligação de prospecção ou uma apresentação: você faz o papel do dono do restaurante." },
  { titulo: "Proposta e combinados", texto: "Formalize remuneração, metas, horário e forma de trabalho por escrito antes do primeiro dia." },
  { titulo: "Onboarding", texto: "Siga o checklist da aba Onboarding para a pessoa vender com segurança nas primeiras semanas.", link: "/onboarding" as const },
];

const PERGUNTAS = [
  "Me conta uma venda (de qualquer coisa) que você fez e da qual se orgulha.",
  "Como você lidaria com um dono de restaurante que diz “já tenho sistema, não preciso”?",
  "Você conhece algum restaurante ou delivery da sua região? Como chegaria até o dono?",
  "Como você organiza o seu dia quando tem muitos contatos para fazer?",
  "O que você espera ganhar e aprender trabalhando com a gente nos próximos 6 meses?",
];

export function ContratacaoPage() {
  return (
    <AppLayout title="Contratação de pessoas" subtitle="Como montar o seu time de vendas" icon={UserPlus}>
      <Destaque titulo="Representante estrela não vende sozinho">
        Quando a sua agenda enche, é hora de multiplicar. Aqui está o caminho para contratar as pessoas certas e
        colocar cada uma no lugar onde ela rende mais.
      </Destaque>

      <Secao icon={Signal} titulo="Quando é hora de contratar" descricao="Sinais de que você já precisa de reforço.">
        <ListaEstrela
          itens={[
            "Você tem mais leads do que consegue atender e alguns ficam sem retorno.",
            "A implantação dos clientes novos está tirando o seu tempo de vender.",
            "Você quer abrir uma cidade ou região nova e não consegue estar lá.",
            "Sua comissão já paga com folga o custo de uma pessoa a mais.",
          ]}
        />
      </Secao>

      <Secao icon={Briefcase} titulo="Perfis que você pode contratar" descricao="Comece pelo gargalo que mais trava suas vendas hoje.">
        <div className="grid gap-4 md:grid-cols-3">
          {PERFIS.map((p) => (
            <div key={p.nome} className="rounded-2xl border border-border bg-accent/60 p-5">
              <h3 className="titulo-h1 text-lg text-ink">{p.nome}</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-bold text-ink">O que faz: </span>
                {p.faz}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-bold text-ink">Quem buscar: </span>
                {p.busca}
              </p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao icon={ListOrdered} titulo="Passo a passo da contratação">
        <ol className="space-y-4">
          {ETAPAS.map((e, i) => (
            <li key={e.titulo} className="flex gap-4">
              <span className="tile-3d flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white">
                {i + 1}
              </span>
              <div>
                <div className="font-black text-ink">{e.titulo}</div>
                <p className="text-muted-foreground">{e.texto}</p>
                {e.link && (
                  <Link to={e.link} className="mt-1 inline-flex items-center gap-1 text-sm font-black text-primary hover:underline">
                    Abrir <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao icon={MessageCircleQuestion} titulo="Roteiro de entrevista" descricao="Perguntas que mostram atitude de vendas, não só currículo.">
        <ListaEstrela itens={PERGUNTAS} />
      </Secao>

      <section className="cartao flex gap-4 border-l-4 border-l-[#ffb600] p-6">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[#f29a00]" />
        <div>
          <div className="font-black text-ink">Importante</div>
          <p className="mt-1 text-muted-foreground">
            As pessoas que você contrata trabalham para você, não para a Cardápio Web. O vínculo, a remuneração e os
            combinados são de sua responsabilidade. Na dúvida sobre o formato de contratação, fale com um contador.
          </p>
        </div>
      </section>
    </AppLayout>
  );
}
