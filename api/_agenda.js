// Agenda de cada pessoa: lida pelo "endereço secreto no formato iCal" (Google Agenda, Outlook…).
// Só leitura: o Radar nunca escreve na agenda. O link fica num arquivo privado separado
// (radar/agendas.json) e nunca volta para o navegador de ninguém — nem da própria pessoa.

const ARQUIVO = "radar/agendas.json";
const BRT = 3 * 3600e3;

async function armazenamento() {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID || process.env.VERCEL) {
    const { get, head, put, BlobNotFoundError } = await import("@vercel/blob");
    return {
      async ler() {
        try {
          await head(ARQUIVO);
        } catch (e) {
          if (e instanceof BlobNotFoundError) return {};
          throw e;
        }
        const r = await get(ARQUIVO, { access: "private", useCache: false });
        return r?.statusCode === 200 ? JSON.parse(await new Response(r.stream).text()) : {};
      },
      async gravar(dados) {
        await put(ARQUIVO, JSON.stringify(dados), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      },
    };
  }
  const fs = await import("node:fs/promises");
  const caminho = ".radar-local-agendas.json";
  return {
    async ler() {
      try {
        return JSON.parse(await fs.readFile(caminho, "utf8"));
      } catch {
        return {};
      }
    },
    async gravar(dados) {
      await fs.writeFile(caminho, JSON.stringify(dados, null, 2));
    },
  };
}

class ErroAgenda extends Error {
  uso = true;
}

function validarLink(url) {
  const s = String(url ?? "").trim().replace(/^webcal:\/\//i, "https://");
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new ErroAgenda("Cole o link completo da agenda (começa com https://).");
  }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(local && u.protocol === "http:"))
    throw new ErroAgenda("O link da agenda precisa começar com https://");
  if (!local && /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname))
    throw new ErroAgenda("Link de agenda inválido.");
  return u.toString();
}

async function baixarIcs(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: "text/calendar, */*" } });
  if (!r.ok) throw new ErroAgenda(`A agenda não respondeu (erro ${r.status}). Confira se o link está certo.`);
  const texto = await r.text();
  if (!/BEGIN:VCALENDAR/.test(texto)) throw new ErroAgenda("Esse link não é de uma agenda iCal (.ics).");
  return texto;
}

const nomeDe = (p) => {
  if (!p) return "";
  const cn = p.params?.CN ?? "";
  const email = String(p.val ?? p).replace(/^mailto:/i, "");
  return String(cn || email).replace(/^"|"$/g, "");
};
const emailDe = (p) => String(p?.val ?? p ?? "").replace(/^mailto:/i, "").toLowerCase();

/** Eventos entre `inicio` e `fim` (Date), já com recorrências expandidas. */
async function eventosDoIcs(texto, inicio, fim, dono) {
  const ical = (await import("node-ical")).default;
  const dados = ical.sync.parseICS(texto);
  const saida = [];
  for (const ev of Object.values(dados)) {
    if (ev.type !== "VEVENT" || !ev.start) continue;
    if (String(ev.status ?? "").toUpperCase() === "CANCELLED") continue;
    const duracao = ev.end ? new Date(ev.end) - new Date(ev.start) : 3600e3;
    const convidados = [ev.attendee ?? []].flat().filter(Boolean);
    const outros = convidados.filter((a) => emailDe(a) && emailDe(a) !== dono);
    // Eu recusei? Então não conta como reunião minha.
    const eu = convidados.find((a) => emailDe(a) === dono);
    if (String(eu?.params?.PARTSTAT ?? "").toUpperCase() === "DECLINED") continue;
    const base = {
      uid: String(ev.uid ?? ""),
      titulo: String(ev.summary?.val ?? ev.summary ?? "(sem título)").slice(0, 200),
      convidados: outros.slice(0, 12).map(nomeDe),
      local: String(ev.location?.val ?? ev.location ?? "").slice(0, 200),
      diaInteiro: ev.datetype === "date",
    };
    const ocorrencias = [];
    if (ev.rrule) {
      // O rrule do node-ical trabalha com a hora "local" escrita como UTC; corrige pelo
      // deslocamento entre o início real do evento e o início que o rrule enxerga.
      const ajuste = new Date(ev.start).getTime() - new Date(ev.rrule.options.dtstart).getTime();
      const excluidas = new Set(Object.values(ev.exdate ?? {}).map((d) => new Date(d).getTime()));
      const brutas = ev.rrule.between(new Date(inicio.getTime() - duracao - ajuste), new Date(fim.getTime() - ajuste), true);
      for (const bruta of brutas) {
        const d = new Date(bruta.getTime() + ajuste);
        if (d >= fim || d.getTime() + duracao <= inicio.getTime()) continue;
        if (excluidas.has(d.getTime()) || excluidas.has(bruta.getTime())) continue;
        const alterada = Object.values(ev.recurrences ?? {}).find((r) => r.recurrenceid && new Date(r.recurrenceid).getTime() === d.getTime());
        if (alterada) continue; // a versão alterada vem como evento próprio (com RECURRENCE-ID)
        ocorrencias.push(d);
      }
      for (const r of Object.values(ev.recurrences ?? {})) {
        if (String(r.status ?? "").toUpperCase() === "CANCELLED") continue;
        const d = new Date(r.start);
        if (d < fim && d.getTime() + duracao > inicio.getTime()) ocorrencias.push({ alterada: r });
      }
    } else {
      const d = new Date(ev.start);
      if (d < fim && d.getTime() + duracao > inicio.getTime()) ocorrencias.push(d);
    }
    for (const o of ocorrencias) {
      const ini = o.alterada ? new Date(o.alterada.start) : o;
      const f = o.alterada?.end ? new Date(o.alterada.end) : new Date(ini.getTime() + duracao);
      saida.push({
        ...base,
        ...(o.alterada ? { titulo: String(o.alterada.summary?.val ?? o.alterada.summary ?? base.titulo).slice(0, 200) } : {}),
        id: `${base.uid}|${ini.toISOString()}`.slice(0, 300),
        inicio: ini.toISOString(),
        fim: f.toISOString(),
        // Dia (horário de Brasília) em que a reunião conta na rotina.
        data: new Date(ini.getTime() - BRT).toISOString().slice(0, 10),
      });
    }
  }
  return saida.filter((e) => !e.diaInteiro).sort((a, b) => a.inicio.localeCompare(b.inicio)).slice(0, 400);
}

export async function conectarAgenda(email, url) {
  const link = validarLink(url);
  // Testa antes de salvar: se não for uma agenda, avisa na hora.
  await eventosDoIcs(await baixarIcs(link), new Date(Date.now() - 864e5), new Date(Date.now() + 864e5), email);
  const a = await armazenamento();
  const todas = await a.ler();
  todas[email] = { url: link, conectadaEm: new Date().toISOString() };
  await a.gravar(todas);
}

export async function desconectarAgenda(email) {
  const a = await armazenamento();
  const todas = await a.ler();
  delete todas[email];
  await a.gravar(todas);
}

/** { conectada, eventos } da pessoa entre duas datas ISO. */
export async function eventosDaAgenda(email, inicioISO, fimISO) {
  const todas = await (await armazenamento()).ler();
  const minha = todas[email];
  if (!minha) return { conectada: false, eventos: [] };
  const inicio = new Date(inicioISO);
  const fim = new Date(fimISO);
  if (!(inicio < fim) || fim - inicio > 62 * 864e5) throw new ErroAgenda("Período inválido");
  const eventos = await eventosDoIcs(await baixarIcs(minha.url), inicio, fim, email);
  return { conectada: true, conectadaEm: minha.conectadaEm, eventos };
}
