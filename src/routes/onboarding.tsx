import { useState } from "react";
import { Check, Flag, Rocket, RotateCcw } from "lucide-react";
import { AppLayout, Destaque, Secao } from "@/components/AppLayout";

const FASES = [
  {
    titulo: "Antes do primeiro dia",
    itens: [
      "Combinados assinados: remuneração, metas, horário e forma de trabalho",
      "Acessos criados: WhatsApp de trabalho, e-mail e ferramentas do representante",
      "Apresentar a pessoa para o time e para o seu padrinho",
    ],
  },
  {
    titulo: "Semana 1: conhecer",
    itens: [
      "Apresentar a Cardápio Web: planos, módulos e diferenciais",
      "Mostrar a matriz de concorrentes e as objeções mais comuns",
      "Acompanhar você em pelo menos 3 apresentações ou visitas",
      "Assistir à mentoria de segunda às 20h",
    ],
  },
  {
    titulo: "Semana 2: praticar",
    itens: [
      "Simular ligação e apresentação com você (roleplay)",
      "Fazer os primeiros contatos com você acompanhando",
      "Usar o CRM para registrar todos os leads e próximos passos",
    ],
  },
  {
    titulo: "Até o dia 30: andar sozinho",
    itens: [
      "Conduzir contatos e apresentações sem acompanhamento",
      "Primeira venda originada (ou primeira implantação concluída)",
      "Conversa de feedback dos 30 dias: o que foi bem e o que ajustar",
    ],
  },
];

const CHAVE = "cwstars:onboarding";

function lerMarcados(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
  } catch {
    return [];
  }
}

export function OnboardingPage() {
  const [marcados, setMarcados] = useState<string[]>(lerMarcados);
  const total = FASES.reduce((n, f) => n + f.itens.length, 0);

  function salvar(lista: string[]) {
    setMarcados(lista);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista));
    } catch {
      // sem armazenamento local: o checklist funciona só nesta visita
    }
  }

  function alternar(item: string) {
    salvar(marcados.includes(item) ? marcados.filter((m) => m !== item) : [...marcados, item]);
  }

  return (
    <AppLayout title="Onboarding" subtitle="Os primeiros 30 dias de quem entra no seu time" icon={Rocket}>
      <Destaque titulo="Do primeiro dia à primeira venda">
        Um bom começo faz a pessoa vender mais rápido e ficar mais tempo com você. Use o checklist abaixo a cada nova
        contratação.
      </Destaque>

      <div className="cartao flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="font-black text-ink">Progresso</span>
            <span className="num text-ink">
              {marcados.length}/{total}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(marcados.length / total) * 100}%` }} />
          </div>
        </div>
        <button
          onClick={() => salvar([])}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-primary hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" /> Nova contratação
        </button>
      </div>

      {FASES.map((fase) => (
        <Secao key={fase.titulo} icon={Flag} titulo={fase.titulo}>
          <ul className="space-y-2">
            {fase.itens.map((item) => {
              const feito = marcados.includes(item);
              return (
                <li key={item}>
                  <button
                    onClick={() => alternar(item)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                        feito ? "border-primary bg-primary text-white" : "border-input"
                      }`}
                    >
                      {feito && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                    <span className={feito ? "text-muted-foreground line-through" : "text-ink"}>{item}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Secao>
      ))}
    </AppLayout>
  );
}
