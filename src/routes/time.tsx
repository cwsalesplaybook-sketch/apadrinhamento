import { CalendarClock, Handshake, Network, Route, Users } from "lucide-react";
import { AppLayout, Destaque, ListaEstrela, Secao } from "@/components/AppLayout";

const QUEM = [
  { papel: "Você, representante estrela", texto: "Dono da operação. Define metas, contrata, acompanha o time e responde pelos clientes da sua carteira." },
  { papel: "Seu time", texto: "Prospecção, vendas e implantação. Cada pessoa cuida de uma parte da jornada do cliente." },
  { papel: "Padrinho", texto: "Representante experiente da rede que apoia você em dúvidas de venda." },
  { papel: "PSM", texto: "Time da Cardápio Web que cuida das dúvidas de sistema e da implantação." },
  { papel: "Gestor do programa", texto: "Responde por contrato, comissão e regras do programa de representantes." },
];

const JORNADA = [
  { etapa: "Prospecção", quem: "SDR" },
  { etapa: "Apresentação", quem: "Closer" },
  { etapa: "Fechamento", quem: "Closer" },
  { etapa: "Implantação", quem: "Implantação" },
  { etapa: "Acompanhamento", quem: "Implantação + você" },
];

export function TimePage() {
  return (
    <AppLayout title="Sobre o time" subtitle="Quem faz o quê na sua operação" icon={Users}>
      <Destaque titulo="Um time, uma jornada">
        Cada pessoa do seu time cuida de uma parte do caminho do restaurante, do primeiro contato até ele usar o
        Cardápio Web no dia a dia. Quando todo mundo sabe o seu papel, ninguém fica sem resposta.
      </Destaque>

      <Secao icon={Network} titulo="Quem é quem">
        <div className="grid gap-3 sm:grid-cols-2">
          {QUEM.map((q) => (
            <div key={q.papel} className="rounded-2xl border border-border bg-accent/60 p-4">
              <div className="font-black text-ink">{q.papel}</div>
              <p className="mt-1 text-sm text-muted-foreground">{q.texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao icon={Route} titulo="A jornada do cliente" descricao="Em que momento cada pessoa do time entra.">
        <ol className="grid gap-3 sm:grid-cols-5">
          {JORNADA.map((j, i) => (
            <li key={j.etapa} className="rounded-2xl bg-accent/60 p-4 text-center">
              <div className="num text-2xl text-primary">{i + 1}</div>
              <div className="mt-1 font-black text-ink">{j.etapa}</div>
              <div className="text-sm text-muted-foreground">{j.quem}</div>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao icon={Handshake} titulo="Regra de fronteira" descricao="Para quem levar cada tipo de dúvida.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Dúvida de venda", "Padrinho"],
            ["Dúvida de sistema", "PSM"],
            ["Contrato e comissão", "Gestor do programa"],
          ].map(([duvida, quem]) => (
            <div key={duvida} className="rounded-2xl border border-border p-4">
              <div className="text-sm text-muted-foreground">{duvida}</div>
              <div className="titulo-h1 mt-1 text-lg text-ink">{quem}</div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao icon={CalendarClock} titulo="Rotina do time">
        <ListaEstrela
          itens={[
            "Alinhamento rápido diário (15 min): quem vai visitar, ligar ou implantar hoje.",
            "Revisão semanal de números: contatos feitos, reuniões, vendas e clientes implantados.",
            "Mentoria semanal dos representantes, toda segunda às 20h: leve o seu time junto.",
            "Conversa individual a cada 15 dias com cada pessoa do time.",
          ]}
        />
      </Secao>
    </AppLayout>
  );
}
