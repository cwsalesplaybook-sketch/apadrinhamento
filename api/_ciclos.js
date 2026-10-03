// Histórico por ciclos de 7 dias: sempre de segunda 00:00 a domingo 23:59 (horário de Brasília).
// Cada semana fechada vira um arquivo próprio e imutável: radar/ciclos/<segunda>.json.
// Quem fecha: o agendamento da Vercel (vercel.json → toda segunda 00:05) e, de reserva,
// qualquer abertura da aba Histórico depois que a semana acabou. Não existe fechamento manual:
// todo ciclo tem exatamente 7 dias.
// O servidor não lê o Supabase com permissão própria, então a foto das duplas usa a lista
// mais recente que o app mandou (radar/duplas-atuais.json, atualizada sempre que alguém usa o app).

const PASTA = "radar/ciclos/";
const ARQUIVO_DUPLAS = "radar/duplas-atuais.json";
// Segunda-feira em que o histórico começou (para fechar a 1ª semana mesmo sem nenhum ciclo salvo).
const ARQUIVO_INICIO = "radar/ciclos-inicio.json";
const BRT = 3 * 3600e3; // Brasília = UTC-3, sem horário de verão
const SEMANA = 7 * 864e5;
const MAX_DUPLAS = 500;

/** Primeira segunda-feira 00:00 (Brasília) estritamente depois de `data`. */
export function proximaSegunda(data) {
  const local = new Date(data.getTime() - BRT);
  const dia = local.getUTCDay(); // 0 = domingo
  const ate = ((8 - dia) % 7) || 7;
  const seg = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + ate);
  return new Date(seg + BRT);
}

/** Segunda-feira 00:00 (Brasília) da semana que contém `data`. */
export const inicioDaSemana = (data) => new Date(proximaSegunda(data).getTime() - SEMANA);
const nomeArquivo = (inicio) => PASTA + inicio.toISOString().replace(/[:.]/g, "-") + ".json";

/* ---------- armazenamento ---------- */

async function pastaBlob() {
  const { get, head, list, put, BlobNotFoundError } = await import("@vercel/blob");
  const lerJson = async (nome, semCache = false) => {
    const r = await get(nome, { access: "private", ...(semCache ? { useCache: false } : {}) });
    return r?.statusCode === 200 ? JSON.parse(await new Response(r.stream).text()) : null;
  };
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
    ler: (nome) => lerJson(nome),
    async criar(nome, ciclo) {
      try {
        await put(nome, JSON.stringify(ciclo), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: false,
        });
        return true;
      } catch (e) {
        // A mesma semana já foi fechada (agendamento e alguém abrindo o app ao mesmo tempo): fica a primeira.
        if (/already exists/i.test(String(e?.message))) return false;
        throw e;
      }
    },
    async lerExtra(nome) {
      try {
        await head(nome);
      } catch (e) {
        if (e instanceof BlobNotFoundError) return null;
        throw e;
      }
      return lerJson(nome, true);
    },
    async gravarExtra(nome, conteudo) {
      await put(nome, JSON.stringify(conteudo), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
  };
}

async function pastaLocal() {
  const fs = await import("node:fs/promises");
  const raiz = ".radar-local-ciclos/";
  const caminho = (nome) => raiz + nome.slice(PASTA.length);
  const local = (nome) => ".radar-local-" + nome.split("/").pop();
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
      return fs
        .writeFile(caminho(nome), JSON.stringify(ciclo, null, 2), { flag: "wx" })
        .then(() => true)
        .catch(() => false);
    },
    async lerExtra(nome) {
      try {
        return JSON.parse(await fs.readFile(local(nome), "utf8"));
      } catch {
        return null;
      }
    },
    async gravarExtra(nome, conteudo) {
      await fs.writeFile(local(nome), JSON.stringify(conteudo, null, 2));
    },
  };
}

const pasta = () =>
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID || process.env.VERCEL ? pastaBlob() : pastaLocal();

/* ---------- lista de duplas mais recente ---------- */

const limparDuplas = (duplas) =>
  Array.isArray(duplas)
    ? [...duplas].sort((a, b) => String(a?.id).localeCompare(String(b?.id))).slice(0, MAX_DUPLAS)
    : null;

/** Guarda a lista de duplas que o app acabou de ler (só grava se mudou). */
export async function sincronizarDuplas(duplas, quem, p) {
  const lista = limparDuplas(duplas);
  if (!lista) return false;
  p ??= await pasta();
  const atual = await p.lerExtra(ARQUIVO_DUPLAS);
  if (atual && JSON.stringify(atual.duplas) === JSON.stringify(lista)) return false;
  await p.gravarExtra(ARQUIVO_DUPLAS, { em: new Date().toISOString(), por: quem?.email ?? null, duplas: lista });
  return true;
}

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
  return (Array.isArray(duplas) ? duplas : []).slice(0, MAX_DUPLAS).map((d) => {
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
      lideranca: (dados.comentarios?.[id] ?? [])
        .filter((n) => dentro(n.criadoEm, inicio, fim))
        .slice(0, 20)
        .map((n) => ({ id: n.id, texto: String(n.texto).slice(0, 1500), autor: n.autor, criadoEm: n.criadoEm })),
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

/**
 * Fecha (salva) todas as semanas que já terminaram e devolve { aberto, ciclos } (mais novo primeiro).
 * `duplas`: lista que o app mandou agora; sem ela (agendamento), usa a última guardada.
 */
export async function ciclos({ duplas, dados, quem, automatico = false }) {
  const p = await pasta();
  const agora = new Date();

  let lista = limparDuplas(duplas);
  if (lista) await sincronizarDuplas(lista, quem, p);
  else lista = (await p.lerExtra(ARQUIVO_DUPLAS))?.duplas ?? [];

  const todos = await lerTodos(p);
  const fechadosAgora = [];

  // Próxima semana a fechar: a seguinte à última salva (alinhada na segunda-feira).
  // Sem nada salvo ainda: a semana em que o histórico começou (gravada na primeira vez).
  let inicio;
  if (todos.length) inicio = new Date(inicioDaSemana(new Date(todos.at(-1).inicio)).getTime() + SEMANA);
  else {
    const marcado = await p.lerExtra(ARQUIVO_INICIO);
    inicio = marcado?.inicio ? inicioDaSemana(new Date(marcado.inicio)) : inicioDaSemana(agora);
    if (!marcado?.inicio) await p.gravarExtra(ARQUIVO_INICIO, { inicio: inicio.toISOString() });
  }
  for (let i = 0; i < 12 && inicio.getTime() + SEMANA <= agora.getTime(); i++) {
    const fim = new Date(inicio.getTime() + SEMANA);
    const ciclo = {
      numero: (todos.at(-1)?.numero ?? 0) + 1,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      fechadoEm: agora.toISOString(),
      fechadoPor: automatico ? "fechamento automático" : quem.email,
      automatico: true,
      // "Dia" de cada dupla no fim da semana, mesmo que o fechamento aconteça depois.
      duplas: fotografar(lista, dados, inicio, fim, fim),
    };
    if (await p.criar(nomeArquivo(inicio), ciclo)) fechadosAgora.push(ciclo.numero);
    todos.push(ciclo);
    inicio = fim;
  }

  const inicioAberto = inicioDaSemana(agora);
  const fimPrevisto = new Date(inicioAberto.getTime() + SEMANA);
  return {
    aberto: {
      numero: (todos.at(-1)?.numero ?? 0) + 1,
      inicio: inicioAberto.toISOString(),
      fimPrevisto: fimPrevisto.toISOString(),
      duplas: fotografar(lista, dados, inicioAberto, fimPrevisto, agora),
    },
    ciclos: todos.reverse(),
    fechadosAgora,
  };
}
