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

export interface DadosRadar {
  pipelines: Pipeline[];
  posicoes: Record<string, { pipelineId: string; etapaId: string; desde?: string }>;
  notas: Record<string, Nota[]>;
  historico?: Record<string, Evento[]>;
}

type Acao =
  | { acao: "salvarPipelines"; pipelines: Pipeline[] }
  | { acao: "mover"; duplaId: string; pipelineId: string; etapaId: string }
  | { acao: "nota"; duplaId: string; texto: string }
  | { acao: "editarNota"; duplaId: string; notaId: string; texto: string }
  | { acao: "apagarNota"; duplaId: string; notaId: string }
  | { acao: "fixarNota"; duplaId: string; notaId: string; fixada: boolean }
  | { acao: "registrar"; duplaId: string; mudancas: Mudanca[] }
  | { acao: "apagarDupla"; duplaId: string };

async function chamar<T>(init?: RequestInit): Promise<T> {
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
