/**
 * Chokepoint news proxy — a tiny Cloudflare Worker that serves the Live Threat
 * Wire with real worldwide cyber-incident headlines, while keeping any API key
 * as a server-side secret (never in the client or the repo). It caches results
 * for 10 minutes to respect upstream rate limits, and sets permissive CORS so a
 * static Chokepoint build can call it from the browser.
 *
 * Deploy: see worker/README.md. Source of truth for the feed shape is
 * src/news/types.ts (NewsItem).
 */
export default {
  async fetch(request, env, ctx) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const q =
      url.searchParams.get("q") ||
      '(ransomware OR "cyber attack" OR cyberattack OR "data breach" OR "cyber incident")';
    const n = Math.min(30, parseInt(url.searchParams.get("n") || "14", 10) || 14);

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    let items = [];
    let via = "none";
    try {
      if (env.EXA_API_KEY) {
        items = await fromExa(q, n, env.EXA_API_KEY);
        via = "exa";
      } else {
        items = await fromGdelt(q, n);
        via = "gdelt";
      }
    } catch (e) {
      return json({ items: [], error: String(e && e.message ? e.message : e) }, 200, cors);
    }

    const res = json({ items, via }, 200, { ...cors, "Cache-Control": "public, max-age=600" });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};

async function fromExa(q, n, key) {
  const since = new Date(Date.now() - 5 * 864e5).toISOString();
  const r = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "x-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      query: q,
      numResults: n,
      type: "auto",
      category: "news",
      startPublishedDate: since,
    }),
  });
  if (!r.ok) throw new Error("exa " + r.status);
  const d = await r.json();
  return (d.results || []).map((x) => ({
    title: x.title || "",
    url: x.url || "",
    source: domainOf(x.url),
    country: "",
    date: Date.parse(x.publishedDate || "") || Date.now(),
  }));
}

async function fromGdelt(q, n) {
  const u =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(q) +
    "&mode=artlist&format=json&maxrecords=" +
    n +
    "&sort=datedesc&timespan=5d";
  const r = await fetch(u);
  if (!r.ok) throw new Error("gdelt " + r.status);
  const d = await r.json();
  return (d.articles || []).map((a) => ({
    title: a.title || "",
    url: a.url || "",
    source: a.domain || "",
    country: a.sourcecountry || "",
    date: gdeltDate(a.seendate),
  }));
}

function domainOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function gdeltDate(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(s || "");
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : Date.now();
}
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}
