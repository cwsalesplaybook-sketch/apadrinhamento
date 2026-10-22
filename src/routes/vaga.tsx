import { useState } from "react";
import { toast } from "sonner";
import { Check, ClipboardList, Copy, FileText, ChartNoAxesCombined, MessageSquareText } from "lucide-react";
import { AppLayout, Destaque, Secao } from "@/components/AppLayout";

const VAGAS = [
  {
    nome: "Prospecção (SDR)",
    texto: `🚀 VAGA: Prospecção comercial — Cardápio Web

Estou montando meu time como representante da Cardápio Web, o sistema de gestão usado por mais de 17 mil restaurantes no Brasil.

O que você vai fazer:
• Encontrar restaurantes, bares e deliveries da região
• Fazer o primeiro contato por telefone, WhatsApp e visita
• Agendar apresentações para o time de vendas

O que eu procuro:
• Boa comunicação e vontade de aprender vendas
• Organização para acompanhar muitos contatos
• Não ter medo de ouvir "não"

Interessou? Preencha o formulário: [LINK DO FORMULÁRIO]`,
  },
  {
    nome: "Vendas (closer)",
    texto: `💼 VAGA: Vendedor(a) — Cardápio Web

Sou representante da Cardápio Web, sistema de gestão usado por mais de 17 mil restaurantes, e estou contratando para o meu time.

O que você vai fazer:
• Apresentar o Cardápio Web para donos de restaurante
• Montar propostas e negociar
• Fechar vendas e passar o cliente para a implantação

O que eu procuro:
• Experiência com vendas (qualquer segmento)
• Saber ouvir e entender a necessidade do cliente
• Foco em meta

Interessou? Preencha o formulário: [LINK DO FORMULÁRIO]`,
  },
  {
    nome: "Implantação e suporte",
    texto: `🛠️ VAGA: Implantação e suporte — Cardápio Web

Sou representante da Cardápio Web e procuro alguém para cuidar dos nossos clientes depois da venda.

O que você vai fazer:
• Configurar o sistema junto com o restaurante
• Treinar a equipe do cliente
• Acompanhar os primeiros dias de uso e tirar dúvidas

O que eu procuro:
• Paciência e jeito para ensinar
• Facilidade com tecnologia
• Gostar de resolver problemas

Interessou? Preencha o formulário: [LINK DO FORMULÁRIO]`,
  },
];

const CURTO = `⭐ Estou contratando! Procuro pessoas para o meu time de vendas da Cardápio Web (prospecção, vendas e implantação). Se você gosta de conversar com gente e quer crescer com vendas, preencha: [LINK DO FORMULÁRIO]`;

const PERGUNTAS_FORM = [
  "Nome completo",
  "WhatsApp",
  "E-mail",
  "Cidade e bairro",
  "Para qual vaga você está se candidatando? (Prospecção / Vendas / Implantação)",
  "Você já trabalhou com vendas ou atendimento? Conte rapidamente.",
  "Conhece restaurantes ou deliveries na sua região? Quais?",
  "Qual sua disponibilidade de horário?",
  "Tem como se deslocar para visitas? (carro, moto, transporte público)",
  "Por que você quer essa vaga?",
  "Link do seu LinkedIn ou currículo (opcional)",
];

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }
  return (
    <button
      onClick={copiar}
      className="botao-3d inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-white transition hover:brightness-110"
    >
      {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

export function VagaPage() {
  const [vaga, setVaga] = useState(0);
  return (
    <AppLayout title="Forms da vaga" subtitle="Textos prontos para divulgar e formulário de inscrição" icon={ChartNoAxesCombined}>
      <Destaque titulo="Divulgue em 3 passos">
        1. Crie o formulário no Google Forms com as perguntas abaixo. 2. Troque o [LINK DO FORMULÁRIO] pelo link dele.
        3. Publique o texto no WhatsApp, Instagram e LinkedIn.
      </Destaque>

      <Secao icon={FileText} titulo="Texto da vaga" descricao="Escolha o perfil, copie e cole onde for divulgar.">
        <div className="mb-4 flex flex-wrap gap-2">
          {VAGAS.map((v, i) => (
            <button
              key={v.nome}
              onClick={() => setVaga(i)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                i === vaga ? "bg-primary text-white" : "bg-accent text-ink hover:bg-muted"
              }`}
            >
              {v.nome}
            </button>
          ))}
        </div>
        <pre className="whitespace-pre-wrap rounded-2xl border border-border bg-accent/50 p-5 font-sans text-[15px] leading-relaxed text-ink">
          {VAGAS[vaga].texto}
        </pre>
        <div className="mt-4 flex justify-end">
          <BotaoCopiar texto={VAGAS[vaga].texto} />
        </div>
      </Secao>

      <Secao icon={MessageSquareText} titulo="Versão curta" descricao="Para status do WhatsApp, stories e grupos.">
        <p className="rounded-2xl border border-border bg-accent/50 p-5 text-[15px] text-ink">{CURTO}</p>
        <div className="mt-4 flex justify-end">
          <BotaoCopiar texto={CURTO} />
        </div>
      </Secao>

      <Secao icon={ClipboardList} titulo="Perguntas do formulário" descricao="Copie e monte o seu formulário de inscrição no Google Forms.">
        <ol className="list-decimal space-y-2 pl-6 text-ink marker:font-black marker:text-primary">
          {PERGUNTAS_FORM.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <div className="mt-4 flex justify-end">
          <BotaoCopiar texto={PERGUNTAS_FORM.map((p, i) => `${i + 1}. ${p}`).join("\n")} />
        </div>
      </Secao>
    </AppLayout>
  );
}
