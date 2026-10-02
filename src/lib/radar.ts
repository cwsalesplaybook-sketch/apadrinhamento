import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

/** Funis, etapa de cada dupla e anotações — guardados pela rota /api/radar (Vercel Blob). */

export interface Etapa {
  id: string;
  nome: string;
}

export interface Pipeline {
  id: string;
  nome: string;
  etapas: Etapa[];
}

export interface Nota {
  id: string;
  texto: string;
  autor: string;
  criadoEm: string;
  editadoEm?: string;
  fixada?: boolean;
}

export interface Mudanca {
  campo: string;
  de: string;
  para: string;
}

export interface Evento {
  id: string;
  tipo: "etapa" | "campos";
  mudancas: Mudanca[];
  autor: string;
  em: string;
}

/** Dados da pessoa (afilhado) — o banco das duplas não tem essas colunas. */
export const CAMPOS_PESSOA = [
  { chave: "nome", rotulo: "Nome completo", tipo: "text" },
  { chave: "telefone", rotulo: "Telefone / WhatsApp", tipo: "tel" },
  { chave: "email", rotulo: "E-mail", tipo: "email" },
  { chave: "documento", rotulo: "CPF / CNPJ", tipo: "text" },
  { chave: "cidade", rotulo: "Cidade", tipo: "text" },
  { chave: "estado", rotulo: "Estado", tipo: "text" },
] as const;

export type Pessoa = Partial<Record<(typeof CAMPOS_PESSOA)[number]["chave"], string>>;

/** Link do WhatsApp a partir do telefone (assume Brasil se vier sem DDI). */
export function linkWhatsApp(telefone: string) {
  const n = telefone.replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n.length <= 11 ? "55" + n : n}`;
}

export interface ComentarioLideranca {
  id: string;
  texto: string;
  autor: string;
  criadoEm: string;
  editadoEm?: string;
}

export interface Template {
  id: string;
  titulo: string;
  categoria: string;
  texto: string;
  autor: string;
  criadoEm: string;
  atualizadoEm?: string;
  atualizadoPor?: string;
}

/** Lideranças (acesso master). O servidor (api/_radar-core.js) é quem garante; aqui é só pra tela. */
export const MASTERS = [
  "hyorranes.souza@cardapioweb.com",
  "rafael.barbosa@cardapioweb.com",
  "vanessa.alencar@cardapioweb.com",
];

export function useEu() {
  const { data } = useQuery({
    queryKey: ["eu"],
    queryFn: async () => (await supabase.auth.getSession()).data.session?.user.email?.toLowerCase() ?? "",
    staleTime: 30_000,
  });
  return { email: data ?? "", master: MASTERS.includes(data ?? "") };
}

export interface PostDaily {
  id: string;
  texto: string;
  /** Dia a que a atualização se refere (AAAA-MM-DD). */
  data: string;
  autor: string;
  criadoEm: string;
  editadoEm?: string;
  curtidas?: string[];
}

export interface Perfil {
  foto?: string;
  nome?: string;
}

export interface Anexo {
  id: string;
  titulo: string;
  url: string;
  descricao?: string;
  autor: string;
  criadoEm: string;
  atualizadoEm?: string;
}

/** "gabrielly.oliveira@..." -> "Gabrielly Oliveira" (ou o nome que a pessoa salvou no perfil). */
export function nomeDe(email: string, perfis?: Record<string, Perfil>) {
  const salvo = perfis?.[email]?.nome;
  if (salvo) return salvo;
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

export interface DadosRadar {
  pipelines: Pipeline[];
  posicoes: Record<string, { pipelineId: string; etapaId: string; desde?: string }>;
  notas: Record<string, Nota[]>;
  historico?: Record<string, Evento[]>;
  pessoas?: Record<string, Pessoa>;
  comentarios?: Record<string, ComentarioLideranca[]>;
  templates?: Template[];
  /** Checklist do Playbook de ativação: itemId -> quem marcou e quando. */
  playbook?: Record<string, { por: string; em: string }>;
  daily?: PostDaily[];
  perfis?: Record<string, Perfil>;
  anexos?: Anexo[];
}

type Acao =
  | { acao: "salvarPipelines"; pipelines: Pipeline[] }
  | { acao: "mover"; duplaId: string; pipelineId: string; etapaId: string }
  | { acao: "nota"; duplaId: string; texto: string }
  | { acao: "editarNota"; duplaId: string; notaId: string; texto: string }
  | { acao: "apagarNota"; duplaId: string; notaId: string }
  | { acao: "salvarPessoa"; duplaId: string; pessoa: Pessoa }
  | { acao: "fixarNota"; duplaId: string; notaId: string; fixada: boolean }
  | { acao: "registrar"; duplaId: string; mudancas: Mudanca[] }
  | { acao: "comentarioLideranca"; duplaId: string; texto: string }
  | { acao: "editarComentarioLideranca"; duplaId: string; comentarioId: string; texto: string }
  | { acao: "apagarComentarioLideranca"; duplaId: string; comentarioId: string }
  | { acao: "salvarTemplate"; template: Partial<Template> }
  | { acao: "apagarTemplate"; templateId: string }
  | { acao: "marcarPlaybook"; itemId: string; feito: boolean }
  | { acao: "postarDaily"; texto: string; data: string }
  | { acao: "editarDaily"; postId: string; texto: string; data: string }
  | { acao: "apagarDaily"; postId: string }
  | { acao: "curtirDaily"; postId: string }
  | { acao: "salvarPerfil"; foto?: string; nome?: string }
  | { acao: "salvarAnexo"; anexo: Partial<Anexo> }
  | { acao: "apagarAnexo"; anexoId: string }
  | { acao: "apagarDupla"; duplaId: string };

export async function chamar<T>(init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/radar", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
  });
  const corpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(corpo.erro ?? "Não consegui falar com o servidor");
  return corpo as T;
}

export function useRadar() {
  return useQuery({
    queryKey: ["radar"],
    queryFn: () => chamar<DadosRadar>(),
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useAcaoRadar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (acao: Acao) => chamar<{ dados: DadosRadar }>({ method: "POST", body: JSON.stringify(acao) }),
    onMutate: async (acao) => {
      // Mover card: atualiza na hora, sem esperar o servidor.
      if (acao.acao !== "mover") return;
      await qc.cancelQueries({ queryKey: ["radar"] });
      const antes = qc.getQueryData<DadosRadar>(["radar"]);
      if (antes)
        qc.setQueryData<DadosRadar>(["radar"], {
          ...antes,
          posicoes: {
            ...antes.posicoes,
            [acao.duplaId]: { pipelineId: acao.pipelineId, etapaId: acao.etapaId, desde: new Date().toISOString() },
          },
        });
      return { antes };
    },
    onSuccess: ({ dados }) => qc.setQueryData(["radar"], dados),
    onError: (e: Error, _acao, ctx) => {
      if (ctx?.antes) qc.setQueryData(["radar"], ctx.antes);
      toast.error(e.message);
    },
  });
}

/** Funil e etapa em que a dupla está. Sem posição salva: primeira etapa do primeiro funil. */
export function posicaoDa(dados: DadosRadar | undefined, duplaId: string) {
  if (!dados?.pipelines.length) return null;
  const salva = dados.posicoes[duplaId];
  const pipeline = (salva && dados.pipelines.find((p) => p.id === salva.pipelineId)) || dados.pipelines[0];
  const etapa = pipeline.etapas.find((e) => e.id === salva?.etapaId) ?? pipeline.etapas[0];
  return { pipeline, etapa, desde: salva?.desde };
}

export const dataHoraBR = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
