import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/* ---------- dados ---------- */

export type Linha = { id: string } & Record<string, string>;
export type TabelaId = "abc" | "ativados" | "cursos" | "frente" | "cadencia" | "regras" | "templates" | "marcos" | "acoes";
export type Dados = { tabelas: Record<TabelaId, Linha[]>; atualizadoEm: string | null };

async function chamar(corpo?: object): Promise<Dados> {
  const r = await fetch("/api/jornada", corpo ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) } : undefined);
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.erro || "Não foi possível falar com o servidor");
  return json;
}

export function useDados() {
  return useQuery({ queryKey: ["jornada"], queryFn: () => chamar(), retry: 1 });
}

export function useAlterar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chamar,
    onSuccess: (dados) => qc.setQueryData(["jornada"], dados),
    onError: (e) => toast.error(e.message),
  });
}

export const novoId = () => crypto.randomUUID();

/* ---------- datas (guardadas como DD/MM/AAAA, igual à planilha) ---------- */

export function hojeBR() {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function paraDia(br: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : null;
}

export const brParaIso = (br: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br?.trim() ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
export const isoParaBr = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

/** "hoje", "1 dia", "13 dias" desde a data. */
export function tempoDesde(br: string) {
  const inicio = paraDia(br);
  const hoje = paraDia(hojeBR());
  if (inicio == null || hoje == null) return "";
  const dias = Math.round((hoje - inicio) / 86400000);
  if (dias <= 0) return "hoje";
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

export function diasDesde(br: string) {
  const inicio = paraDia(br);
  const hoje = paraDia(hojeBR());
  return inicio == null || hoje == null ? 0 : Math.round((hoje - inicio) / 86400000);
}

/* ---------- colunas de cada tabela ---------- */

export type Tipo = "texto" | "longo" | "data" | "numero" | "opcao" | "simnao";
export type Coluna = {
  chave: string;
  rotulo: string;
  tipo: Tipo;
  opcoes?: string[];
  /** Aparece na lista (as demais só no formulário). */
  lista?: boolean;
  /** Mostra botão Copiar na lista e no formulário. */
  copiar?: boolean;
};

export const ETAPAS_ABC = ["Sem retorno", "Prospecção", "Reunião de Apresentação", "Remanescente", "🥉 Pro", "🥈 Elite"];
export const STATUS = ["Pendente", "Em andamento", "Concluído"];
const CURSOS = ["implementacao", "suporte", "vendas"] as const;
const NOME_CURSO = { implementacao: "Implementação", suporte: "Suporte", vendas: "Vendas" };

export const COLUNAS: Record<TabelaId, Coluna[]> = {
  abc: [
    { chave: "representante", rotulo: "Representante", tipo: "texto", lista: true },
    { chave: "telefone", rotulo: "Telefone", tipo: "texto" },
    { chave: "cidade", rotulo: "Cidade / UF", tipo: "texto", lista: true },
    { chave: "etapa", rotulo: "Etapa no ABC", tipo: "opcao", opcoes: ETAPAS_ABC, lista: true },
    { chave: "desde", rotulo: "Na etapa desde", tipo: "data" },
    { chave: "clientes", rotulo: "Clientes", tipo: "numero", lista: true },
    { chave: "feedback", rotulo: "Feedback (motivo da não ativação)", tipo: "longo", lista: true },
  ],
  ativados: [
    { chave: "representante", rotulo: "Representante", tipo: "texto", lista: true },
    { chave: "telefone", rotulo: "Telefone", tipo: "texto", lista: true },
    { chave: "motivo", rotulo: "Motivo da não ativação", tipo: "longo", lista: true },
    { chave: "previsao", rotulo: "Previsão de primeiro ativado", tipo: "longo", lista: true },
  ],
  cursos: [
    { chave: "representante", rotulo: "Representante", tipo: "texto", lista: true },
    { chave: "psm", rotulo: "PSM", tipo: "texto", lista: true },
    { chave: "implementacao", rotulo: "Implementação", tipo: "simnao", lista: true },
    { chave: "suporte", rotulo: "Suporte", tipo: "simnao", lista: true },
    { chave: "vendas", rotulo: "Vendas", tipo: "simnao", lista: true },
    { chave: "follow", rotulo: "Follow", tipo: "longo", lista: true },
    { chave: "data", rotulo: "Data", tipo: "data", lista: true },
  ],
  frente: [
    { chave: "data", rotulo: "Data", tipo: "data", lista: true },
    { chave: "horario", rotulo: "Horário", tipo: "texto", lista: true },
    { chave: "representante", rotulo: "Representante", tipo: "texto", lista: true },
    { chave: "telefone", rotulo: "Telefone", tipo: "texto" },
    { chave: "email", rotulo: "E-mail", tipo: "texto" },
    { chave: "cursosFaltando", rotulo: "Cursos faltando", tipo: "texto", lista: true },
    { chave: "anotacoes", rotulo: "Anotações", tipo: "longo", lista: true },
  ],
  cadencia: [
    { chave: "toque", rotulo: "Toque", tipo: "texto", lista: true },
    { chave: "envio", rotulo: "Envio (WhatsApp, 10h)", tipo: "texto", lista: true },
    { chave: "objetivo", rotulo: "Objetivo", tipo: "texto", lista: true },
    { chave: "mensagem", rotulo: "Mensagem", tipo: "longo", lista: true, copiar: true },
  ],
  regras: [
    { chave: "numero", rotulo: "Nº", tipo: "texto", lista: true },
    { chave: "regra", rotulo: "Regra", tipo: "texto", lista: true },
    { chave: "detalhe", rotulo: "Detalhe", tipo: "longo", lista: true },
  ],
  templates: [
    { chave: "situacao", rotulo: "Situação", tipo: "texto", lista: true },
    { chave: "mensagem", rotulo: "Mensagem", tipo: "longo", lista: true, copiar: true },
  ],
  marcos: [
    { chave: "titulo", rotulo: "Marco", tipo: "texto" },
    { chave: "data", rotulo: "Data", tipo: "data" },
    { chave: "horario", rotulo: "Horário", tipo: "texto" },
    { chave: "descricao", rotulo: "Descrição", tipo: "longo" },
    { chave: "responsavel", rotulo: "Responsável", tipo: "texto" },
    { chave: "status", rotulo: "Status", tipo: "opcao", opcoes: STATUS },
  ],
  acoes: [
    { chave: "titulo", rotulo: "Ação", tipo: "texto" },
    { chave: "descricao", rotulo: "Descrição", tipo: "longo" },
    { chave: "responsavel", rotulo: "Responsável", tipo: "texto" },
    { chave: "prazo", rotulo: "Prazo", tipo: "data" },
    { chave: "status", rotulo: "Status", tipo: "opcao", opcoes: STATUS },
  ],
};

/** Cursos que faltam, a partir dos três Sim/Não. */
export function cursosFaltando(l: Linha) {
  return CURSOS.filter((c) => l[c] !== "Sim").map((c) => NOME_CURSO[c]);
}

export function situacaoCursos(l: Linha) {
  const faltam = cursosFaltando(l).length;
  if (faltam === 0) return "Cursos concluídos";
  return faltam === CURSOS.length ? "Nenhum curso feito" : "Falta algum curso";
}

/** Etapas de quem já ativou ("🥉 Pro", "🥈 Elite"); "Prospecção" não conta. */
export const ativou = (etapa = "") => /\b(pro|elite)\b/i.test(etapa);

export function corEtapa(etapa: string) {
  if (ativou(etapa)) return "pilula-verde";
  if (/sem retorno/i.test(etapa)) return "pilula-vermelha";
  if (/remanescente/i.test(etapa)) return "pilula-ouro";
  return "pilula-roxa";
}

export function corStatus(status: string) {
  if (status === "Concluído") return "pilula-verde";
  if (status === "Em andamento") return "pilula-roxa";
  return "pilula-ouro";
}
