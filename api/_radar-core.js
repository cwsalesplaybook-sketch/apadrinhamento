// Funis (pipelines), etapa de cada dupla e anotações.
// As duplas continuam no Supabase; isto aqui fica num JSON privado no Vercel Blob,
// gravado com ETag (ifMatch) para duas pessoas salvando ao mesmo tempo não se sobrescreverem.

import { randomUUID } from "node:crypto";

const ARQUIVO = "radar/dados.json";

export const ETAPAS_PADRAO = [
  "Treino + prospecção",
  "Reuniões ABC",
  "Checkpoint D15",
  "Rumo ao D30",
  "Acompanhamento D30–D60",
  "Formado",
];

function vazio() {
  return {
    pipelines: [
      {
        id: randomUUID(),
        nome: "Apadrinhamento",
        etapas: ETAPAS_PADRAO.map((nome) => ({ id: randomUUID(), nome })),
      },
    ],
    // duplaId -> { pipelineId, etapaId }
    posicoes: {},
    // duplaId -> [{ id, texto, autor, criadoEm, fixada? }]
    notas: {},
    // duplaId -> [{ id, tipo: "etapa" | "campos", mudancas: [{ campo, de, para }], autor, em }]
    historico: {},
    // duplaId -> { nome, telefone, email, documento, cidade, estado } (dados do afilhado)
    pessoas: {},
  };
}

/* ---------- armazenamento ---------- */

async function armazenamentoBlob() {
  // Store conectado ao projeto: token clássico ou OIDC (BLOB_STORE_ID), que o SDK resolve sozinho.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    console.error("Blob sem credenciais. Variáveis BLOB*:", Object.keys(process.env).filter((k) => k.includes("BLOB")));
    throw new ErroUso("O armazenamento dos funis ainda não foi conectado na Vercel.");
  }
  const { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } = await import("@vercel/blob");
  return {
    async ler() {
      // ETag oficial vem do head() (API). O do get() é o cabeçalho do download e pode não bater
      // com o que o put({ ifMatch }) compara — aí toda gravação falhava. Lendo o head ANTES do
      // conteúdo, se alguém gravar no meio o ifMatch falha e o alterar() tenta de novo.
      let etag;
      try {
        etag = (await head(ARQUIVO)).etag;
      } catch (e) {
        if (e instanceof BlobNotFoundError) return { dados: vazio(), etag: null };
        throw e;
      }
      const r = await get(ARQUIVO, { access: "private", useCache: false });
      if (!r || r.statusCode !== 200) return { dados: vazio(), etag: null };
      const texto = await new Response(r.stream).text();
      return { dados: JSON.parse(texto), etag };
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
        if (e instanceof BlobPreconditionFailedError || /already exists/i.test(String(e?.message))) {
          console.warn("Conflito ao gravar (etag " + etag + "), tentando de novo:", e?.message);
          return false;
        }
        throw e;
      }
    },
  };
}

// Só para rodar no computador (npm run dev) sem token do Blob.
async function armazenamentoLocal() {
  const fs = await import("node:fs/promises");
  const caminho = ".radar-local.json";
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
    const resultado = fn(dados);
    if (await a.gravar(dados, etag)) return { dados, resultado };
  }
  throw new Error("Muita gente salvando ao mesmo tempo. Tente de novo.");
}

/* ---------- login ---------- */

async function usuario(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  if (process.env.RADAR_DEV_SEM_LOGIN === "1") return { email: "dev@local" };
  const url = process.env.VITE_SUPABASE_URL;
  const chave = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: chave, Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}

/* ---------- regras ---------- */

class ErroUso extends Error {}

const texto = (v, max = 120) => {
  const s = String(v ?? "").trim();
  if (!s) throw new ErroUso("Preencha o nome");
  return s.slice(0, max);
};

function validarPipelines(lista) {
  if (!Array.isArray(lista) || lista.length === 0) throw new ErroUso("Precisa existir pelo menos um funil");
  return lista.map((p) => {
    if (!Array.isArray(p.etapas) || p.etapas.length === 0) throw new ErroUso(`O funil "${p.nome}" precisa de pelo menos uma etapa`);
    return {
      id: String(p.id || randomUUID()),
      nome: texto(p.nome),
      etapas: p.etapas.map((e) => ({ id: String(e.id || randomUUID()), nome: texto(e.nome) })),
    };
  });
}

const ACOES = {
  // Substitui a lista de funis (tela "Editar funis"). Duplas em etapas que sumiram
  // voltam para a primeira etapa do funil delas (ou do primeiro funil).
  salvarPipelines(d, corpo) {
    d.pipelines = validarPipelines(corpo.pipelines);
    for (const [duplaId, pos] of Object.entries(d.posicoes)) {
      const p = d.pipelines.find((x) => x.id === pos.pipelineId);
      if (!p) delete d.posicoes[duplaId];
      else if (!p.etapas.some((e) => e.id === pos.etapaId)) pos.etapaId = p.etapas[0].id;
    }
  },
  mover(d, { duplaId, pipelineId, etapaId }, quem) {
    const p = d.pipelines.find((x) => x.id === pipelineId);
    const etapa = p?.etapas.find((e) => e.id === etapaId);
    if (!etapa) throw new ErroUso("Etapa não encontrada");
    const antes = d.posicoes[duplaId];
    if (antes?.pipelineId === pipelineId && antes?.etapaId === etapaId) return;
    const pAntes = d.pipelines.find((x) => x.id === antes?.pipelineId) ?? d.pipelines[0];
    const eAntes = pAntes.etapas.find((e) => e.id === antes?.etapaId) ?? pAntes.etapas[0];
    d.posicoes[String(duplaId)] = { pipelineId, etapaId, desde: new Date().toISOString() };
    const mudancas = [];
    if (pAntes.id !== p.id) mudancas.push({ campo: "Funil", de: pAntes.nome, para: p.nome });
    if (eAntes.id !== etapa.id || pAntes.id !== p.id) mudancas.push({ campo: "Etapa", de: eAntes.nome, para: etapa.nome });
    registrarEvento(d, duplaId, "etapa", mudancas, quem);
  },
  // Mudanças de campos da dupla (o front salva no Supabase e manda o resumo pra cá).
  registrar(d, { duplaId, mudancas }, quem) {
    if (!Array.isArray(mudancas) || mudancas.length === 0) return;
    const limpas = mudancas.slice(0, 30).map((m) => ({
      campo: String(m.campo ?? "").slice(0, 80),
      de: String(m.de ?? "—").slice(0, 300),
      para: String(m.para ?? "—").slice(0, 300),
    }));
    registrarEvento(d, duplaId, "campos", limpas, quem);
  },
  salvarPessoa(d, { duplaId, pessoa }, quem) {
    d.pessoas ??= {};
    const antes = d.pessoas[duplaId] ?? {};
    const depois = {};
    for (const [chave, rotulo] of Object.entries(CAMPOS_PESSOA)) {
      const v = String(pessoa?.[chave] ?? antes[chave] ?? "").trim().slice(0, 200);
      if (v) depois[chave] = v;
    }
    d.pessoas[duplaId] = depois;
    const mudancas = Object.entries(CAMPOS_PESSOA)
      .filter(([chave]) => (antes[chave] ?? "") !== (depois[chave] ?? ""))
      .map(([chave, rotulo]) => ({ campo: rotulo, de: antes[chave] || "—", para: depois[chave] || "—" }));
    registrarEvento(d, duplaId, "campos", mudancas, quem);
  },
  fixarNota(d, { duplaId, notaId, fixada }) {
    const nota = (d.notas[duplaId] ?? []).find((n) => n.id === notaId);
    if (!nota) throw new ErroUso("Anotação não encontrada");
    nota.fixada = !!fixada;
  },
  nota(d, { duplaId, texto: t }, quem) {
    const conteudo = String(t ?? "").trim();
    if (!conteudo) throw new ErroUso("Escreva a anotação");
    const nota = { id: randomUUID(), texto: conteudo.slice(0, 10000), autor: quem.email, criadoEm: new Date().toISOString() };
    (d.notas[duplaId] ??= []).unshift(nota);
    return nota;
  },
  editarNota(d, { duplaId, notaId, texto: t }) {
    const nota = (d.notas[duplaId] ?? []).find((n) => n.id === notaId);
    if (!nota) throw new ErroUso("Anotação não encontrada");
    const conteudo = String(t ?? "").trim();
    if (!conteudo) throw new ErroUso("Escreva a anotação");
    nota.texto = conteudo.slice(0, 10000);
    nota.editadoEm = new Date().toISOString();
  },
  apagarNota(d, { duplaId, notaId }) {
    d.notas[duplaId] = (d.notas[duplaId] ?? []).filter((n) => n.id !== notaId);
  },
  apagarDupla(d, { duplaId }) {
    delete d.posicoes[duplaId];
    delete d.notas[duplaId];
    delete d.historico?.[duplaId];
    delete d.pessoas?.[duplaId];
  },
};

const CAMPOS_PESSOA = {
  nome: "Nome completo",
  telefone: "Telefone / WhatsApp",
  email: "E-mail",
  documento: "CPF / CNPJ",
  cidade: "Cidade",
  estado: "Estado",
};

function registrarEvento(d, duplaId, tipo, mudancas, quem) {
  if (!mudancas.length) return;
  d.historico ??= {};
  const lista = (d.historico[duplaId] ??= []);
  lista.unshift({ id: randomUUID(), tipo, mudancas, autor: quem.email, em: new Date().toISOString() });
  lista.length = Math.min(lista.length, 500);
}

const json = (corpo, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function tratar(request) {
  try {
    const quem = await usuario(request);
    if (!quem) return json({ erro: "Faça login de novo" }, 401);

    if (request.method === "GET") {
      const { dados, etag } = await (await armazenamento()).ler();
      // Primeira vez: grava o funil padrão, senão cada leitura geraria ids novos.
      if (!etag) return json((await alterar(() => {})).dados);
      return json(dados);
    }
    if (request.method === "POST") {
      const corpo = await request.json();
      const acao = ACOES[corpo?.acao];
      if (!acao) return json({ erro: "Ação desconhecida" }, 400);
      const { dados, resultado } = await alterar((d) => acao(d, corpo, quem));
      return json({ dados, resultado });
    }
    return json({ erro: "Método não permitido" }, 405);
  } catch (e) {
    if (e instanceof ErroUso) return json({ erro: e.message }, 400);
    console.error(e);
    return json({ erro: "Não consegui salvar agora. Tente de novo." }, 500);
  }
}
