// Dados editáveis do portal (trilha da aceleração de vendas e cronograma).
// Ficam num JSON privado no Vercel Blob, gravado com ETag (ifMatch) para duas pessoas
// salvando ao mesmo tempo não se sobrescreverem. Sem login: qualquer pessoa com o link edita.

import { randomUUID } from "node:crypto";

const ARQUIVO = "jornada/dados.json";

// Tabelas aceitas. As colunas de cada uma ficam em src/lib/trilha.ts; aqui só guardamos texto.
const TABELAS = ["abc", "ativados", "cursos", "frente", "cadencia", "regras", "templates", "marcos", "acoes"];

const linha = (campos) => ({ id: randomUUID(), ...campos });

function vazio() {
  const tabelas = Object.fromEntries(TABELAS.map((t) => [t, []]));
  tabelas.marcos = [
    linha({
      data: "22/10/2026",
      horario: "",
      titulo: "Documento Jornada do Representante v1.0",
      descricao: "Primeira versão do documento, com status Em validação.",
      responsavel: "Hyorranes Souza",
      status: "Concluído",
    }),
    linha({
      data: "26/10/2026",
      horario: "",
      titulo: "Definição de benefícios e liberações por nível",
      descricao: "Alinhamento com o time de representantes para definir o que cada nível recebe e o que o portal libera.",
      responsavel: "Gabrielly, Beatriz e Hyorranes",
      status: "Concluído",
    }),
    linha({
      data: "26/10/2026",
      horario: "14h às 15h30",
      titulo: "Reunião de tierização",
      descricao:
        "Fechar os níveis dentro de cada grande grupo, definir as abas e funcionalidades liberadas por nível no portal e fechar Aspirantes e Estrelas: critérios de entrada, acompanhamento e benefícios.",
      responsavel: "Gabrielly, Beatriz e Hyorranes",
      status: "Pendente",
    }),
  ];
  tabelas.acoes = [
    ["Entrar em contato com os 18 clientes remanescentes", "Fechamento previsto para segunda-feira.", "Gabrielly", "26/10/2026"],
    ["Finalizar o documento e enviar ao Davi", "", "Hyorranes", ""],
    ["Incluir no portal a receita e o churn mensais por representante", "Hoje só existe o total.", "Hyorranes", ""],
    [
      'Segmentar e etiquetar os cerca de 40 representantes com perfil "outros"',
      "Contato por mensagem; etiquetar o perfil de cada um no portal, para ter métricas mais reais.",
      "Gabrielly, Beatriz e Hyorranes",
      "",
    ],
    ["Criar slide de prova social com reps de sucesso", "Para usar no ABC.", "", ""],
    ["Revisar o RFV / Health Score", "Com uma visão por fase da jornada.", "", ""],
    ["Transcrever as decisões para o documento oficial", "", "", ""],
    ["Atualizar a calculadora de comissão para o cálculo por venda", "", "", ""],
    ["Enviar o nivelamento para aprovação do Rafa e da Vân", "", "", ""],
  ].map(([titulo, descricao, responsavel, prazo]) => linha({ titulo, descricao, responsavel, prazo, status: "Pendente" }));
  return { tabelas, atualizadoEm: null };
}

/* ---------- armazenamento ---------- */

async function armazenamentoBlob() {
  // Store conectado ao projeto: token clássico ou OIDC (BLOB_STORE_ID), que o SDK resolve sozinho.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new ErroUso("O armazenamento ainda não foi conectado na Vercel.");
  }
  const { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } = await import("@vercel/blob");
  return {
    async ler() {
      // ETag oficial vem do head(): o do get() pode não bater com o que o put({ ifMatch }) compara.
      let etag;
      try {
        etag = (await head(ARQUIVO)).etag;
      } catch (e) {
        if (e instanceof BlobNotFoundError) return { dados: vazio(), etag: null };
        throw e;
      }
      const r = await get(ARQUIVO, { access: "private", useCache: false });
      if (!r || r.statusCode !== 200) return { dados: vazio(), etag: null };
      return { dados: JSON.parse(await new Response(r.stream).text()), etag };
    },
    async gravar(dados, etag) {
      try {
        await put(ARQUIVO, JSON.stringify(dados), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          cacheControlMaxAge: 60,
          ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
        });
        return true;
      } catch (e) {
        // Outra pessoa gravou antes: relê e aplica de novo.
        if (e instanceof BlobPreconditionFailedError || /already exists/i.test(String(e?.message))) return false;
        throw e;
      }
    },
  };
}

// Só para rodar no computador (npm run dev) sem o Blob.
async function armazenamentoLocal() {
  const fs = await import("node:fs/promises");
  const caminho = ".jornada-local.json";
  return {
    async ler() {
      try {
        return { dados: JSON.parse(await fs.readFile(caminho, "utf8")), etag: "local" };
      } catch {
        return { dados: vazio(), etag: null };
      }
    },
    async gravar(dados) {
      await fs.writeFile(caminho, JSON.stringify(dados, null, 2));
      return true;
    },
  };
}

const armazenamento = () =>
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID || process.env.VERCEL ? armazenamentoBlob() : armazenamentoLocal();

async function alterar(fn) {
  const a = await armazenamento();
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const { dados, etag } = await a.ler();
    fn(dados);
    dados.atualizadoEm = new Date().toISOString();
    if (await a.gravar(dados, etag)) return dados;
  }
  throw new Error("Muita gente salvando ao mesmo tempo. Tente de novo.");
}

/* ---------- regras ---------- */

class ErroUso extends Error {}

function tabelaValida(t) {
  if (!TABELAS.includes(t)) throw new ErroUso("Tabela desconhecida");
  return t;
}

// Cada campo vira texto curto; anotações longas cabem em 20 mil caracteres.
function limparLinha(bruta) {
  if (!bruta || typeof bruta !== "object") throw new ErroUso("Linha inválida");
  const limpa = { id: String(bruta.id || randomUUID()).slice(0, 64) };
  for (const [k, v] of Object.entries(bruta)) {
    if (k === "id" || !/^[a-z][a-zA-Z0-9]{0,30}$/.test(k)) continue;
    limpa[k] = String(v ?? "").slice(0, 20000);
  }
  return limpa;
}

const ACOES = {
  salvarLinha(dados, { tabela, linha: bruta }) {
    const lista = (dados.tabelas[tabelaValida(tabela)] ??= []);
    const nova = limparLinha(bruta);
    const i = lista.findIndex((l) => l.id === nova.id);
    if (i >= 0) lista[i] = nova;
    else lista.unshift(nova);
  },
  apagarLinha(dados, { tabela, id }) {
    const t = tabelaValida(tabela);
    dados.tabelas[t] = (dados.tabelas[t] ?? []).filter((l) => l.id !== id);
  },
  // Carga inicial vinda da planilha: só preenche tabelas que ainda estão vazias.
  importar(dados, { tabelas }) {
    for (const [t, linhas] of Object.entries(tabelas ?? {})) {
      tabelaValida(t);
      if ((dados.tabelas[t] ?? []).length > 0 || !Array.isArray(linhas)) continue;
      dados.tabelas[t] = linhas.map(limparLinha);
    }
  },
};

/* ---------- HTTP ---------- */

const json = (corpo, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function tratar(request) {
  try {
    if (request.method === "GET") {
      const { dados } = await (await armazenamento()).ler();
      for (const t of TABELAS) dados.tabelas[t] ??= [];
      return json(dados);
    }
    if (request.method !== "POST") return json({ erro: "Método não permitido" }, 405);
    const corpo = await request.json().catch(() => ({}));
    const acao = ACOES[corpo.acao];
    if (!acao) return json({ erro: "Ação desconhecida" }, 400);
    return json(await alterar((dados) => acao(dados, corpo)));
  } catch (e) {
    if (e instanceof ErroUso) return json({ erro: e.message }, 400);
    console.error(e);
    return json({ erro: e?.message || "Erro inesperado" }, 500);
  }
}
