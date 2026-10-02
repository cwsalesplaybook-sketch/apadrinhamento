export type StatusDupla = "em_andamento" | "recuperacao" | "formado" | "encerrado";
export type Situacao = "no_ritmo" | "atencao" | "risco" | "concluida";

export interface Dupla {
  id: string;
  created_at?: string;
  padrinho: string;
  afilhado: string;
  ciclo: number;
  data_inicio: string;
  status: StatusDupla;
  reuniao1: string | null;
  reuniao2: string | null;
  reuniao3: string | null;
  reuniao4: string | null;
  leads_entregues: number;
  leads_novos: number;
  checkins_realizados: number;
  checkins_faltados: number;
  venda_originada: string | null;
  venda_conduzida: string | null;
  horas_padrinho: number;
  horas_psm: number;
  observacoes: string | null;
}

export const STATUS_LABEL: Record<StatusDupla, string> = {
  em_andamento: "Em andamento",
  recuperacao: "Recuperação (D30–D60)",
  formado: "Formado",
  encerrado: "Encerrado",
};

export const SITUACAO_LABEL: Record<Situacao, string> = {
  no_ritmo: "No ritmo",
  atencao: "Atenção",
  risco: "Em risco",
  concluida: "Concluída",
};

export const METAS = {
  execucao: 5,
  ativacao: 4,
  conduzidasD30: 2,
  autonomia: 3,
  horasCiclo: 72,
  tamanhoCiclo: 6,
};

const DIA = 864e5;

export function diasDesde(data: string, ate = new Date()) {
  return Math.floor((ate.getTime() - new Date(data + "T00:00:00").getTime()) / DIA);
}

function ateDia(inicio: string, data: string | null, limite: number) {
  return data ? diasDesde(inicio, new Date(data + "T00:00:00")) <= limite : false;
}

export function reunioesFeitas(d: Dupla) {
  return [d.reuniao1, d.reuniao2, d.reuniao3, d.reuniao4].filter(Boolean).length;
}

export function aderencia(d: Dupla) {
  const total = d.checkins_realizados + d.checkins_faltados;
  return total ? d.checkins_realizados / total : null;
}

export function calcularIndicadores(duplas: Dupla[]) {
  const execucao = duplas.filter((d) => reunioesFeitas(d) === 4).length;
  const ativacao = duplas.filter((d) => ateDia(d.data_inicio, d.venda_originada, 30)).length;
  const conduzidasD30 = duplas.filter((d) => ateDia(d.data_inicio, d.venda_conduzida, 30)).length;
  const autonomia = duplas.filter((d) => ateDia(d.data_inicio, d.venda_conduzida, 60)).length;
  const formados = duplas.filter((d) => d.status === "formado").length;
  const encerrados = duplas.filter((d) => d.status === "encerrado").length;
  const realizados = duplas.reduce((s, d) => s + d.checkins_realizados, 0);
  const faltados = duplas.reduce((s, d) => s + d.checkins_faltados, 0);
  const horasPadrinho = duplas.reduce((s, d) => s + Number(d.horas_padrinho), 0);
  const horasPsm = duplas.reduce((s, d) => s + Number(d.horas_psm), 0);
  const leads = duplas.reduce((s, d) => s + d.leads_entregues, 0);
  const leadsNovos = duplas.reduce((s, d) => s + d.leads_novos, 0);
  const funil = [
    { label: "Leads entregues", valor: leads },
    { label: "Reunião 1", valor: duplas.filter((d) => d.reuniao1).length },
    { label: "Reunião 2", valor: duplas.filter((d) => d.reuniao2).length },
    { label: "Reunião 3", valor: duplas.filter((d) => d.reuniao3).length },
    { label: "Reunião 4", valor: duplas.filter((d) => d.reuniao4).length },
    { label: "Venda originada", valor: duplas.filter((d) => d.venda_originada).length },
    { label: "Venda conduzida", valor: duplas.filter((d) => d.venda_conduzida).length },
  ];
  return {
    total: duplas.length,
    execucao,
    ativacao,
    conduzidasD30,
    autonomia,
    formados,
    encerrados,
    aderencia: realizados + faltados ? realizados / (realizados + faltados) : null,
    horasPadrinho,
    horasPsm,
    leads,
    leadsNovos,
    funil,
  };
}

export function fase(dia: number) {
  if (dia < 0) return "Não iniciada";
  if (dia <= 5) return "Treino + prospecção";
  if (dia < 15) return "Reuniões ABC";
  if (dia === 15) return "Checkpoint D15";
  if (dia < 30) return "Rumo ao D30";
  if (dia === 30) return "Checkpoint D30";
  if (dia <= 60) return "Acompanhamento D30–D60";
  return "Ciclo encerrado";
}

export const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

export const dataBR = (d: string | null | undefined) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
