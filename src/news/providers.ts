import { SAMPLE_NEWS } from "./sample";
import { loadIncidents } from "../geo/source";
import type { NewsItem, NewsResult } from "./types";

/**
 * Live global cyber-incident news, fetched client-side with a resilient
 * provider chain. No API key ever ships in this repo (see docs/ETHICS.md):
 *
 *   1. A configured proxy endpoint (recommended, reliable) — a tiny Cloudflare
 *      Worker in `worker/` that holds any key as a server-side secret, caches,
 *      and sets CORS. Set its URL in the panel's settings.
 *   2. GDELT DOC 2.0 direct — keyless and worldwide, but rate-limited and not
 *      always CORS-enabled, so best-effort only.
 *   3. An offline illustrative sample, so the panel is never empty.
 */
const ENDPOINT_KEY = "chokepoint-news-endpoint";
const QUERY =
  '(ransomware OR "cyber attack" OR cyberattack OR "data breach" OR "cyber incident" OR hacked)';

export function getEndpoint(): string {
  try {
    return localStorage.getItem(ENDPOINT_KEY) || "";
  } catch {
    return "";
  }
}
export function setEndpoint(v: string): void {
  try {
    if (v) localStorage.setItem(ENDPOINT_KEY, v);
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* storage may be unavailable */
  }
}

export async function fetchNews(limit = 14): Promise<NewsResult> {
  // Same pipeline as the Threat Globe (one shared, memoised fetch of
  // Google News + security-newsroom RSS via the deployed Worker).
  try {
    const feed = await loadIncidents();
    if (feed.status === "live" && feed.incidents.length) {
      const items = feed.incidents
        .slice()
        .sort((a, b) => b.date - a.date)
        .slice(0, limit)
        .map((i) => ({ title: i.title, url: i.url, source: i.source, country: i.victim && !i.victim.approx ? i.victim.name : "", date: i.date }));
      return { items, status: "live", via: feed.via };
    }
  } catch {
    /* fall through */
  }
  const endpoint = getEndpoint();
  if (endpoint) {
    try {
      const items = await fromProxy(endpoint, limit);
      if (items.length) return { items, status: "live", via: "proxy" };
    } catch {
      /* fall through */
    }
  }
  try {
    const items = await fromGdelt(limit);
    if (items.length) return { items, status: "live", via: "GDELT" };
  } catch {
    /* fall through */
  }
  return {
    items: SAMPLE_NEWS.slice(0, limit),
    status: "offline",
    via: "sample",
    note:
      "Live feed unreachable — showing an illustrative offline sample. Deploy the news proxy (worker/) or set an endpoint in settings for real worldwide headlines.",
  };
}

function withTimeout(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

async function fromProxy(endpoint: string, limit: number): Promise<NewsItem[]> {
  const u = new URL(endpoint);
  u.searchParams.set("q", QUERY);
  u.searchParams.set("n", String(limit));
  const r = await fetch(u.toString(), { signal: withTimeout(9000) });
  if (!r.ok) throw new Error(`proxy ${r.status}`);
  const d = (await r.json()) as { items?: Partial<NewsItem>[] };
  return (d.items || []).map(normalize).filter((x) => x.title);
}

async function fromGdelt(limit: number): Promise<NewsItem[]> {
  const u =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(QUERY) +
    `&mode=artlist&format=json&maxrecords=${limit}&sort=datedesc&timespan=5d`;
  const r = await fetch(u, { signal: withTimeout(9000) });
  if (!r.ok) throw new Error(`gdelt ${r.status}`);
  const d = (await r.json()) as { articles?: GdeltArticle[] };
  return (d.articles || []).map((a) => ({
    title: a.title || "",
    url: a.url || "",
    source: a.domain || "",
    country: a.sourcecountry || "",
    date: parseGdeltDate(a.seendate),
  }));
}

interface GdeltArticle {
  title?: string;
  url?: string;
  domain?: string;
  sourcecountry?: string;
  seendate?: string;
}

function normalize(x: Partial<NewsItem>): NewsItem {
  return {
    title: String(x.title ?? ""),
    url: String(x.url ?? ""),
    source: String(x.source ?? ""),
    country: String(x.country ?? ""),
    date: typeof x.date === "number" ? x.date : Date.parse(String(x.date ?? "")) || Date.now(),
  };
}

/** GDELT dates look like "20260124T153000Z". */
function parseGdeltDate(s?: string): number {
  if (!s) return Date.now();
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(s);
  if (!m) return Date.parse(s) || Date.now();
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}
