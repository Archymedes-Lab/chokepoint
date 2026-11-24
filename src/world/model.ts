import { RNG } from "../sim/rng";
import {
  MOTIVATIONS,
  MOTIVATION_IDS,
  clamp01,
  expectedUtility,
  perceivedCatch,
  recruitMotivation,
} from "./psychology";
import type {
  Agent,
  Drivers,
  Interventions,
  Metrics,
  MotivationId,
  Sector,
  TargetNode,
  WorldConfig,
} from "./types";

const SECTOR_DEFS: Omit<Sector, "economy" | "nodes" | "loss" | "breaches">[] = [
  {
    id: "finance",
    name: "Finance",
    color: "#2f6df0",
    region: { x: 0.02, y: 0.04, w: 0.3, h: 0.44 },
    gdpWeight: 0.22,
    baseDefense: 0.35,
    harm: 0.7,
    coupling: { retail: 0.3, crypto: 0.4, healthcare: 0.2, government: 0.2, critical: 0.2 },
  },
  {
    id: "crypto",
    name: "Crypto / Exchanges",
    color: "#8b5cf6",
    region: { x: 0.35, y: 0.04, w: 0.28, h: 0.44 },
    gdpWeight: 0.08,
    baseDefense: 0.25,
    harm: 0.5,
    coupling: { finance: 0.3 },
  },
  {
    id: "government",
    name: "Government",
    color: "#14b8a6",
    region: { x: 0.66, y: 0.04, w: 0.32, h: 0.44 },
    gdpWeight: 0.15,
    baseDefense: 0.3,
    harm: 0.8,
    coupling: { critical: 0.25, healthcare: 0.2 },
  },
  {
    id: "critical",
    name: "Critical Infrastructure",
    color: "#f59e0b",
    region: { x: 0.02, y: 0.52, w: 0.3, h: 0.44 },
    gdpWeight: 0.2,
    baseDefense: 0.3,
    harm: 1.0,
    coupling: { finance: 0.3, healthcare: 0.3, government: 0.2, retail: 0.3 },
  },
  {
    id: "healthcare",
    name: "Healthcare",
    color: "#ef4444",
    region: { x: 0.35, y: 0.52, w: 0.28, h: 0.44 },
    gdpWeight: 0.15,
    baseDefense: 0.2,
    harm: 1.0,
    coupling: { government: 0.15 },
  },
  {
    id: "retail",
    name: "Retail & SMB",
    color: "#10b981",
    region: { x: 0.66, y: 0.52, w: 0.32, h: 0.44 },
    gdpWeight: 0.2,
    baseDefense: 0.15,
    harm: 0.4,
    coupling: { finance: 0.2 },
  },
];

const SECTOR_BASE_VALUE: Record<string, number> = {
  finance: 300_000,
  crypto: 420_000,
  government: 150_000,
  critical: 260_000,
  healthcare: 210_000,
  retail: 85_000,
};

export interface HistoryPoint {
  tick: number;
  loss: number;
  population: number;
  gdp: number;
  trust: number;
  breaches: number;
}

export interface Advice {
  lever: keyof Interventions | "balanced";
  headline: string;
  rationale: string;
}

export class World {
  cfg: WorldConfig;
  rng: RNG;
  sectors: Sector[];
  agents: Agent[] = [];
  drivers: Drivers = {
    economicStrain: 0.5,
    toolingAvailability: 0.55,
    perceivedImpunity: 0.6,
    cryptoLiquidity: 0.6,
    contagion: 0.4,
  };
  interventions: Interventions = {
    takedown: 0,
    arrests: 0.15,
    cashoutDisruption: 0,
    hardening: 0,
    cooperation: 0.1,
    diversion: 0,
  };
  pulses: { x: number; y: number; r: number; life: number; sector: number }[] = [];
  history: HistoryPoint[] = [];
  events: { tick: number; text: string; kind: "breach" | "arrest" | "wave" | "policy" }[] = [];

  private nextId = 1;
  private recruitAcc = 0;
  private successMix: Record<MotivationId, number> = blankMix();
  private m: Metrics;
  readonly maxAgents = 5000;

  constructor(cfg: WorldConfig) {
    this.cfg = cfg;
    this.rng = new RNG(cfg.seed);
    this.sectors = SECTOR_DEFS.map((s) => this.buildSector(s));
    this.m = this.freshMetrics();
    for (let i = 0; i < cfg.initialAgents; i++) this.agents.push(this.spawnAgent());
    this.snapshot();
  }

  private buildSector(def: (typeof SECTOR_DEFS)[number]): Sector {
    const W = this.cfg.width;
    const H = this.cfg.height;
    const r = def.region;
    const nodeCount = 14 + Math.round(def.gdpWeight * 60);
    const nodes: TargetNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: (r.x + 0.06 + this.rng.next() * (r.w - 0.12)) * W,
        y: (r.y + 0.08 + this.rng.next() * (r.h - 0.16)) * H,
        value: SECTOR_BASE_VALUE[def.id] * this.rng.range(0.5, 1.5),
        defense: this.rng.range(0, 0.15),
        health: 1,
        cooldown: 0,
      });
    }
    return { ...def, economy: 100, nodes, loss: 0, breaches: 0 };
  }

  private spawnAgent(mot?: MotivationId): Agent {
    const W = this.cfg.width;
    const H = this.cfg.height;
    const id = this.nextId++;
    const m = mot ?? recruitMotivation(this.effectiveDrivers(), this.successMix, this.rng);
    const prof = MOTIVATIONS[m];
    const skill = clamp01(prof.skillFloor + this.rng.next() * prof.skillSpread);
    // Enter from a random edge (migration into the landscape).
    const edge = this.rng.next();
    const x = edge < 0.5 ? this.rng.next() * W : this.rng.next() < 0.5 ? 0 : W;
    const y = edge < 0.5 ? (this.rng.next() < 0.5 ? 0 : H) : this.rng.next() * H;
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      mot: m,
      skill,
      riskTolerance: clamp01(this.rng.range(0.3, 0.9) * prof.riskBias),
      morality: this.rng.range(0.2, 0.9),
      greed: this.rng.range(0.7, 1.3),
      deterrability: prof.deterrability,
      aspiration: this.rng.range(2, 8) * 100_000 * prof.greed,
      wealth: 0,
      heat: 0,
      state: "seek",
      targetSector: -1,
      targetNode: -1,
      cooldown: 0,
      ageTicks: 0,
      ops: 0,
      busts: 0,
      lastEU: 0,
      safeHaven: this.rng.next() < 0.45, // many operate from non-cooperating jurisdictions
    };
  }

  /** Drivers after authority interventions push back on the root causes. */
  effectiveDrivers(): Drivers {
    const iv = this.interventions;
    const d = this.drivers;
    return {
      economicStrain: clamp01(d.economicStrain - iv.diversion * 0.3),
      toolingAvailability: clamp01(d.toolingAvailability - iv.takedown * 0.5),
      perceivedImpunity: clamp01(
        d.perceivedImpunity - iv.arrests * (0.4 + 0.6 * iv.cooperation) - iv.takedown * 0.2,
      ),
      cryptoLiquidity: clamp01(d.cryptoLiquidity - iv.cashoutDisruption * 0.6),
      contagion: d.contagion,
    };
  }

  /** Fraction of the authority budget the current intervention mix consumes. */
  budgetUsed(): number {
    const iv = this.interventions;
    // Weighted "cost" of each lever; cooperation and diversion are cheaper.
    return (
      iv.takedown * 1.1 +
      iv.arrests * 1.0 +
      iv.cashoutDisruption * 1.2 +
      iv.hardening * 1.0 +
      iv.cooperation * 0.7 +
      iv.diversion * 0.8
    );
  }

  step() {
    const d = this.effectiveDrivers();
    const iv = this.interventions;
    this.m.tick++;

    this.recruit(d);
    const decay = blankMix();

    for (const a of this.agents) {
      a.ageTicks++;
      a.heat = Math.max(0, a.heat - 0.012);
      this.stepAgent(a, d, iv);
      if (a.state !== "jailed" && a.state !== "desisted") decay[a.mot]++;
    }
    // Decay the success mix toward the current active population.
    for (const id of MOTIVATION_IDS)
      this.successMix[id] = this.successMix[id] * 0.985 + (decay[id] / Math.max(1, this.agents.length)) * 0.015;

    this.compact();
    this.stepEconomy();
    this.stepPulses();
    if (this.m.tick % 4 === 0) this.snapshot();
    this.recomputeLive();
  }

  private recruit(d: Drivers) {
    if (this.agents.length >= this.maxAgents) return;
    const pressure =
      0.25 +
      d.economicStrain * 1.6 +
      d.toolingAvailability * 1.2 +
      d.perceivedImpunity * 1.1 +
      d.contagion * this.recentSuccessRate() * 2;
    const rate = pressure * (1 - this.interventions.diversion * 0.5) * 0.9;
    this.recruitAcc += rate;
    while (this.recruitAcc >= 1 && this.agents.length < this.maxAgents) {
      this.recruitAcc -= 1;
      this.agents.push(this.spawnAgent());
      this.m.recruited++;
    }
  }

  private stepAgent(a: Agent, d: Drivers, iv: Interventions) {
    switch (a.state) {
      case "jailed":
        if (--a.cooldown <= 0) {
          // Release: diversion + cooperation push toward desistance, else recidivism.
          if (this.rng.chance(0.3 + iv.diversion * 0.5)) a.state = "desisted";
          else {
            a.state = "seek";
            a.heat = 0;
          }
        }
        return;
      case "desisted":
        return;
      case "lay_low":
        a.heat = Math.max(0, a.heat - 0.03);
        if (--a.cooldown <= 0) a.state = "seek";
        return;
      case "seek":
        this.decideTarget(a, d, iv);
        return;
      case "travel": {
        const node = this.node(a);
        if (!node) {
          a.state = "seek";
          return;
        }
        if (this.moveToward(a, node.x, node.y)) {
          a.state = "operate";
          const skill = a.skill;
          const def = this.sectors[a.targetSector].baseDefense + node.defense;
          a.cooldown = 10 + Math.round((0.6 - skill + def) * 30);
        }
        return;
      }
      case "operate":
        if (this.maybeCaught(a, iv)) return;
        a.heat = Math.min(1, a.heat + 0.015);
        if (--a.cooldown <= 0) this.resolveOp(a, d, iv);
        return;
      case "cash":
        if (--a.cooldown <= 0) {
          // Satisfied offenders quit while ahead; others go again.
          if (a.wealth >= a.aspiration && this.rng.chance(0.5)) {
            a.state = "desisted";
            this.m.desistances++;
          } else a.state = "seek";
        }
        return;
    }
  }

  private decideTarget(a: Agent, d: Drivers, iv: Interventions) {
    const prof = MOTIVATIONS[a.mot];
    let best = -Infinity;
    let bestS = -1;
    let bestN = -1;
    const W = this.cfg.width;
    const H = this.cfg.height;
    for (let k = 0; k < 6; k++) {
      const si = Math.floor(this.rng.next() * this.sectors.length);
      const sec = this.sectors[si];
      const ni = Math.floor(this.rng.next() * sec.nodes.length);
      const node = sec.nodes[ni];
      if (node.cooldown > 0) continue;
      const dist = Math.hypot(node.x - a.x, node.y - a.y) / Math.hypot(W, H);
      const eu = expectedUtility(
        {
          mot: prof,
          skill: a.skill,
          riskTolerance: a.riskTolerance,
          morality: a.morality,
          greed: a.greed,
          heat: a.heat,
          safeHaven: a.safeHaven,
          distance: dist,
        },
        sec,
        node,
        d,
        iv,
      );
      if (eu > best) {
        best = eu;
        bestS = si;
        bestN = ni;
      }
    }
    a.lastEU = best;
    if (best <= 0 || bestS < 0) {
      // Deterred: nothing is worth it right now.
      if (this.rng.chance(0.015 + a.deterrability * 0.05 + iv.diversion * 0.04)) {
        a.state = "desisted";
        this.m.desistances++;
      } else {
        a.state = "lay_low";
        a.cooldown = 20 + Math.floor(this.rng.next() * 60);
      }
      return;
    }
    a.targetSector = bestS;
    a.targetNode = bestN;
    a.state = "travel";
  }

  private resolveOp(a: Agent, d: Drivers, iv: Interventions) {
    const sec = this.sectors[a.targetSector];
    const node = this.node(a);
    if (!node) {
      a.state = "seek";
      return;
    }
    const prof = MOTIVATIONS[a.mot];
    const skillEff = Math.min(1, a.skill + d.toolingAvailability * (1 - a.skill) * 0.5);
    const defense = Math.min(0.98, sec.baseDefense + node.defense + iv.hardening * 0.25);
    const pSuccess = clamp01(skillEff * 0.9 - defense + 0.1);

    if (this.rng.chance(pSuccess)) {
      // Harm done. Damage scales with node value and the attacker's reach.
      const cashout = 0.25 + 0.75 * d.cryptoLiquidity * (1 - iv.cashoutDisruption);
      const sev = this.rng.range(0.15, 0.4);
      const loss = node.value * sev;
      const payoff = loss * cashout * 0.6;
      a.wealth += payoff;
      a.ops++;
      a.heat = Math.min(1, a.heat + 0.12);
      node.health = Math.max(0, node.health - sev);
      node.cooldown = 40 + Math.floor(this.rng.next() * 60);
      // Adaptive defender: a hit nudges that node's defences up a little.
      node.defense = Math.min(0.6, node.defense + 0.03);
      // Economy is a 0..100 health with proportional recovery (see stepEconomy);
      // one breach removes a bounded amount scaled by how harmful the sector is.
      sec.economy = Math.max(0, sec.economy - sev * (0.8 + sec.harm) * 3.2);
      sec.loss += loss;
      sec.breaches++;
      // Global harm metrics (multiple dimensions of damage).
      this.m.financialLoss += loss;
      this.m.recoveryCost += loss * 0.45;
      this.m.downtimeHours += sev * 120 * (1 + sec.harm);
      this.m.recordsStolen += Math.round((node.value / 12) * sev);
      this.m.victims += 1;
      this.m.breaches++;
      this.m.publicTrust = Math.max(0, this.m.publicTrust - sev * sec.harm * 0.6);
      this.successMix[a.mot] = Math.min(1, this.successMix[a.mot] + 0.05);
      this.pulses.push({ x: node.x, y: node.y, r: 0, life: 1, sector: a.targetSector });
      if (loss > 400_000)
        this.pushEvent(
          "breach",
          `${MOTIVATIONS[a.mot].name} offender hit ${sec.name} for ${money(loss)}.`,
        );
      a.state = "cash";
      a.cooldown = 8;
    } else {
      a.ops += 0;
      a.heat = Math.min(1, a.heat + 0.06 + prof.riskBias * 0.02);
      if (this.maybeCaught(a, iv, true)) return;
      a.state = "seek";
    }
  }

  private maybeCaught(a: Agent, iv: Interventions, postFail = false): boolean {
    const p = perceivedCatch(a.heat, a.safeHaven, iv) * (postFail ? 0.08 : 0.02);
    if (this.rng.chance(p)) {
      a.busts++;
      a.state = "jailed";
      a.cooldown = 120 + Math.floor((0.5 + iv.cooperation) * 200) + (a.mot === "professional" ? 150 : 0);
      a.heat = 0;
      this.m.arrestsMade++;
      if (a.wealth > 500_000 || a.mot === "professional")
        this.pushEvent("arrest", `Authorities arrested a ${MOTIVATIONS[a.mot].name} offender.`);
      return true;
    }
    return false;
  }

  private stepEconomy() {
    for (const s of this.sectors) {
      // Proportional recovery toward 100 — the economy settles at an
      // equilibrium set by the attack rate, instead of flooring at zero.
      s.economy += (100 - s.economy) * 0.02;
      // Node health recovery + cooldown decay.
      for (const n of s.nodes) {
        if (n.cooldown > 0) n.cooldown--;
        if (n.health < 1) n.health = Math.min(1, n.health + 0.004);
        if (n.defense > 0) n.defense = Math.max(0, n.defense - 0.0008); // uplift fades
      }
      // Campaign hardening slowly raises baseline defence toward a target.
      const target = s.id === "healthcare" || s.id === "retail" ? 0.2 : 0.3;
      const want = target + this.interventions.hardening * 0.45;
      s.baseDefense += (want - s.baseDefense) * 0.02;
    }
    // Inter-sector cascade: weak sectors drag their coupled neighbours.
    const snapshot = this.sectors.map((s) => s.economy);
    this.sectors.forEach((s, i) => {
      let drag = 0;
      for (const [other, w] of Object.entries(s.coupling)) {
        const oi = this.sectors.findIndex((x) => x.id === other);
        if (oi >= 0) drag += (100 - snapshot[oi]) * (w ?? 0) * 0.004;
      }
      this.sectors[i].economy = Math.max(0, s.economy - drag);
    });
    // Public trust recovers proportionally, like the economy.
    this.m.publicTrust += (100 - this.m.publicTrust) * 0.012;
  }

  private stepPulses() {
    for (const p of this.pulses) {
      p.r += 1.4;
      p.life -= 0.04;
    }
    this.pulses = this.pulses.filter((p) => p.life > 0);
  }

  private compact() {
    if (this.agents.some((a) => a.state === "desisted"))
      this.agents = this.agents.filter((a) => a.state !== "desisted");
  }

  private recentSuccessRate(): number {
    return MOTIVATION_IDS.reduce((s, id) => s + this.successMix[id], 0) / MOTIVATION_IDS.length;
  }

  private node(a: Agent): TargetNode | null {
    if (a.targetSector < 0 || a.targetNode < 0) return null;
    return this.sectors[a.targetSector]?.nodes[a.targetNode] ?? null;
  }

  private moveToward(a: Agent, tx: number, ty: number): boolean {
    const dx = tx - a.x;
    const dy = ty - a.y;
    const dist = Math.hypot(dx, dy);
    const speed = 2.2;
    if (dist < speed + 2) {
      a.x = tx;
      a.y = ty;
      return true;
    }
    a.x += (dx / dist) * speed;
    a.y += (dy / dist) * speed;
    return false;
  }

  private pushEvent(kind: "breach" | "arrest" | "wave" | "policy", text: string) {
    this.events.unshift({ tick: this.m.tick, text, kind });
    if (this.events.length > 40) this.events.pop();
  }

  private recomputeLive() {
    const mix = blankMix();
    let active = 0;
    for (const a of this.agents) {
      mix[a.mot]++;
      if (a.state === "operate" || a.state === "travel") active++;
    }
    this.m.population = this.agents.length;
    this.m.byMotivation = mix;
    this.m.activeOps = active;
    this.m.gdpIndex = this.sectors.reduce((s, sec) => s + sec.economy * sec.gdpWeight, 0);
    this.m.budgetUsed = this.budgetUsed();
  }

  private snapshot() {
    this.history.push({
      tick: this.m.tick,
      loss: this.m.financialLoss,
      population: this.agents.length,
      gdp: this.sectors.reduce((s, sec) => s + sec.economy * sec.gdpWeight, 0),
      trust: this.m.publicTrust,
      breaches: this.m.breaches,
    });
    if (this.history.length > 400) this.history.shift();
  }

  private freshMetrics(): Metrics {
    return {
      tick: 0,
      population: 0,
      byMotivation: blankMix(),
      activeOps: 0,
      financialLoss: 0,
      recoveryCost: 0,
      downtimeHours: 0,
      recordsStolen: 0,
      victims: 0,
      gdpIndex: 100,
      publicTrust: 100,
      breaches: 0,
      arrestsMade: 0,
      desistances: 0,
      recruited: 0,
      budgetUsed: 0,
    };
  }

  // ---- public accessors for the UI ----
  metrics(): Metrics {
    return this.m;
  }

  pickAgent(x: number, y: number, radius = 10): Agent | null {
    let best: Agent | null = null;
    let bestD = radius * radius;
    for (const a of this.agents) {
      if (a.state === "jailed" || a.state === "desisted") continue;
      const dx = a.x - x;
      const dy = a.y - y;
      const dd = dx * dx + dy * dy;
      if (dd < bestD) {
        bestD = dd;
        best = a;
      }
    }
    return best;
  }

  /**
   * The advisor: reads the live ecosystem and names the highest-leverage
   * authority response. This is the "decomplexify" output — it turns the
   * tangle of motives and metrics into one defensible recommendation, and it
   * embodies the thesis that *understanding motivation* reveals the lever.
   */
  advise(): Advice {
    const mix = this.m.byMotivation;
    const pop = Math.max(1, this.m.population);
    const iv = this.interventions;
    const d = this.effectiveDrivers(); // what remains AFTER current interventions
    const share = (id: MotivationId) => (mix[id] ?? 0) / pop;
    const economic = share("economic") + share("professional");
    const opportunistic = share("opportunistic");
    const ideological = share("ideological");
    const havenPressure = this.agents.length
      ? this.agents.filter((a) => a.safeHaven).length / this.agents.length
      : 0.5;
    const defenseGap = Math.max(0, (90 - this.m.gdpIndex) / 90);

    // Score each lever by the pressure it would relieve, minus what's already
    // invested in it. The best *gap* wins — so a maxed-out lever won't be
    // recommended again, and the advice tracks the shifting population.
    const text: Record<Exclude<Advice["lever"], "balanced">, [string, string]> = {
      takedown: [
        "Take down the tooling supply.",
        "A large opportunistic population is riding cheap, ready-made kits. Seizing that infrastructure raises the skill barrier and collapses the low-skill wave at its source.",
      ],
      cashoutDisruption: [
        "Disrupt the cash-out.",
        "Profit-driven offenders dominate and the money still moves easily. Hitting mixers and complicit exchanges cuts realised reward — the term their expected-utility actually hinges on.",
      ],
      diversion: [
        "Invest upstream in diversion.",
        "Recruitment is being fed by economic strain. Enforcement alone displaces; diversion programs shrink the inflow of new offenders — the root cause, not the symptom.",
      ],
      cooperation: [
        "Prioritise international cooperation.",
        "Grievance-driven actors resist deterrence and often sit in non-cooperating jurisdictions. Reach, not severity, is what constrains them.",
      ],
      arrests: [
        "Raise the certainty of arrest.",
        "Perceived impunity is still high. Certainty of being caught deters far more than severity — and incapacitates the most active offenders.",
      ],
      hardening: [
        "Fund a defensive uplift — but expect displacement.",
        "Harm is concentrating in under-defended sectors. Raising baseline defences helps, but on its own it pushes offenders toward softer targets rather than out of the game.",
      ],
    };

    const scores: Record<keyof typeof text, number> = {
      takedown: d.toolingAvailability * (0.5 + opportunistic) * 1.6 - iv.takedown,
      cashoutDisruption: d.cryptoLiquidity * (0.4 + economic) * 1.6 - iv.cashoutDisruption,
      diversion: d.economicStrain * 1.5 - iv.diversion,
      cooperation: (ideological * 1.4 + havenPressure * 0.8) * (1 - iv.cooperation) - iv.cooperation * 0.5,
      arrests: d.perceivedImpunity * 1.2 - iv.arrests,
      hardening: defenseGap * 1.6 - iv.hardening,
    };

    let bestLever: keyof typeof text | null = null;
    let bestScore = 0.12; // threshold below which no single lever is compelling
    for (const k of Object.keys(scores) as (keyof typeof text)[]) {
      if (scores[k] > bestScore) {
        bestScore = scores[k];
        bestLever = k;
      }
    }
    if (!bestLever)
      return {
        lever: "balanced",
        headline: "Hold a balanced posture.",
        rationale:
          "No single force dominates and your current levers are well-matched to the threat. Keep steady arrest certainty and cooperation, and watch which motivation grows next — the right lever changes with the population.",
      };
    return { lever: bestLever, headline: text[bestLever][0], rationale: text[bestLever][1] };
  }
}

function blankMix(): Record<MotivationId, number> {
  return { economic: 0, professional: 0, ideological: 0, thrill: 0, opportunistic: 0 };
}

function money(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export { money };
