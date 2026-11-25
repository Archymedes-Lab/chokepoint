/**
 * Loads geolocated incidents for the Threat Globe (and headlines for the
 * Live Threat Wire — one fetch serves both).
 *   1. /api/feeds on the same origin: the deployed Worker's cached bundle of
 *      Bing News searches + newspaper and security-newsroom RSS.
 *   2. GDELT directly from the browser (local dev without the Worker).
 *   3. A small offline sample, clearly labelled, so the globe is never blank.
 * Parsing and extraction run in a Web Worker (pipeline.worker.ts).
 */
import { cleanTitle, type Incident, type RawArticle } from "./extract";
import type { FeedDoc } from "./rss";
import type { PipelineIn, PipelineOut } from "./pipeline.worker";

export interface IncidentFeed {
  incidents: Incident[];
  status: "live" | "offline";
  via: string;
  updated: number;
  articles: number;
  sources: number;
}

const MEMO_MS = 5 * 60e3;
let memo: { at: number; p: Promise<IncidentFeed> } | null = null;

/** Shared, memoised for a few minutes so the globe and the wire don't double-fetch. */
export function loadIncidents(force = false): Promise<IncidentFeed> {
  if (!force && memo && Date.now() - memo.at < MEMO_MS) return memo.p;
  const p = load();
  memo = { at: Date.now(), p };
  p.catch(() => (memo = null));
  return p;
}

function timeout(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

function runPipeline(input: PipelineIn): Promise<PipelineOut> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<PipelineOut>) => {
      resolve(e.data);
      w.terminate();
    };
    w.onerror = (e) => {
      reject(new Error(e.message));
      w.terminate();
    };
    w.postMessage(input);
  });
}

async function load(): Promise<IncidentFeed> {
  try {
    const r = await fetch("/api/feeds", { signal: timeout(30000) });
    if (r.ok && (r.headers.get("content-type") ?? "").includes("json")) {
      const d = (await r.json()) as { fetched: number; docs: FeedDoc[] };
      if (d.docs?.length) {
        const out = await runPipeline({ docs: d.docs });
        if (out.incidents.length) {
          const gn = d.docs.some((x) => x.kind === "search");
          const fd = d.docs.some((x) => x.kind === "feed");
          return {
            ...out,
            status: "live",
            via: [gn && "Bing News", fd && "newspapers & security press"].filter(Boolean).join(" + "),
            updated: d.fetched,
            sources: d.docs.length,
          };
        }
      }
    }
  } catch {
    /* fall through */
  }
  try {
    const q = '(ransomware OR cyberattack OR "data breach" OR hackers) sourcelang:english';
    const u =
      "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
      encodeURIComponent(q) +
      "&mode=artlist&format=json&maxrecords=250&sort=datedesc&timespan=7d";
    const r = await fetch(u, { signal: timeout(15000) });
    const text = await r.text();
    if (r.ok && text.startsWith("{")) {
      const d = JSON.parse(text) as { articles?: { title?: string; url?: string; domain?: string; sourcecountry?: string; seendate?: string }[] };
      const raw: RawArticle[] = (d.articles ?? []).map((a) => ({
        title: cleanTitle(a.title ?? ""),
        url: a.url ?? "",
        source: a.domain ?? "",
        country: a.sourcecountry ?? "",
        date: gdeltDate(a.seendate),
      }));
      const out = await runPipeline({ raw });
      if (out.incidents.length) return { ...out, status: "live", via: "GDELT (direct)", updated: Date.now(), sources: 1 };
    }
  } catch {
    /* fall through */
  }
  const out = await runPipeline({ raw: SAMPLE });
  return { ...out, status: "offline", via: "offline sample", updated: Date.now(), sources: 0 };
}

function gdeltDate(s?: string): number {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(s ?? "");
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : Date.now();
}

const H = 3600e3;
const now = Date.now();
/** Illustrative only — shown when no live source is reachable, and labelled so. */
const SAMPLE: RawArticle[] = [
  ["Ransomware gang claims attack on German hospital network", 6],
  ["Iranian hackers target Israeli water utilities, officials say", 10],
  ["Chinese state-backed hackers breached US telecom providers", 3],
  ["North Korean hackers linked to $300M crypto exchange theft in Japan", 20],
  ["Russian-linked DDoS attacks knock Polish government sites offline", 14],
  ["Data breach at Australian insurer exposes millions of records", 30],
  ["Cyberattack disrupts flights at UK airport check-in systems", 8],
  ["Brazilian bank hit by ransomware, services restored", 40],
  ["Kenyan government portal suffers data leak", 52],
  ["Indian healthcare provider hacked, patient data stolen", 16],
  ["Salt Typhoon intrusions found in Canadian telecom networks", 60],
  ["South African port operator recovers from cyberattack", 72],
].map(([title, h], i) => ({
  title: String(title),
  url: "",
  source: "sample",
  country: "",
  date: now - Number(h) * H - i,
}));
