import { MOTIVATIONS } from "./psychology";
import type { World } from "./model";

/**
 * Pixel-art renderer for the ecosystem. The canvas backing store is sized to
 * world units (1 unit = 1 pixel) and scaled up by CSS with nearest-neighbour,
 * so everything reads as chunky pixels — a "Gather"-style world where you can
 * watch thousands of offenders move and see damage ripple through districts.
 */
export interface ViewState {
  selectedId: number | null;
  showHeat: boolean;
}

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, view: ViewState) {
  const W = w.cfg.width;
  const H = w.cfg.height;
  const dark = isDark();

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = dark ? "#0a0d13" : "#e9edf3";
  ctx.fillRect(0, 0, W, H);

  // faint tile grid
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
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

  // districts
  for (const s of w.sectors) {
    const r = s.region;
    const rx = r.x * W;
    const ry = r.y * H;
    const rw = r.w * W;
    const rh = r.h * H;
    const health = s.economy / 100;
    ctx.fillStyle = hexA(s.color, 0.07 + 0.05 * (1 - health));
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = hexA(s.color, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

    // a "wound" overlay when the economy is hurting
    if (health < 0.85) {
      ctx.fillStyle = hexA("#ef4444", (1 - health) * 0.18);
      ctx.fillRect(rx, ry, rw, rh);
    }

    // label
    ctx.fillStyle = dark ? "rgba(230,236,243,0.8)" : "rgba(20,30,46,0.8)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillText(s.name.toUpperCase(), rx + 5, ry + 4);
    ctx.fillStyle = hexA(s.color, 0.9);
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText(`${Math.round(s.economy)}%`, rx + 5, ry + 17);

    // target buildings
    for (const n of s.nodes) {
      const sz = 4 + Math.min(5, n.value / 100_000);
      const h = n.health;
      ctx.fillStyle = h > 0.6 ? s.color : mix(s.color, "#ef4444", 1 - h);
      ctx.globalAlpha = n.cooldown > 0 ? 0.5 : 1;
      ctx.fillRect(Math.round(n.x - sz / 2), Math.round(n.y - sz / 2), Math.round(sz), Math.round(sz));
      ctx.globalAlpha = 1;
      // defence pip
      if (n.defense > 0.08) {
        ctx.fillStyle = "#35c48b";
        ctx.fillRect(Math.round(n.x - sz / 2), Math.round(n.y - sz / 2) - 2, Math.max(1, Math.round(sz * n.defense * 2)), 1);
      }
    }
  }

  // event pulses — breach (red), arrest (blue), takedown (amber), patch (green)
  const PULSE: Record<string, string> = {
    breach: "#ef4d4d",
    arrest: "#4b8dff",
    takedown: "#e3a53a",
    patch: "#3cc07a",
  };
  for (const p of w.pulses) {
    ctx.strokeStyle = hexA(PULSE[p.kind] ?? "#ef4d4d", p.life);
    ctx.lineWidth = 1;
    const r = p.r;
    ctx.strokeRect(Math.round(p.x - r), Math.round(p.y - r), Math.round(r * 2), Math.round(r * 2));
  }

  // agents
  for (const a of w.agents) {
    if (a.state === "jailed" || a.state === "desisted") continue;
    const col = MOTIVATIONS[a.mot].color;
    let size = 3;
    if (a.state === "operate") {
      size = 4;
      ctx.fillStyle = hexA(col, 0.35);
      ctx.fillRect(Math.round(a.x) - 3, Math.round(a.y) - 3, 6, 6); // glow
    }
    ctx.fillStyle = view.showHeat ? heatColor(a.heat) : col;
    ctx.fillRect(Math.round(a.x) - (size >> 1), Math.round(a.y) - (size >> 1), size, size);
  }

  // defender (SOC / blue-team) units — blue squares with a white core; a ring
  // while actively responding to an offender.
  for (const g of w.guardians) {
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);
    if (g.state === "respond") {
      ctx.strokeStyle = hexA("#4b8dff", 0.6);
      ctx.lineWidth = 1;
      ctx.strokeRect(gx - 4, gy - 4, 8, 8);
    }
    ctx.fillStyle = "#4b8dff";
    ctx.fillRect(gx - 2, gy - 2, 4, 4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(gx, gy - 1, 1, 1);
    ctx.fillRect(gx - 1, gy, 1, 1);
  }

  // selected agent
  if (view.selectedId != null) {
    const a = w.agents.find((x) => x.id === view.selectedId);
    if (a && a.state !== "jailed" && a.state !== "desisted") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(a.x) - 4, Math.round(a.y) - 4, 8, 8);
      const node = a.targetSector >= 0 && a.targetNode >= 0 ? w.sectors[a.targetSector]?.nodes[a.targetNode] : null;
      if (node) {
        ctx.strokeStyle = hexA("#ffffff", 0.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      }
    }
  }
}

function heatColor(h: number): string {
  // green → amber → red
  if (h < 0.5) return mix("#35c48b", "#e4a23c", h * 2);
  return mix("#e4a23c", "#f2695e", (h - 0.5) * 2);
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
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
