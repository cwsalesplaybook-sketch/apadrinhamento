// Histórico por ciclos de 1 semana (segunda 00:00 a domingo 23:59, horário de Brasília).
// Cada ciclo fechado vira um arquivo próprio e imutável: radar/ciclos/<inicio>.json.
// O fechamento é automático na primeira chamada depois que a semana acaba, ou manual
// ("Fechar ciclo agora"). As duplas vêm do front (o servidor não lê o Supabase com
// permissão própria); o resto (etapas, anotações, histórico) vem do dados.json.

const PASTA = "radar/ciclos/";
const BRT = 3 * 3600e3; // Brasília = UTC-3, sem horário de verão
const SEMANA = 7 * 864e5;

/** Primeira segunda-feira 00:00 (Brasília) estritamente depois de `data`. */
export function proximaSegunda(data) {
  const local = new Date(data.getTime() - BRT);
  const dia = local.getUTCDay(); // 0 = domingo
  const ate = ((8 - dia) % 7) || 7;
  const seg = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + ate);
  return new Date(seg + BRT);
}

const inicioDaSemana = (data) => new Date(proximaSegunda(data).getTime() - SEMANA);
const nomeArquivo = (inicio) => PASTA + inicio.toISOString().replace(/[:.]/g, "-") + ".json";

/* ---------- armazenamento dos ciclos ---------- */

async function pastaBlob() {
  const { get, list, put } = await import("@vercel/blob");
  return {
    async listar() {
      const nomes = [];
      let cursor;
      do {
        const r = await list({ prefix: PASTA, cursor, limit: 1000 });
        nomes.push(...r.blobs.map((b) => b.pathname));
        cursor = r.hasMore ? r.cursor : undefined;
      } while (cursor);
      return nomes.sort();
    },
    async ler(nome) {
      const r = await get(nome, { access: "private" });
      return r?.statusCode === 200 ? JSON.parse(await new Response(r.stream).text()) : null;
    },
    async criar(nome, ciclo) {
      try {
        await put(nome, JSON.stringify(ciclo), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: false,
        });
      } catch (e) {
        // Outra pessoa fechou o mesmo ciclo no mesmo instante: fica o dela.
        if (!/already exists/i.test(String(e?.message))) throw e;
      }
    },
  };
}

async function pastaLocal() {
  const fs = await import("node:fs/promises");
  const raiz = ".radar-local-ciclos/";
  const caminho = (nome) => raiz + nome.slice(PASTA.length);
  return {
    async listar() {
      try {
        return (await fs.readdir(raiz)).map((n) => PASTA + n).sort();
      } catch {
        return [];
      }
    },
    async ler(nome) {
      return JSON.parse(await fs.readFile(caminho(nome), "utf8"));
    },
    async criar(nome, ciclo) {
      await fs.mkdir(raiz, { recursive: true });
      await fs.writeFile(caminho(nome), JSON.stringify(ciclo, null, 2), { flag: "wx" }).catch(() => {});
    },
  };
}

const pasta = () =>
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID || process.env.VERCEL ? pastaBlob() : pastaLocal();

/* ---------- foto das duplas ---------- */

const num = (v) => Number(v) || 0;
const dentro = (iso, inicio, fim) => {
  const t = new Date(iso).getTime();
  return t >= inicio.getTime() && t < fim.getTime();
};

function posicao(dados, duplaId) {
  const salva = dados.posicoes?.[duplaId];
  const p = dados.pipelines.find((x) => x.id === salva?.pipelineId) ?? dados.pipelines[0];
  const e = p?.etapas.find((x) => x.id === salva?.etapaId) ?? p?.etapas[0];
  return { funil: p?.nome ?? "—", etapa: e?.nome ?? "—" };
}

function fotografar(duplas, dados, inicio, fim, agora) {
  return (Array.isArray(duplas) ? duplas : []).slice(0, 500).map((d) => {
    const id = String(d.id);
    const D0 = new Date(String(d.data_inicio) + "T00:00:00-03:00");
    return {
      id,
      afilhado: String(d.afilhado ?? ""),
      padrinho: String(d.padrinho ?? ""),
      nome: dados.pessoas?.[id]?.nome ?? null,
      status: String(d.status ?? ""),
      ciclo: num(d.ciclo),
      dia: Math.floor((agora.getTime() - D0.getTime()) / 864e5),
      ...posicao(dados, id),
      reunioes: [d.reuniao1, d.reuniao2, d.reuniao3, d.reuniao4].filter(Boolean).length,
      leads_entregues: num(d.leads_entregues),
      leads_novos: num(d.leads_novos),
      checkins_realizados: num(d.checkins_realizados),
      checkins_faltados: num(d.checkins_faltados),
      venda_originada: d.venda_originada ?? null,
      venda_conduzida: d.venda_conduzida ?? null,
      horas: num(d.horas_padrinho) + num(d.horas_psm),
      // O que aconteceu na semana
      eventos: (dados.historico?.[id] ?? []).filter((ev) => dentro(ev.em, inicio, fim)).slice(0, 40),
      notas: (dados.notas?.[id] ?? [])
        .filter((n) => dentro(n.criadoEm, inicio, fim))
        .slice(0, 40)
        .map((n) => ({ id: n.id, texto: String(n.texto).slice(0, 1500), autor: n.autor, criadoEm: n.criadoEm })),
    };
  });
}

/* ---------- ciclos ---------- */

async function lerTodos(p) {
  const nomes = await p.listar();
  const ciclos = await Promise.all(nomes.map((n) => p.ler(n).catch(() => null)));
  return ciclos.filter(Boolean).sort((a, b) => a.inicio.localeCompare(b.inicio));
}

function inicioDoAberto(ciclos, agora) {
  const ultimo = ciclos.at(-1);
  return ultimo ? new Date(ultimo.fim) : inicioDaSemana(agora);
}

async function fechar(p, ciclos, { inicio, fim, duplas, dados, quem, automatico, agora }) {
  const ciclo = {
    numero: (ciclos.at(-1)?.numero ?? 0) + 1,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    fechadoEm: agora.toISOString(),
    fechadoPor: quem.email,
    automatico,
    // "Dia" da dupla no fim da semana, mesmo que o fechamento automático aconteça depois.
    duplas: fotografar(duplas, dados, inicio, fim, fim < agora ? fim : agora),
  };
  await p.criar(nomeArquivo(inicio), ciclo);
  ciclos.push(ciclo);
}

/** Fecha as semanas que já acabaram e devolve { aberto, ciclos } (mais novo primeiro). */
export async function ciclos({ duplas, dados, quem, fecharAgora = false }) {
  const p = await pasta();
  const agora = new Date();
  const todos = await lerTodos(p);

  // Semanas encerradas sem ninguém abrir o app: fecha uma por uma (máx. 8 de uma vez).
  for (let i = 0; i < 8; i++) {
    const inicio = inicioDoAberto(todos, agora);
    const fim = proximaSegunda(inicio);
    if (agora < fim) break;
    await fechar(p, todos, { inicio, fim, duplas, dados, quem, automatico: true, agora });
  }

  if (fecharAgora) {
    const inicio = inicioDoAberto(todos, agora);
    if (agora.getTime() - inicio.getTime() < 60e3) throw Object.assign(new Error("O ciclo atual acabou de começar."), { uso: true });
    await fechar(p, todos, { inicio, fim: agora, duplas, dados, quem, automatico: false, agora });
  }

  const inicio = inicioDoAberto(todos, agora);
  const fimPrevisto = proximaSegunda(inicio);
  return {
    aberto: {
      numero: (todos.at(-1)?.numero ?? 0) + 1,
      inicio: inicio.toISOString(),
      fimPrevisto: fimPrevisto.toISOString(),
      duplas: fotografar(duplas, dados, inicio, fimPrevisto, agora),
    },
    ciclos: todos.reverse(),
  };
}
