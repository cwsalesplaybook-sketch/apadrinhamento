import { BookOpen, CalendarClock, FolderOpen, GraduationCap, Lightbulb, PlayCircle } from "lucide-react";
import { AppLayout, Destaque, ListaCoroa, Secao } from "@/components/AppLayout";

const TRILHA = [
  {
    titulo: "Conheça o Cardápio Web",
    texto: "Planos, módulos opcionais, integrações com iFood e outros apps e o que diferencia a gente da concorrência.",
  },
  {
    titulo: "Prospecção",
    texto: "Como encontrar restaurantes na sua região, fazer o primeiro contato e agendar a apresentação.",
  },
  {
    titulo: "Apresentação e demonstração",
    texto: "Roteiro da reunião com o dono do restaurante e como mostrar o sistema resolvendo o problema dele.",
  },
  {
    titulo: "Objeções e concorrentes",
    texto: "Respostas para “já tenho sistema”, “está caro” e “vou pensar”, com a matriz de concorrentes.",
  },
  {
    titulo: "Fechamento e proposta",
    texto: "Montar a proposta na calculadora, enviar o link de pagamento e combinar a implantação.",
  },
  {
    titulo: "Implantação e pós-venda",
    texto: "Configurar o sistema com o cliente, treinar a equipe dele e acompanhar os primeiros dias.",
  },
];

const MATERIAIS = [
  { nome: "Central de ajuda", texto: "Artigos e tutoriais de cada função do sistema." },
  { nome: "Matriz de concorrentes", texto: "Comparativo com os principais sistemas do mercado." },
  { nome: "Apresentação comercial", texto: "Slides para usar na reunião com o restaurante." },
  { nome: "Calculadora de proposta", texto: "Monte a proposta e gere o link de pagamento." },
  { nome: "Gravações das mentorias", texto: "Assista de novo às mentorias de segunda-feira." },
  { nome: "Kit de divulgação", texto: "Artes e textos para redes sociais e WhatsApp." },
];

export function CapacitacoesPage() {
  return (
    <AppLayout title="Capacitações e materiais" subtitle="Tudo para você e o seu time venderem melhor" icon={GraduationCap}>
      <Destaque titulo="Valhalla de verdade não para de aprender">
        Siga a trilha de capacitação, participe das mentorias e use os materiais prontos com o seu time. Quem entra no
        seu time também começa por aqui.
      </Destaque>

      <Secao icon={CalendarClock} titulo="Mentoria semanal" descricao="O encontro fixo dos representantes.">
        <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-accent/60 p-5">
          <div className="tile-3d flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white">
            <span className="text-[11px] font-black uppercase">Seg</span>
            <span className="num text-xl leading-none">20h</span>
          </div>
          <div className="flex-1">
            <div className="font-black text-ink">Toda segunda-feira, às 20h</div>
            <p className="text-muted-foreground">
              Novidades do produto, dúvidas de venda e troca entre representantes. Leve o seu time junto.
            </p>
          </div>
        </div>
      </Secao>

      <Secao icon={PlayCircle} titulo="Trilha de capacitação" descricao="Faça na ordem; cada módulo prepara para o próximo.">
        <ol className="grid gap-4 md:grid-cols-2">
          {TRILHA.map((m, i) => (
            <li key={m.titulo} className="flex gap-4 rounded-2xl border border-border bg-accent/60 p-5">
              <span className="tile-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white">
                {i + 1}
              </span>
              <div>
                <div className="font-black text-ink">{m.titulo}</div>
                <p className="mt-1 text-sm text-muted-foreground">{m.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao icon={FolderOpen} titulo="Materiais" descricao="Os links serão adicionados aqui.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MATERIAIS.map((m) => (
            <div key={m.nome} className="flex flex-col rounded-2xl border border-border p-5">
              <BookOpen className="h-6 w-6 text-primary" strokeWidth={1.9} />
              <div className="mt-3 font-black text-ink">{m.nome}</div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.texto}</p>
              <span className="mt-4 self-start rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                Link em breve
              </span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao icon={Lightbulb} titulo="Dicas para estudar com o time">
        <ListaCoroa
          itens={[
            "Separe 30 minutos por semana para um módulo da trilha com todo o time.",
            "Depois de cada módulo, faça um roleplay: alguém é o dono do restaurante.",
            "Anote as objeções que aparecem nas visitas e leve para a mentoria de segunda.",
          ]}
        />
      </Secao>
    </AppLayout>
  );
}
