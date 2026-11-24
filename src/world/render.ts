import { MOTIVATIONS } from "./psychology";
import type { World } from "./model";
import type { Agent } from "./types";

/**
 * Pixel-art renderer for the ecosystem, built around a clear visual taxonomy so
 * the map *means* something at a glance (see the in-app Map Key):
 *
 *   • TARGETS      faint outlined squares (infrastructure); they glow red as
 *                  they take damage, so harm is legible as a field.
 *   • OFFENDERS    small dots. Ambient (roaming) offenders are dim; an offender
 *                  actively attacking is bright with a white core — so your eye
 *                  catches the attacks in progress, not the noise.
 *   • DEFENDERS    sky rings with a white core (distinct shape), with a line to
 *                  the offender they are pursuing.
 *   • EVENTS       transient expanding glyphs: breach (red), arrest (sky),
 *                  takedown (amber), patch (green).
 *
 * The "colour by" lens recolours offenders by motivation, by activity, or by
 * heat without changing the taxonomy.
 */
export type ColorBy = "motivation" | "activity" | "heat" | "jurisdiction";

export interface ViewState {
  selectedId: number | null;
  colorBy: ColorBy;
}

const DEF = "#38bdf8"; // reserved defender / SOC colour
const ACTIVITY: Record<string, string> = {
  operate: "#ef4444", // attacking
  travel: "#f59e0b", // approaching a target
  seek: "#64748b", // choosing a target
  cash: "#eab308", // cashing out
  lay_low: "#475569", // deterred, lying low
};
const PULSE: Record<string, string> = {
  breach: "#ef4444",
  arrest: DEF,
  takedown: "#f59e0b",
  patch: "#22c55e",
};

export const JURISDICTION_COLORS = {
  domestic: "#34d399", // reachable
  partner: "#f59e0b", // reachable with cooperation
  haven: "#ef4444", // non-cooperating
  shielded: "#b91c1c", // controlled impunity
} as const;

function agentColor(a: Agent, mode: ColorBy): string {
  if (mode === "activity") return ACTIVITY[a.state] ?? "#64748b";
  if (mode === "heat") return heatColor(a.heat);
  if (mode === "jurisdiction")
    return a.shielded ? JURISDICTION_COLORS.shielded : JURISDICTION_COLORS[a.jurisdiction];
  return MOTIVATIONS[a.mot].color;
}

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, view: ViewState) {
  const W = w.cfg.width;
  const H = w.cfg.height;
  const dark = isDark();

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = dark ? "#0a0a0b" : "#f3f3f5";
  ctx.fillRect(0, 0, W, H);

  // faint tile grid
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.028)" : "rgba(0,0,0,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }

  // ---- districts (economic-health field) ----
  for (const s of w.sectors) {
    const r = s.region;
    const rx = r.x * W;
    const ry = r.y * H;
    const rw = r.w * W;
    const rh = r.h * H;
    const health = s.economy / 100;
    ctx.fillStyle = hexA(s.color, 0.06 + 0.05 * (1 - health));
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = hexA(s.color, 0.45);
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    if (health < 0.85) {
      ctx.fillStyle = hexA("#ef4444", (1 - health) * 0.16);
      ctx.fillRect(rx, ry, rw, rh);
    }

    // ---- targets: faint outlines; glow red as damaged ----
    for (const n of s.nodes) {
      const sz = Math.round(4 + Math.min(5, n.value / 110_000));
      const half = sz >> 1;
      const x = Math.round(n.x) - half;
      const y = Math.round(n.y) - half;
      const dmg = 1 - n.health;
      // outline (the building)
      ctx.strokeStyle = hexA(s.color, n.cooldown > 0 ? 0.65 : 0.4);
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
      // damage fill
      if (dmg > 0.02) {
        ctx.fillStyle = hexA("#ef4444", Math.min(0.92, dmg));
        ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
      }
      // defence pip (hardened node)
      if (n.defense > 0.1) {
        ctx.fillStyle = DEF;
        ctx.fillRect(x, y - 2, Math.max(1, Math.round(sz * Math.min(1, n.defense * 1.6))), 1);
      }
    }

    // district labels
    ctx.fillStyle = dark ? "rgba(236,236,240,0.82)" : "rgba(20,20,24,0.8)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(s.name.toUpperCase(), rx + 5, ry + 4);
    ctx.fillStyle = hexA(health > 0.7 ? "#22c55e" : health > 0.4 ? "#f59e0b" : "#ef4444", 0.95);
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText(`${Math.round(s.economy)}%`, rx + 5, ry + 17);
  }

  // ---- offenders: ambient dim, active bright ----
  for (const a of w.agents) {
    if (a.state === "jailed" || a.state === "desisted") continue;
    const col = agentColor(a, view.colorBy);
    const active = a.state === "operate";
    const x = Math.round(a.x);
    const y = Math.round(a.y);
    if (active) {
      ctx.fillStyle = hexA(col, 0.3);
      ctx.fillRect(x - 3, y - 3, 6, 6); // glow
      ctx.fillStyle = col;
      ctx.fillRect(x - 2, y - 2, 4, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y - 1, 1, 1);
      ctx.fillRect(x - 1, y, 1, 1);
    } else {
      ctx.globalAlpha = a.state === "lay_low" ? 0.3 : 0.55;
      ctx.fillStyle = col;
      ctx.fillRect(x - 1, y - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  // ---- defenders (SOC): sky ring + white core; line while responding ----
  for (const g of w.guardians) {
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);
    if (g.state === "respond") {
      const t = g.targetId >= 0 ? w.agents.find((a) => a.id === g.targetId) : null;
      if (t && t.state !== "jailed") {
        ctx.strokeStyle = hexA(DEF, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(Math.round(t.x), Math.round(t.y));
        ctx.stroke();
      }
    }
    ctx.strokeStyle = DEF;
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 3, gy - 3, 6, 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(gx - 1, gy - 1, 2, 2);
  }

  // ---- events: transient glyphs ----
  for (const p of w.pulses) {
    const c = PULSE[p.kind] ?? "#ef4444";
    const r = p.r;
    if (p.kind === "patch") {
      // green plus
      ctx.strokeStyle = hexA(c, p.life);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - 3 - r * 0.4, p.y);
      ctx.lineTo(p.x + 3 + r * 0.4, p.y);
      ctx.moveTo(p.x, p.y - 3 - r * 0.4);
      ctx.lineTo(p.x, p.y + 3 + r * 0.4);
      ctx.stroke();
    } else if (p.kind === "takedown") {
      // amber crosshair ring
      ctx.strokeStyle = hexA(c, p.life);
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(p.x - r), Math.round(p.y - r), Math.round(r * 2), Math.round(r * 2));
      ctx.beginPath();
      ctx.moveTo(p.x - r - 2, p.y);
      ctx.lineTo(p.x - r + 2, p.y);
      ctx.moveTo(p.x + r - 2, p.y);
      ctx.lineTo(p.x + r + 2, p.y);
      ctx.stroke();
    } else {
      // breach (red) / arrest (sky) expanding square
      ctx.strokeStyle = hexA(c, p.life);
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(p.x - r), Math.round(p.y - r), Math.round(r * 2), Math.round(r * 2));
    }
  }

  // ---- selection ----
  if (view.selectedId != null) {
    const a = w.agents.find((x) => x.id === view.selectedId);
    if (a && a.state !== "jailed" && a.state !== "desisted") {
      ctx.strokeStyle = dark ? "#ffffff" : "#0b0b0c";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(a.x) - 5, Math.round(a.y) - 5, 10, 10);
      const node = a.targetSector >= 0 && a.targetNode >= 0 ? w.sectors[a.targetSector]?.nodes[a.targetNode] : null;
      if (node) {
        ctx.strokeStyle = hexA(dark ? "#ffffff" : "#0b0b0c", 0.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      }
    }
  }
}

function heatColor(h: number): string {
  if (h < 0.5) return mix("#22c55e", "#f59e0b", h * 2);
  return mix("#f59e0b", "#ef4444", (h - 0.5) * 2);
}

function isDark(): boolean {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "dark") return true;
  if (t === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

function hexA(hex: string, a: number): string {
  const { r, g, b } = parse(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
}
function mix(h1: string, h2: string, t: number): string {
  const a = parse(h1);
  const b = parse(h2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}
function parse(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
