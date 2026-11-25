/**
 * Chokepoint at state.archymedes.xyz — the static app plus one data route.
 *
 *   GET /api/feeds   raw RSS/Atom for the Threat Globe and Live Threat Wire
 *   GET /api/health  per-source reachability (diagnostics, no secrets)
 *
 * The Worker is a thin, cached proxy: it fetches Bing News RSS searches
 * (thousands of newspapers, several regional markets), newspaper security
 * sections and established security newsrooms — six at a time, the Workers
 * connection limit — and caches the bundle for 15 minutes. (Google News and
 * GDELT refuse Cloudflare's shared IPs, so they aren't used here.) Parsing, clustering and geolocation run in the visitor's browser
 * (a Web Worker running src/geo/), which keeps this Worker within the free
 * plan's tiny CPU budget — fetch wait time doesn't count, parsing would.
 * All sources are keyless; nothing secret lives in the repo.
 */
import { FEEDS, SEARCHES, searchUrl, type FeedDoc } from "../src/geo/rss";

interface Env {
  ASSETS: Fetcher;
}

const TTL_S = 15 * 60;
const UA = "chokepoint-threat-globe (+https://github.com/Archymedes-Lab/chokepoint)";

const SOURCES: { kind: FeedDoc["kind"]; ref: string; url: string }[] = [
  ...SEARCHES.map(([q, m]) => ({ kind: "search" as const, ref: m, url: searchUrl(q, m) })),
  ...FEEDS.map((u) => ({ kind: "feed" as const, ref: u, url: u })),
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/feeds") {
      const cache = caches.default;
      const key = new Request(new URL("/api/feeds?v=2", url.origin).toString());
      const hit = await cache.match(key);
      if (hit) return hit;
      const docs = (await fetchAll()).filter((d): d is FeedDoc => d !== null);
      const body = JSON.stringify({ fetched: Date.now(), docs });
      // Only cache a usable bundle; an upstream outage must not stick for 15 minutes.
      const res = new Response(body, {
        headers: { "content-type": "application/json", "cache-control": docs.length ? `public, max-age=${TTL_S}` : "no-store" },
      });
      if (docs.length >= 3) ctx.waitUntil(cache.put(key, res.clone()));
      return res;
    }

    if (url.pathname === "/api/health") {
      const one = url.searchParams.get("i");
      if (one !== null) {
        // Probe a single source and report exactly what happened.
        const src = SOURCES[Number(one)];
        if (!src) return Response.json({ error: "no such source" }, { status: 404 });
        const t0 = Date.now();
        try {
          const r = await fetch(src.url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(25000) });
          const text = await r.text();
          return Response.json({ ref: src.ref, status: r.status, ms: Date.now() - t0, bytes: text.length, head: text.slice(0, 120) });
        } catch (e) {
          return Response.json({ ref: src.ref, ms: Date.now() - t0, error: String(e) });
        }
      }
      const t0 = Date.now();
      const docs = await fetchAll();
      return Response.json({
        ms: Date.now() - t0,
        ok: docs.filter(Boolean).length,
        total: SOURCES.length,
        sources: SOURCES.map((s, i) => ({ kind: s.kind, ref: s.ref, ok: Boolean(docs[i]), bytes: docs[i]?.xml.length ?? 0 })),
      });
    }

    return env.ASSETS.fetch(request);
  },
};

/** Workers allow 6 simultaneous outbound connections; run a pool of 6 so each
 *  timeout starts when its own fetch does, not while it waits in the queue. */
async function fetchAll(): Promise<(FeedDoc | null)[]> {
  const out: (FeedDoc | null)[] = new Array(SOURCES.length).fill(null);
  let next = 0;
  const lane = async () => {
    while (next < SOURCES.length) {
      const i = next++;
      out[i] = await fetchOne(SOURCES[i]);
    }
  };
  await Promise.all(Array.from({ length: 6 }, lane));
  return out;
}

async function fetchOne(s: (typeof SOURCES)[number]): Promise<FeedDoc | null> {
  try {
    const r = await fetch(s.url, {
      headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, text/xml, */*" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const xml = await r.text();
    return xml.includes("<item") || xml.includes("<entry") ? { kind: s.kind, ref: s.ref, xml } : null;
  } catch {
    return null;
  }
}
