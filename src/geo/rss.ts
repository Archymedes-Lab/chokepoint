/**
 * Minimal RSS/Atom parsing (no DOMParser — runs in Web Workers and Cloudflare
 * Workers alike) and the feed list the Threat Globe draws from.
 */
import { cleanTitle, type RawArticle } from "./extract";
import { PLACE_BY_ISO } from "./gazetteer";

/** Bing News RSS searches: keyless, aggregates thousands of newspapers, and
 *  — unlike Google News — answers requests from Cloudflare's network. Several
 *  market editions widen the lens beyond US outlets. [query, market ISO-2] */
export const SEARCHES: [query: string, market: string][] = [
  ["cyberattack", "US"],
  ["ransomware", "US"],
  ['"data breach"', "US"],
  ["hackers", "US"],
  ['"state-sponsored" hackers', "US"],
  ["DDoS attack", "US"],
  ["cyberattack", "GB"],
  ["ransomware", "GB"],
  ['"data breach"', "GB"],
  ["cyber attack", "IN"],
  ["data breach", "IN"],
  ["cyberattack", "AU"],
  ["ransomware", "AU"],
  ["cyberattack", "CA"],
  ["ransomware", "CA"],
  ["cyber attack", "ZA"],
  ["cyberattack", "SG"],
  ["cyberattack", "NZ"],
  ["cyberattack", "IE"],
  ["cyberattack", "PH"],
  ["cyber attack", "MY"],
  ["cyber attack", "ID"],
];

/** Newspaper security sections and established security newsrooms — the
 *  ones that serve Cloudflare's network (probed from production). */
export const FEEDS: string[] = [
  "https://www.theguardian.com/technology/data-computer-security/rss",
  "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  "https://feeds.bbci.co.uk/news/technology/rss.xml",
  "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
  "https://techcrunch.com/category/security/feed/",
  "https://www.wired.com/feed/category/security/latest/rss",
  "https://arstechnica.com/security/feed/",
  "https://www.zdnet.com/topic/security/rss.xml",
  "https://www.infosecurity-magazine.com/rss/news/",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://www.darkreading.com/rss.xml",
  "https://www.theregister.com/security/headlines.atom",
  "https://www.securityweek.com/feed/",
  "https://therecord.media/feed",
  "https://databreaches.net/feed/",
  "https://krebsonsecurity.com/feed/",
  "https://cyberscoop.com/feed/",
  "https://www.cybersecuritydive.com/feeds/news/",
  "https://www.csoonline.com/feed/",
  "https://www.helpnetsecurity.com/feed/",
];

export function searchUrl(q: string, market: string): string {
  return `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&mkt=en-${market}`;
}

/** One fetched feed as the proxy returns it. */
export interface FeedDoc {
  kind: "search" | "feed";
  /** Search market (ISO-2) or the feed URL. */
  ref: string;
  xml: string;
}

export function parseFeed(doc: FeedDoc): RawArticle[] {
  if (doc.kind === "search") {
    // Non-US markets lean local: use the market as an *approximate* victim
    // location when nothing in the story names a country (flagged "≈").
    const market = doc.ref !== "US" ? (PLACE_BY_ISO[doc.ref]?.name ?? "") : "";
    return items(doc.xml).map((it) => ({
      title: cleanTitle(tag(it, "title")),
      url: unwrapBing(tag(it, "link")),
      source: tag(it, "News:Source"),
      country: market,
      date: Date.parse(tag(it, "pubDate")) || 0,
      summary: tag(it, "description"),
    }));
  }
  const source = hostOf(doc.ref).replace(/^feeds\.feedburner\.com$/, "thehackernews.com");
  return items(doc.xml).map((it) => ({
    title: cleanTitle(tag(it, "title")),
    url: tag(it, "link") || attr(it, "link", "href"),
    source,
    country: "",
    date: Date.parse(tag(it, "pubDate") || tag(it, "published") || tag(it, "updated") || tag(it, "dc:date")) || 0,
    summary: (tag(it, "description") || tag(it, "summary")).slice(0, 400),
  }));
}

/** Bing wraps article links in a click-tracking redirect; recover the real URL. */
function unwrapBing(u: string): string {
  try {
    const real = new URL(u).searchParams.get("url");
    return real && /^https?:\/\//.test(real) ? real : u;
  } catch {
    return u;
  }
}

/** Drop stale and duplicate articles (same URL or exact same title from the same outlet). */
export function dedupe(raw: RawArticle[], maxAgeMs = 7 * 864e5): RawArticle[] {
  const since = Date.now() - maxAgeMs;
  const seen = new Set<string>();
  return raw.filter((a) => {
    if (!a.title || a.date < since) return false;
    const k = a.url || `${a.source}|${a.title.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function items(xml: string): string[] {
  return xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? [];
}
function tag(xml: string, name: string): string {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decode(m[1]) : "";
}
function attr(xml: string, name: string, a: string): string {
  const m = new RegExp(`<${name}\\s[^>]*${a}="([^"]+)"`).exec(xml);
  return m ? decode(m[1]) : "";
}
function decode(s: string): string {
  return s
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&[lr]dquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}
function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
