/**
 * Turns raw news headlines into geolocated incidents: is this an attack,
 * what kind, where was the victim, and — if the press reported it — where
 * the attacker is said to be from. Pure functions, shared by the Cloudflare
 * Worker (server-side) and the browser fallback, and unit-tested.
 *
 * Deliberately conservative: an origin is only set when a headline names a
 * known group or uses explicit attribution language ("Iran-linked",
 * "Chinese hackers", "ties to Russia"). Everything is labelled as reported.
 */
import { PLACES, PLACE_BY_ISO, placeByCountryName, type Place } from "./gazetteer";
import { ACTORS, type Actor, type ActorKind } from "./actors";

export type AttackType = "ransomware" | "breach" | "ddos" | "espionage" | "fraud" | "disruption" | "other";

export interface RawArticle {
  title: string;
  url: string;
  source: string;
  country: string; // outlet / edition country, best-effort
  date: number;
  /** Feed description, when available — used only to locate the victim. */
  summary?: string;
}

export interface GeoPoint {
  name: string;
  iso2: string;
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  title: string;
  url: string;
  source: string;
  date: number; // earliest sighting
  type: AttackType;
  /** Where the harm landed. `approx` = only the reporting outlet's country was known. */
  victim: (GeoPoint & { approx: boolean }) | null;
  /** Reported attacker origin (press attribution, unverified). */
  origin: GeoPoint | null;
  actor: { name: string; kind: ActorKind } | null;
  /** How many outlets carried it — a proxy for significance. */
  coverage: number;
  sources: string[];
}

/* ------------------------------------------------------------------ text */

/** GDELT tokenises titles ("U . S .", "7 . 8", "Iran ' s"); undo that. */
export function cleanTitle(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+([,.:;?!%)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/\b([A-Z])\. (?=[A-Z]\b)/g, "$1.")
    .replace(/(\d)\. (\d)/g, "$1.$2")
    .replace(/(\d), (\d{3})\b/g, "$1,$2")
    .replace(/(\w)\. (com|org|net|io|co|gov|uk)\b/g, "$1.$2")
    .replace(/\s*'\s*(s|t|re|ve|ll|d)\b/g, "'$1")
    .replace(/\$ (\d)/g, "$$$1")
    .replace(/ ?- ?(linked|backed|based|sponsored|nexus|aligned)\b/g, "-$1")
    .trim();
}

const ATTACK =
  /\b(cyber ?attacks?|cyberattacks?|cyber-attacks?|hack(?:ed|ers?|ing|s)?|breach(?:ed|es)?|ransomware|ddos|data leaks?|leaked data|stolen data|intrusions?|malware|phishing|extortion|cyber ?espionage|spyware|wiper|cyber ?incident|cyber ?fraud|cyberfraud|cybercrim\w*|data theft|exfiltrat\w*|compromised)\b/i;
const NEGATED = /\bnot (a |caused by (a )?)?cyber ?-?attack|\bno (evidence of|sign of) (a )?cyber|\bruled out (a )?cyber/i;
// Not attack locations: advice, market/trend pieces, and enforcement or court
// stories (their place is where the case is heard, not where harm landed).
const NOISE =
  /^\d+ (ways|tips|things)\b|\bhow (to|can|do)\b|\bmistakes\b|\bwebinar\b|\bbest practices\b|\bnews in brief\b|\bbreach of (contract|trust|duty|ceasefire|the peace)\b|\bpodcast\b|\bstocks?\b.*\bbuy\b|\bwhat (companies|businesses|you) (can|should) do\b|\bhere'?s? how\b|\battack fears\b|\bfears of (a )?cyber|\bscammers love\b|\bquiz\b|\bQ[1-4]\b|\bsurvey\b|\bstudy (finds|shows)\b|\btrends?\b|\bforecast|\bpredictions?\b|\bmarket (size|share|growth)\b|\bwhitepaper\b|\brises? \d+%|\bdominat\w+ the\b|\blandscape\b|\bthreat report\b|\barrest(s|ed)?\b|\bsentenced\b|\bjailed\b|\bextradit\w+|\bpleads? guilty\b|\bpleaded guilty\b|\bface prison\b|\bindicted\b|\bcharged\b|\breleased on licen[cs]e\b|\bgranted bail\b|\bon trial\b|\bverdict\b/i;

export function isAttackHeadline(t: string): boolean {
  return ATTACK.test(t) && !NEGATED.test(t) && !NOISE.test(t);
}

export function classify(t: string, actorKind?: ActorKind): AttackType {
  if (/ransomware|extortion|\bransom\b/i.test(t)) return "ransomware";
  if (/\bddos\b|denial[- ]of[- ]service/i.test(t)) return "ddos";
  if (/espionage|\bspies\b|\bspying\b|\bspy\b|\bAPT ?\d+|state[- ](backed|sponsored)|intelligence agenc/i.test(t) || actorKind === "state")
    return "espionage";
  if (/fraud|scam|phishing|heist|stole \$|crypto theft|drained/i.test(t)) return "fraud";
  if (/breach|leak|exposed|stolen data|records|personal data|data of|exfiltrat|compromised/i.test(t)) return "breach";
  if (/outage|disrupt|offline|shut ?down|grounded|halted|paralys|paralyz/i.test(t)) return "disruption";
  return "other";
}

/* ----------------------------------------------------------- places/actors */

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Case-sensitive whole-word matchers: proper nouns are capitalised in headlines,
// which keeps "US" from matching "us" and "Polish" from matching "polish".
// One combined, case-sensitive, whole-word matcher for every place term — a
// single pass per headline instead of one regex per country. Proper nouns are
// capitalised in headlines, which keeps "US" from matching "us".
const TERM_PLACE = new Map<string, Place>();
for (const p of PLACES) for (const t of p.terms) if (!TERM_PLACE.has(t)) TERM_PLACE.set(t, p);
const PLACE_RE = new RegExp(
  `(?<![\\w.])(?:${[...TERM_PLACE.keys()].sort((x, y) => y.length - x.length).map(esc).join("|")})(?![\\w])`,
  "g",
);

interface Mention {
  place: Place;
  index: number;
  end: number;
}

export function placeMentions(t: string): Mention[] {
  const out: Mention[] = [];
  PLACE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLACE_RE.exec(t))) out.push({ place: TERM_PLACE.get(m[0])!, index: m.index, end: m.index + m[0].length });
  return out;
}

const ALIAS_ACTOR = new Map<string, Actor>();
for (const a of ACTORS) for (const al of a.aliases) ALIAS_ACTOR.set(al.toLowerCase(), a);
const ACTOR_RE = new RegExp(
  `(?<![\\w])(?:${[...ALIAS_ACTOR.keys()].sort((x, y) => y.length - x.length).map(esc).join("|")})(?![\\w])`,
  "i",
);

export function findActor(t: string): Actor | null {
  const m = ACTOR_RE.exec(t);
  return m ? (ALIAS_ACTOR.get(m[0].toLowerCase()) ?? null) : null;
}

// "<X>-linked", "<X> hackers", "<X> state-backed", "<X> link", "<X> ties"
const AFTER =
  /^(?:-(?:linked|backed|based|sponsored|nexus|aligned)|'s? (?:hackers|spies|intelligence)|\s+(?:state[- ]?(?:backed|sponsored)\s+)?(?:state |government |military |intelligence |cyber ?)?(?:hackers?|hacking (?:group|unit|campaign)s?|hacker groups?|cyber ?spies|spies|threat actors?|APTs?|cybercriminals|operatives|actors|gangs?|nexus|cyber ?army|hacktivists?)\b|\s+(?:link|links|ties)(?=\s*(?:$|[,.:;?!)]|(?:to|in|with|for|seen|suspected|probed|eyed)\b))|\s+(?:is |was |likely |widely )?(?:suspected|blamed|accused|behind)\b)/i;
// "ties to <X>", "linked to <X>", "blamed on <X>", "attributed to <X>", "by <X>"-hackers handled by AFTER
const BEFORE = /(?:ties to|tied to|links? to|linked to|blamed? on|blames|attributed to|traced to|backed by|accuses|accused) (?:the )?$/i;

export interface Attribution {
  origin: Place | null;
  actor: Actor | null;
  originMention: Mention | null;
}

export function attribution(t: string, mentions = placeMentions(t)): Attribution {
  const actor = findActor(t);
  for (const m of mentions) {
    const after = t.slice(m.end, m.end + 60);
    const before = t.slice(Math.max(0, m.index - 30), m.index);
    if (AFTER.test(after) || BEFORE.test(before)) return { origin: m.place, actor, originMention: m };
  }
  if (actor?.origin) return { origin: PLACE_BY_ISO[actor.origin] ?? null, actor, originMention: null };
  return { origin: null, actor, originMention: null };
}

/* -------------------------------------------------------------- clustering */

const STOP = new Set(
  "a an the of in on at to for and or by with from as is are was were be been after amid over into says said say report reports new its it this that us".split(
    " ",
  ),
);
function tokens(t: string): Set<string> {
  return new Set(
    t
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

function point(p: Place): GeoPoint {
  return { name: p.name, iso2: p.iso2, lat: p.lat, lng: p.lng };
}

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

// Proper nouns that identify a story ("CIA", "Gatwick", "Salt Typhoon") rather
// than the topic ("Cyberattack", "Report"). Two headlines sharing one of these
// and some vocabulary are the same incident told by different outlets.
const GENERIC = new Set(
  "cyberattack cyberattacks cyber attack attacks hack hacked hackers hacking breach breached breaches data report reports ransomware security cybersecurity system systems network says new amid after major government police city news update breaking exclusive warns warning million millions billion how what why who unclassified information agencies agency intelligence services users customers company companies firm group gang the ai ceo cto ciso it llm saas api vpn ddos sms ios ip ot ics scada crypto bitcoin fbi doj sec ftc cert csirt".split(
    " ",
  ),
);
const COUNTRYISH = new Set(
  PLACES.flatMap((p) => [p.name, ...p.terms])
    .filter((t) => !/^[A-Z]{3,}$/.test(t) || ["USA", "UAE", "PRC", "DPRK"].includes(t))
    .map((t) => t.toLowerCase()),
);
function properNouns(t: string): Set<string> {
  const out = new Set<string>();
  const words = t.match(/\b[A-Za-z][A-Za-z0-9&$]{3,}\b/g) ?? [];
  // In Title Case headlines every word is capitalised, so capitals carry no
  // signal: keep only acronyms (CIA, USDA) and mixed-case names (LaLiga).
  const titleCase = words.length > 3 && words.filter((w) => /^[A-Z]/.test(w)).length / words.length > 0.6;
  const pick = titleCase ? /\b(?:[A-Z]{2,}[A-Za-z0-9&$]*|[A-Z][a-z]+[A-Z][A-Za-z0-9]*)\b/g : /\b[A-Z][A-Za-z0-9&$]{2,}\b/g;
  for (const w of t.match(pick) ?? []) {
    const k = w.toLowerCase();
    if (!GENERIC.has(k) && !COUNTRYISH.has(k) && !STOP.has(k)) out.add(k);
  }
  return out;
}
function shares(a: Set<string>, b: Set<string>): boolean {
  for (const w of a) if (b.has(w)) return true;
  return false;
}

function vote<T>(xs: (T | null | undefined)[], key: (x: T) => string): T | null {
  const c = new Map<string, { x: T; n: number }>();
  for (const x of xs) if (x != null) {
    const k = key(x);
    const e = c.get(k);
    if (e) e.n++;
    else c.set(k, { x, n: 1 });
  }
  let best: { x: T; n: number } | null = null;
  for (const e of c.values()) if (!best || e.n > best.n) best = e;
  return best?.x ?? null;
}

/** Raw articles → de-duplicated, geolocated incidents, most-covered first.
 *
 *  1. Exact-title groups (syndication) collapse first, so copies can never be
 *     split across clusters.
 *  2. Distinct titles cluster when they share most vocabulary, a distinctive
 *     name ("CIA", "Gatwick") plus a little vocabulary, or the same named
 *     place plus a fair share of vocabulary.
 *  3. Victim, origin and type are decided by majority vote across every copy,
 *     so one odd headline can't flip the story.                              */
export function buildIncidents(raw: RawArticle[]): Incident[] {
  type Art = RawArticle & { title: string };
  type Group = { title: string; arts: Art[]; tok: Set<string>; pn: Set<string>; m: Mention[] };
  const groups = new Map<string, Group>();
  for (const a of raw) {
    const title = cleanTitle(a.title || "");
    if (!title) continue;
    const key = title.toLowerCase();
    const g = groups.get(key);
    if (g) {
      g.arts.push({ ...a, title });
      continue;
    }
    if (!isAttackHeadline(title)) continue;
    const tok = tokens(title);
    if (tok.size < 3) continue;
    groups.set(key, { title, arts: [{ ...a, title }], tok, pn: properNouns(title), m: placeMentions(title) });
  }

  type Cluster = { groups: Group[]; tok: Set<string>; pn: Set<string>; places: Set<string> };
  const clusters: Cluster[] = [];
  // Most-covered titles seed clusters first, so the strongest variant anchors a story.
  for (const g of [...groups.values()].sort((x, y) => y.arts.length - x.arts.length)) {
    const hit = clusters.find((c) => {
      const j = jaccard(c.tok, g.tok);
      return (
        j >= 0.5 ||
        (j >= 0.06 && shares(c.pn, g.pn)) ||
        (j >= 0.3 && g.m.some((m) => c.places.has(m.place.iso2)))
      );
    });
    const places = g.m.map((m) => m.place.iso2);
    if (hit) {
      hit.groups.push(g);
      for (const w of g.pn) hit.pn.add(w);
      for (const p of places) hit.places.add(p);
    } else clusters.push({ groups: [g], tok: g.tok, pn: new Set(g.pn), places: new Set(places) });
  }

  const out: Incident[] = [];
  for (const c of clusters) {
    // Every article, with its group's (shared) parse.
    const arts = c.groups.flatMap((g) => g.arts.map((a) => ({ a, g })));
    const attrs = arts.map(({ g }) => attribution(g.title, g.m));
    const origin = vote(attrs.map((x) => x.origin), (p) => p.iso2);
    const actor = vote(attrs.map((x) => x.actor), (x) => x.name);
    const victimPlace = vote(
      arts.map(({ g }) => g.m.find((m) => m.place.iso2 !== origin?.iso2)?.place ?? null),
      (p) => p.iso2,
    );
    let victim: Incident["victim"] = victimPlace ? { ...point(victimPlace), approx: false } : null;
    if (!victim) {
      // The headline names no place: try the articles' own summaries.
      const p = vote(
        arts.map(({ a }) => (a.summary ? placeMentions(a.summary).find((m) => m.place.iso2 !== origin?.iso2)?.place ?? null : null)),
        (x) => x.iso2,
      );
      if (p) victim = { ...point(p), approx: false };
    }
    if (!victim) {
      // Fall back to the most common outlet country — flagged as approximate.
      const p = vote(arts.map(({ a }) => (a.country ? placeByCountryName(a.country) ?? null : null)), (x) => x.iso2);
      if (p && p.iso2 !== origin?.iso2) victim = { ...point(p), approx: true };
    }
    const type = vote(arts.map(({ g }) => classify(g.title, actor?.kind)), (t) => t) ?? "other";

    // Lead headline: the most-copied variant, preferring one that names a place.
    const lead = c.groups.slice().sort((x, y) => Math.sign(y.m.length) - Math.sign(x.m.length) || y.arts.length - x.arts.length)[0];
    const sources = [...new Set(arts.map(({ a }) => a.source).filter(Boolean))];
    out.push({
      id: hash(lead.title),
      title: lead.title,
      url: lead.arts[0].url,
      source: lead.arts[0].source,
      date: Math.min(...arts.map(({ a }) => a.date || Infinity)),
      type,
      victim,
      origin: origin ? point(origin) : null,
      actor: actor ? { name: actor.name, kind: actor.kind } : null,
      coverage: Math.max(sources.length, 1),
      sources: sources.slice(0, 8),
    });
  }
  return out.sort((x, y) => y.coverage - x.coverage || y.date - x.date);
}
