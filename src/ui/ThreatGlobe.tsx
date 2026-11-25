/**
 * Threat Globe — a 3D world of cyber attacks reported in real newspapers over
 * the last 7 days. Victims glow where the harm landed; arcs trace back to the
 * attacker origin *as reported by the press* (unverified). Data: Bing News +
 * newspaper and security-newsroom RSS via the Worker's /api/feeds, processed in a Web Worker
 * (see worker/app.ts, src/geo/).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeInstance } from "globe.gl";
import { MeshPhongMaterial, Color } from "three";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import countriesTopo from "world-atlas/countries-110m.json";
import { loadIncidents, type IncidentFeed } from "../geo/source";
import type { AttackType, Incident } from "../geo/extract";
import { Switch, ToggleGroup, ToggleItem, Explainer, Info } from "./radix";
import { HBar } from "./components";

export const TYPE_META: Record<AttackType, { label: string; color: string }> = {
  ransomware: { label: "Ransomware", color: "#ff4d5e" },
  breach: { label: "Data breach", color: "#ffb547" },
  espionage: { label: "Espionage", color: "#2ee6a8" },
  ddos: { label: "DDoS", color: "#4fd8ff" },
  fraud: { label: "Fraud / theft", color: "#ff6ad5" },
  disruption: { label: "Disruption", color: "#ff8a3d" },
  other: { label: "Other attack", color: "#9aa7bd" },
};
const TYPES = Object.keys(TYPE_META) as AttackType[];
const ORIGIN = "#b18cff";
const LAND = "rgba(110, 200, 255, 0.34)";
const REFRESH_MS = 10 * 60e3;

type Window = "24h" | "72h" | "7d";
const WINDOW_MS: Record<Window, number> = { "24h": 24 * 3600e3, "72h": 72 * 3600e3, "7d": 7 * 24 * 3600e3 };

interface VictimPt {
  inc: Incident;
  lat: number;
  lng: number;
  color: string;
}
interface Arc {
  inc: Incident;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
}

type Ring = [number, number][];
type CountryFeature = { properties: { name: string }; geometry: { type: string; coordinates: Ring[] | Ring[][] } };

/** world-atlas 110m contains zero-area slivers (e.g. one North Korea polygon is
 *  four identical points) that make H3's hexagon fill throw; drop them. */
function sane(poly: Ring[]): boolean {
  return new Set(poly[0].map(([x, y]) => `${x},${y}`)).size >= 3;
}
const countries = {
  features: (
    feature(
      countriesTopo as unknown as Topology,
      (countriesTopo as unknown as Topology).objects.countries as GeometryCollection,
    ) as unknown as { features: CountryFeature[] }
  ).features.map((f) =>
    f.geometry.type === "MultiPolygon"
      ? { ...f, geometry: { ...f.geometry, coordinates: (f.geometry.coordinates as Ring[][]).filter(sane) } }
      : f,
  ),
};

export default function ThreatGlobe() {
  const [feed, setFeed] = useState<IncidentFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<Set<AttackType>>(() => new Set(TYPES));
  const [win, setWin] = useState<Window>("7d");
  const [arcs, setArcs] = useState(true);
  const [approx, setApprox] = useState(true);
  const [spin, setSpin] = useState(true);
  const [sort, setSort] = useState<"coverage" | "recent">("coverage");
  const [selected, setSelected] = useState<string | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    try {
      setFeed(await loadIncidents(force));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // ------------------------------------------------------------ filtering
  const visible = useMemo(() => {
    if (!feed) return [];
    const newest = Math.max(...feed.incidents.map((i) => i.date), Date.now());
    return feed.incidents.filter(
      (i) => types.has(i.type) && newest - i.date <= WINDOW_MS[win] && (approx || !i.victim?.approx),
    );
  }, [feed, types, win, approx]);

  const list = useMemo(
    () => visible.slice().sort((a, b) => (sort === "recent" ? b.date - a.date : b.coverage - a.coverage || b.date - a.date)),
    [visible, sort],
  );
  const sel = visible.find((i) => i.id === selected) ?? null;

  const stats = useMemo(() => {
    const hit = new Map<string, number>();
    const from = new Map<string, number>();
    const groups = new Map<string, { n: number; kind: string }>();
    for (const i of visible) {
      if (i.victim) hit.set(i.victim.name, (hit.get(i.victim.name) ?? 0) + 1);
      if (i.origin) from.set(i.origin.name, (from.get(i.origin.name) ?? 0) + 1);
      if (i.actor) groups.set(i.actor.name, { n: (groups.get(i.actor.name)?.n ?? 0) + 1, kind: i.actor.kind });
    }
    const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
    return {
      hit: top(hit),
      from: top(from),
      groups: [...groups.entries()].sort((a, b) => b[1].n - a[1].n),
      attributed: visible.filter((i) => i.origin).length,
      byType: TYPES.map((t) => [t, visible.filter((i) => i.type === t).length] as const),
    };
  }, [visible]);

  // ------------------------------------------------------------ globe
  const hostRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const g = new Globe(host, { animateIn: true })
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#3fb8ff")
      .atmosphereAltitude(0.2)
      .globeMaterial(
        new MeshPhongMaterial({ color: new Color("#071019"), emissive: new Color("#04121f"), emissiveIntensity: 0.6, shininess: 8 }),
      )
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.55)
      .hexPolygonUseDots(true)
      .hexPolygonAltitude(0.004)
      .hexPolygonColor(() => LAND)
      // victims: glowing pillars
      .pointLat("lat")
      .pointLng("lng")
      .pointColor("color")
      .pointAltitude((d) => 0.015 + Math.min(0.2, Math.log2(1 + (d as VictimPt).inc.coverage) * 0.03))
      .pointRadius(0.22)
      .pointResolution(8)
      .pointsMerge(false)
      .pointLabel((d) => tooltip((d as VictimPt).inc))
      .onPointClick((d) => setSelected((d as VictimPt).inc.id))
      // pulses at victims
      .ringLat("lat")
      .ringLng("lng")
      .ringColor((d: object) => (t: number) => fade((d as VictimPt).color, 1 - t))
      .ringMaxRadius(3.2)
      .ringPropagationSpeed(1.6)
      .ringRepeatPeriod(1400)
      // attribution arcs
      .arcStartLat("startLat")
      .arcStartLng("startLng")
      .arcEndLat("endLat")
      .arcEndLng("endLng")
      .arcColor("color")
      .arcAltitudeAutoScale(0.42)
      .arcStroke(0.45)
      .arcDashLength(0.45)
      .arcDashGap(0.18)
      .arcDashInitialGap(() => Math.random())
      .arcDashAnimateTime(2600)
      .arcLabel((d) => tooltip((d as Arc).inc))
      .onArcClick((d) => setSelected((d as Arc).inc.id))
      .pointOfView({ lat: 25, lng: 10, altitude: 2.3 });

    const ctl = g.controls();
    ctl.autoRotate = true;
    ctl.autoRotateSpeed = 0.35;
    ctl.enableDamping = true;
    ctl.minDistance = 140;
    ctl.maxDistance = 600;
    globeRef.current = g;

    const size = () => g.width(host.clientWidth).height(host.clientHeight);
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);
    return () => {
      ro.disconnect();
      g._destructor();
      host.innerHTML = "";
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const c = globeRef.current?.controls();
    if (c) c.autoRotate = spin && !sel;
  }, [spin, sel]);

  // Push data to the globe whenever the filtered set changes.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const pts = spread(visible);
    const victimCountries = new Map<string, string>();
    for (const p of pts) if (!victimCountries.has(p.inc.victim!.name)) victimCountries.set(p.inc.victim!.name, p.color);
    const originCountries = new Set(visible.map((i) => i.origin?.name).filter(Boolean) as string[]);
    g.pointsData(pts)
      .ringsData(pts.filter((p) => p.inc.coverage >= 2 || pts.length < 25))
      .hexPolygonColor((f) => {
        const n = (f as { properties: { name: string } }).properties.name;
        if (victimCountries.has(n)) return fade(victimCountries.get(n)!, 0.7);
        if (originCountries.has(n)) return fade(ORIGIN, 0.75);
        return LAND;
      })
      .arcsData(
        arcs
          ? visible
              .filter((i) => i.origin && i.victim)
              .map((i) => ({
                inc: i,
                startLat: i.origin!.lat,
                startLng: i.origin!.lng,
                endLat: i.victim!.lat,
                endLng: i.victim!.lng,
                color: [fade(ORIGIN, 0.95), fade(TYPE_META[i.type].color, 0.95)] as [string, string],
              }))
          : [],
      );
  }, [visible, arcs]);

  // Fly to the selection.
  useEffect(() => {
    const g = globeRef.current;
    if (g && sel?.victim) g.pointOfView({ lat: sel.victim.lat - 8, lng: sel.victim.lng, altitude: 1.6 }, 1200);
  }, [sel?.id]);

  const toggleType = (t: AttackType) =>
    setTypes((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n.size ? n : new Set(TYPES);
    });

  const maxHit = Math.max(1, ...stats.hit.map((x) => x[1]));
  const maxFrom = Math.max(1, ...stats.from.map((x) => x[1]));

  return (
    <div className="eco globe-view">
      {/* ---------------------------------------------------- left: filters + summary */}
      <aside className="eco-side eco-left" aria-label="Filters and summary">
        <div className="side-hd">
          <h2>Threat Globe</h2>
          <span className="sub">real reported attacks</span>
        </div>
        <div className="side-scroll">
          <div className={`feed-status ${feed?.status ?? ""}`}>
            <div className="fs-row">
              <span className="fs-dot" />
              <b>{loading && !feed ? "Loading…" : loading ? "Refreshing…" : feed?.status === "live" ? "Live" : "Offline sample"}</b>
              <span className="cpanel-spacer" />
              <button className="icon-btn wire-btn" onClick={() => load(true)} disabled={loading} aria-label="Refresh data">
                ↻
              </button>
            </div>
            {feed && <div className="fs-via">{feed.via}</div>}
            {feed && (
              <div className="hint">
                {feed.articles.toLocaleString()} articles from {feed.sources} feeds → {feed.incidents.length} distinct incidents · fetched {ago(feed.updated)}
              </div>
            )}
            {feed?.status === "offline" && (
              <div className="hint" style={{ color: "var(--warn)" }}>Live sources unreachable — illustrative sample shown.</div>
            )}
          </div>

          <div className="panel pad">
            <div className="group-lbl">Time window</div>
            <ToggleGroup aria-label="Time window" value={win} onValueChange={(v) => setWin(v as Window)}>
              <ToggleItem value="24h">24h</ToggleItem>
              <ToggleItem value="72h">72h</ToggleItem>
              <ToggleItem value="7d">7 days</ToggleItem>
            </ToggleGroup>

            <div className="group-lbl">Attack type</div>
            <div className="type-chips">
              {stats.byType.map(([t, n]) => (
                <button
                  key={t}
                  className={`type-chip ${types.has(t) ? "on" : ""}`}
                  onClick={() => toggleType(t)}
                  aria-pressed={types.has(t)}
                >
                  <i style={{ background: TYPE_META[t].color }} />
                  {TYPE_META[t].label}
                  <span>{n}</span>
                </button>
              ))}
            </div>

            <div className="group-lbl">Display</div>
            <label className="switch-row">
              <span>Attribution arcs</span>
              <Switch checked={arcs} onCheckedChange={setArcs} aria-label="Attribution arcs" />
            </label>
            <label className="switch-row">
              <span>
                Approximate locations <Info>When a headline names no country, the incident is placed at the reporting outlet's country. Marked "≈".</Info>
              </span>
              <Switch checked={approx} onCheckedChange={setApprox} aria-label="Approximate locations" />
            </label>
            <label className="switch-row">
              <span>Auto-rotate</span>
              <Switch checked={spin} onCheckedChange={setSpin} aria-label="Auto-rotate" />
            </label>
          </div>

          <div className="panel pad">
            <div className="group-lbl">Most targeted <span>incidents</span></div>
            {stats.hit.slice(0, 8).map(([n, c]) => (
              <HBar key={n} label={short(n)} pct={(c / maxHit) * 100} color="var(--harm)" num={String(c)} />
            ))}
            {!stats.hit.length && <div className="empty">No incidents in this filter.</div>}
            <div className="group-lbl">Reported origin <span>press attribution</span></div>
            {stats.from.slice(0, 6).map(([n, c]) => (
              <HBar key={n} label={short(n)} pct={(c / maxFrom) * 100} color={ORIGIN} num={String(c)} />
            ))}
            {!stats.from.length && <div className="empty">No attributed incidents in this filter.</div>}
            {stats.groups.length > 0 && (
              <>
                <div className="group-lbl">Named groups</div>
                <div className="group-tags">
                  {stats.groups.map(([n, g]) => (
                    <span key={n} className={`gtag k-${g.kind}`}>
                      {n} <b>{g.n}</b>
                    </span>
                  ))}
                </div>
              </>
            )}
            <Explainer label="About this data">
              Headlines come from <b>Bing News</b> searches across regional markets (thousands of newspapers), the
              security sections of newspapers such as the Guardian, NYT, BBC and Times of India, and established
              security newsrooms — fetched about every 15 minutes, last 7 days. Copies of the
              same story are merged into one incident; <b>coverage</b> counts the outlets that carried it. The{" "}
              <b>victim</b> is the country (or well-known organisation's home country) the headlines name; when none is
              named in headlines or summaries, a regional market's country is used and marked "≈". The <b>origin</b> is only set when the press
              explicitly attributes it ("Iran-linked", "Chinese hackers") or names a group with a publicly reported
              origin, decided by majority vote across all copies. Attribution here is <b>reported, not verified</b>.
              Stories that name no place are listed but not mapped.
            </Explainer>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- centre: globe */}
      <section className="eco-center" aria-label="Globe">
        <div className="kpis" role="group" aria-label="Globe headline metrics">
          <Kpi label="Incidents" value={String(visible.length)} tone="attacker" hint={`last ${win === "7d" ? "7 days" : win}`} />
          <Kpi label="Countries hit" value={String(stats.hit.length)} tone="attacker" hint="victim locations" />
          <Kpi
            label="Attributed"
            value={visible.length ? `${Math.round((stats.attributed / visible.length) * 100)}%` : "—"}
            tone="gov"
            hint="origin reported by press"
          />
          <Kpi label="Most targeted" value={stats.hit[0] ? short(stats.hit[0][0]) : "—"} tone="attacker" hint={stats.hit[0] ? `${stats.hit[0][1]} incidents` : " "} />
          <Kpi label="Top reported origin" value={stats.from[0] ? short(stats.from[0][0]) : "—"} tone="origin" hint={stats.from[0] ? `${stats.from[0][1]} incidents` : " "} />
        </div>

        <div className="globe-stage">
          <div ref={hostRef} className="globe-host" aria-label="3D globe of reported cyber attacks. Drag to rotate, scroll to zoom, click a marker for details." />
          <div className="globe-hud tl">
            <span className="hud-tag">Reported cyber attacks · live</span>
            <span className="hud-big">{visible.length}</span>
          </div>
          <div className="globe-legend">
            <span><i className="lg-pillar" /> Victim (height = coverage)</span>
            <span><i className="lg-arc" /> Reported origin → victim</span>
            <span><i className="lg-dot" style={{ background: ORIGIN }} /> Origin country</span>
          </div>
          {loading && !feed && <div className="globe-loading">Pulling newspapers…</div>}
          <div className="globe-hint">Drag to rotate · scroll to zoom · click a marker</div>
        </div>
      </section>

      {/* ---------------------------------------------------- right: incident list */}
      <aside className="eco-side eco-right" aria-label="Incidents">
        <div className="side-hd">
          <h2>Incidents</h2>
          <span className="sub">{list.length} shown</span>
          <span className="cpanel-spacer" />
          <ToggleGroup aria-label="Sort" value={sort} onValueChange={(v) => setSort(v as "coverage" | "recent")}>
            <ToggleItem value="coverage">Top</ToggleItem>
            <ToggleItem value="recent">Latest</ToggleItem>
          </ToggleGroup>
        </div>
        <div className="side-scroll">
          {sel && <IncidentDetail inc={sel} onClose={() => setSelected(null)} />}
          <div className="inc-list" role="list">
            {list.map((i) => (
              <button
                key={i.id}
                role="listitem"
                className={`inc-row ${i.id === selected ? "sel" : ""}`}
                onClick={() => setSelected(i.id === selected ? null : i.id)}
              >
                <span className="inc-type" style={{ background: TYPE_META[i.type].color }} title={TYPE_META[i.type].label} />
                <span className="inc-main">
                  <span className="inc-title">{i.title}</span>
                  <span className="inc-meta">
                    <span className="inc-geo">
                      {i.victim ? `${i.victim.approx ? "≈ " : ""}${short(i.victim.name)}` : "Unplaced"}
                      {i.origin && <span className="inc-origin"> ← {short(i.origin.name)}</span>}
                    </span>
                    <span>{ago(i.date)}</span>
                    {i.coverage > 1 && <span className="inc-cov">{i.coverage} outlets</span>}
                  </span>
                </span>
              </button>
            ))}
            {!list.length && !loading && <div className="empty">No incidents match these filters.</div>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function IncidentDetail({ inc, onClose }: { inc: Incident; onClose: () => void }) {
  return (
    <section className="inc-detail" aria-live="polite">
      <div className="inc-detail-hd">
        <span className="inc-badge" style={{ color: TYPE_META[inc.type].color, borderColor: TYPE_META[inc.type].color }}>
          {TYPE_META[inc.type].label}
        </span>
        <span className="cpanel-spacer" />
        <button className="icon-btn wire-btn" onClick={onClose} aria-label="Close incident">
          ✕
        </button>
      </div>
      <div className="inc-detail-title">{inc.title}</div>
      <dl className="inc-facts">
        <dt>Victim</dt>
        <dd>{inc.victim ? `${inc.victim.name}${inc.victim.approx ? " (approx. — outlet country)" : ""}` : "Not placed"}</dd>
        <dt>Reported origin</dt>
        <dd>{inc.origin ? inc.origin.name : <span className="muted">Not attributed in coverage</span>}</dd>
        {inc.actor && (
          <>
            <dt>Named group</dt>
            <dd>
              {inc.actor.name} <span className="muted">· {inc.actor.kind}</span>
            </dd>
          </>
        )}
        <dt>First seen</dt>
        <dd>{new Date(inc.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</dd>
        <dt>Coverage</dt>
        <dd>
          {inc.coverage} outlet{inc.coverage === 1 ? "" : "s"}
          {inc.sources.length > 0 && <span className="muted"> · {inc.sources.slice(0, 4).join(", ")}</span>}
        </dd>
      </dl>
      {inc.url && (
        <a className="btn inc-link" href={inc.url} target="_blank" rel="noopener noreferrer">
          Read the report ↗
        </a>
      )}
    </section>
  );
}

function Kpi({ label, value, tone, hint }: { label: string; value: string; tone: string; hint: string }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val">{value}</div>
      <div className="kpi-hint">{hint}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

/** Spread incidents in the same country on a small golden-angle spiral. */
function spread(incs: Incident[]): VictimPt[] {
  const k = new Map<string, number>();
  return incs
    .filter((i) => i.victim)
    .map((inc) => {
      const v = inc.victim!;
      const n = k.get(v.iso2) ?? 0;
      k.set(v.iso2, n + 1);
      const r = n === 0 ? 0 : 1.5 * Math.sqrt(n);
      const a = n * 2.39996;
      return { inc, lat: v.lat + r * Math.sin(a), lng: v.lng + (r * Math.cos(a)) / Math.max(0.3, Math.cos((v.lat * Math.PI) / 180)), color: TYPE_META[inc.type].color };
    });
}

function fade(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

const SHORT: Record<string, string> = {
  "United States of America": "United States",
  "United Kingdom": "UK",
  "United Arab Emirates": "UAE",
};
function short(n: string): string {
  return SHORT[n] ?? n;
}

function ago(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 90) return "just now";
  const m = s / 60;
  if (m < 90) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 36) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function tooltip(i: Incident): string {
  const where = i.victim ? `${i.victim.approx ? "≈ " : ""}${short(i.victim.name)}` : "";
  const from = i.origin ? ` ← ${short(i.origin.name)} (reported)` : "";
  return `<div class="globe-tip"><div class="gt-type" style="color:${TYPE_META[i.type].color}">${TYPE_META[i.type].label}</div><div class="gt-title">${escapeHtml(i.title)}</div><div class="gt-meta">${escapeHtml(where + from)} · ${i.coverage} outlet${i.coverage === 1 ? "" : "s"}</div></div>`;
}
