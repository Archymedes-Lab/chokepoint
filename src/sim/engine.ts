import { RNG } from "./rng";
import type {
  Archetype,
  Control,
  Outcome,
  Posture,
  SimEvent,
  SimResult,
  StageId,
  Technique,
} from "./types";
import { TECHNIQUE_BY_ID, TECHNIQUES_BY_STAGE } from "./catalog/techniques";
import { STAGE_BY_ID } from "./catalog/stages";

/** Tunable model constants, grouped for transparency (see docs/MODEL.md). */
const K = {
  skillPunch: 0.4, // how much agent skill erodes a *soft* control's block
  skillQuiet: 0.3, // how much skill lowers inherent noise
  edrBlindFactor: 0.3, // residual effect of EDR controls once blinded
  noiseWeight: 0.22, // weight of inherent technique noise in detection
  blockedThreshold: 0.08, // effective success below this reads as "control blocked it"
  maxAttemptsPerObjective: 4,
  credHarvestBoost: 0.1,
  retreatMargin: 0.25,
  // Detection pressure is not purely cumulative: attackers pace themselves
  // across phases and defender alertness cools. Heat decays each objective.
  heatDecay: 0.68,
};

interface RunState {
  rng: RNG;
  agent: Archetype;
  posture: Posture;
  controls: Record<string, Control>;
  heat: number;
  cost: number;
  time: number;
  budget: number;
  step: number;
  inside: boolean;
  edrBlinded: boolean;
  credStolen: boolean;
  doubleExtortion: boolean;
  reachedImpact: boolean;
  cashedOut: boolean;
  detectedLate: boolean;
  reachedStage: StageId;
  reachedIndex: number;
  events: SimEvent[];
  terminal?: { outcome: Outcome; stage: StageId };
}

interface Objective {
  stage: StageId;
  techIds: string[];
  required: boolean;
  /** Marks this objective as the one that constitutes "impact" (a breach). */
  isBreach?: boolean;
  /** Marks the monetisation objective. */
  isCashout?: boolean;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

/** Build the ordered objective list for an archetype's goal. */
function objectivesFor(agent: Archetype): Objective[] {
  const access: Objective = {
    stage: "access",
    techIds: ["buy_access", "infostealer", "aitm_phish", "helpdesk_se", "exploit_edge"],
    required: true,
  };
  switch (agent.goal) {
    case "ransomware":
      return [
        access,
        { stage: "foothold", techIds: ["edr_kill"], required: false },
        { stage: "foothold", techIds: ["lotl"], required: true },
        { stage: "escalate", techIds: ["cred_harvest"], required: false },
        { stage: "escalate", techIds: ["lateral"], required: true },
        { stage: "impact", techIds: ["exfil"], required: false },
        { stage: "impact", techIds: ["encrypt"], required: true, isBreach: true },
        { stage: "cashout", techIds: ["launder_crypto"], required: true, isCashout: true },
      ];
    case "data-theft":
      return [
        access,
        { stage: "foothold", techIds: ["edr_kill"], required: false },
        { stage: "foothold", techIds: ["lotl"], required: true },
        { stage: "escalate", techIds: ["cred_harvest"], required: false },
        { stage: "escalate", techIds: ["lateral"], required: true },
        { stage: "impact", techIds: ["exfil"], required: true, isBreach: true },
        { stage: "cashout", techIds: ["launder_crypto"], required: true, isCashout: true },
      ];
    case "bec":
      return [
        { stage: "access", techIds: ["aitm_phish", "infostealer", "helpdesk_se"], required: true },
        { stage: "impact", techIds: ["bec_wire"], required: true, isBreach: true },
        { stage: "cashout", techIds: ["mule_cashout"], required: true, isCashout: true },
      ];
    case "access-resale":
      return [
        access,
        // The "sale" is the payday; modelled as a trivially-successful cashout.
        { stage: "cashout", techIds: ["launder_crypto"], required: true, isCashout: true, isBreach: true },
      ];
  }
}

function controlMap(controls: Control[]): Record<string, Control> {
  return Object.fromEntries(controls.map((c) => [c.id, c]));
}

/** Effective success probability of a technique under the current posture. */
function effectiveSuccess(tech: Technique, st: RunState): number {
  let s = tech.baseSuccess;
  for (const e of tech.counteredBy) {
    const c = st.controls[e.controlId];
    if (!c || !c.enabled || !e.block) continue;
    let reduction = e.block * c.coverage;
    if (!e.hard) reduction *= 1 - K.skillPunch * st.agent.skill;
    if (st.edrBlinded && (e.controlId === "edr" || e.controlId === "edr_tamper"))
      reduction *= K.edrBlindFactor;
    s *= 1 - clamp01(reduction);
  }
  if (tech.id === "lateral" && st.credStolen) s = clamp01(s + K.credHarvestBoost);
  return clamp01(s);
}

/** Per-attempt detection pressure added to the run's heat. */
function detectionAdded(tech: Technique, st: RunState): number {
  let add = 0;
  for (const e of tech.counteredBy) {
    const c = st.controls[e.controlId];
    if (!c || !c.enabled || !e.detect) continue;
    let d = e.detect * c.coverage;
    if (st.edrBlinded && (e.controlId === "edr" || e.controlId === "edr_tamper"))
      d *= K.edrBlindFactor;
    add += d;
  }
  const inherent = tech.noise * (1 - K.skillQuiet * st.agent.skill) * K.noiseWeight;
  return clamp01(inherent + add);
}

/**
 * Score a candidate technique for the agent's decision. Higher is more
 * attractive. This is the behavioural core: agents weigh expected success
 * against detection risk (scaled by how risk-averse they are) and cost
 * (scaled by how tight their budget is). Changing the posture changes the
 * scores, which changes what the agent does — the source of emergent,
 * path-dependent behaviour.
 */
function scoreTechnique(tech: Technique, st: RunState): number {
  const succ = effectiveSuccess(tech, st);
  const det = detectionAdded(tech, st);
  const riskAversion = 1 - st.agent.riskTolerance;
  const budgetPressure = tech.cost / Math.max(1, st.budget);
  const score =
    succ * (1 - 0.6 * det * riskAversion) - 0.5 * budgetPressure - 0.15 * det * riskAversion;
  return score;
}

function emit(st: RunState, ev: Omit<SimEvent, "step" | "heat" | "cost" | "time">) {
  st.events.push({
    ...ev,
    step: st.step++,
    heat: Number(st.heat.toFixed(3)),
    cost: Math.round(st.cost),
    time: Math.round(st.time),
  });
}

/** Choose a technique via softmax over scores, so runs vary. */
function chooseTechnique(cands: Technique[], st: RunState): Technique {
  if (cands.length === 1) return cands[0];
  const scores = cands.map((t) => scoreTechnique(t, st));
  const max = Math.max(...scores);
  const weights = scores.map((s) => Math.exp((s - max) * 4)); // temperature 1/4
  return cands[st.rng.weightedIndex(weights)];
}

/** Does the defender detect-and-respond this step? Mutates terminal if so. */
function checkResponse(st: RunState): boolean {
  if (st.heat < st.posture.responseThreshold) return false;
  const over = (st.heat - st.posture.responseThreshold) / (1 - st.posture.responseThreshold);
  const respChance = st.posture.responsiveness * lerp(0.3, 1, over);
  if (!st.rng.chance(respChance)) return false;

  if (st.reachedImpact) {
    // Too late to prevent impact, but a faster response limits the damage.
    st.detectedLate = true;
    emit(st, {
      stage: st.reachedStage,
      kind: "response",
      text: "Defender detects the intrusion and begins response — impact already underway; recovery is faster.",
    });
    return false;
  }
  const outcome: Outcome = st.inside ? "evicted" : "blocked";
  emit(st, {
    stage: st.reachedStage,
    kind: "response",
    text: st.inside
      ? "Detection crosses the response threshold — the adversary is evicted before impact."
      : "The attempt is caught at the perimeter; access is denied.",
  });
  st.terminal = { outcome, stage: st.reachedStage };
  return true;
}

/** Attempt a single objective until it succeeds, is skipped, or run ends. */
function runObjective(st: RunState, obj: Objective) {
  if (st.terminal) return;
  const stage = STAGE_BY_ID[obj.stage];
  // Cool down between phases (pacing / alert decay) before this objective.
  if (st.inside) st.heat *= K.heatDecay;
  st.reachedStage = obj.stage;
  st.reachedIndex = stage.index;

  // Access-resale cashout is a forum sale, not laundering: resolve simply.
  if (obj.isCashout && st.agent.goal === "access-resale") {
    st.reachedImpact = true;
    st.cashedOut = st.rng.chance(0.9);
    emit(st, {
      stage: obj.stage,
      kind: "terminal",
      text: "Foothold sold on the broker market — the payday for an access broker.",
    });
    return;
  }

  // Optional objective: the agent decides whether it is worth attempting.
  if (!obj.required && !wantsOptional(st, obj)) return;

  let attempts = 0;
  while (attempts < K.maxAttemptsPerObjective) {
    attempts++;
    const cands = obj.techIds
      .map((id) => TECHNIQUE_BY_ID[id])
      .filter((t) => t.skillReq <= st.agent.skill && t.cost <= st.budget);

    if (cands.length === 0) {
      if (obj.required) {
        const outcome: Outcome = st.inside ? "abandoned" : "blocked";
        emit(st, {
          stage: obj.stage,
          kind: "terminal",
          text: st.inside
            ? "No viable technique and resources spent — the operation is abandoned."
            : "Every initial-access route is closed off; the adversary never gets in.",
        });
        st.terminal = { outcome, stage: obj.stage };
      }
      return;
    }

    const tech = chooseTechnique(cands, st);
    const succ = effectiveSuccess(tech, st);
    const det = detectionAdded(tech, st);
    st.cost += tech.cost;
    st.budget -= tech.cost;
    st.time += tech.time;
    st.heat = clamp01(st.heat + det);

    emit(st, {
      stage: obj.stage,
      techniqueId: tech.id,
      kind: "attempt",
      text: `${st.agent.name} attempts: ${tech.name}.`,
    });

    const ok = st.rng.chance(succ);
    if (ok) {
      applyTechniqueFlags(st, tech);
      if (obj.stage === "access") st.inside = true;
      if (obj.isBreach) st.reachedImpact = true;
      if (obj.isCashout) st.cashedOut = true;
      emit(st, {
        stage: obj.stage,
        techniqueId: tech.id,
        kind: "success",
        text: `Success: ${tech.name}.`,
      });
      checkResponse(st);
      return;
    }

    // Failure — distinguish a control block from plain bad luck.
    const blocked = succ < K.blockedThreshold;
    emit(st, {
      stage: obj.stage,
      techniqueId: tech.id,
      kind: blocked ? "blocked" : "fail",
      text: blocked
        ? `Blocked by defences: ${tech.name} is not viable here.`
        : `Attempt failed: ${tech.name}.`,
    });

    if (checkResponse(st) || st.terminal) return;
    if (checkRetreat(st) || checkBudget(st, obj)) return;

    if (!obj.required) return; // skip an optional objective after one miss

    // Pivot? Adaptable agents try an alternate route.
    if (!st.rng.chance(st.agent.adaptability)) {
      // Not adaptable enough to keep trying right now; one more loop only if attempts remain.
      if (attempts >= 2) {
        const outcome: Outcome = st.inside ? "abandoned" : "blocked";
        emit(st, {
          stage: obj.stage,
          kind: "terminal",
          text: st.inside
            ? "The adversary gives up and withdraws."
            : "The adversary moves on to an easier target.",
        });
        st.terminal = { outcome, stage: obj.stage };
        return;
      }
    } else {
      emit(st, { stage: obj.stage, kind: "pivot", text: "Pivoting to an alternate technique." });
    }
  }

  // Exhausted attempts on a required objective.
  if (obj.required && !st.terminal) {
    const outcome: Outcome = st.inside ? "abandoned" : "blocked";
    emit(st, {
      stage: obj.stage,
      kind: "terminal",
      text: st.inside ? "Out of options — operation abandoned." : "Could not establish access.",
    });
    st.terminal = { outcome, stage: obj.stage };
  }
}

function wantsOptional(st: RunState, obj: Objective): boolean {
  const tech = TECHNIQUE_BY_ID[obj.techIds[0]];
  if (tech.skillReq > st.agent.skill || tech.cost > st.budget) return false;
  if (tech.id === "edr_kill") {
    // Worth it only if EDR is actually present; skilled/adaptable agents lean in.
    const edr = st.controls["edr"];
    if (!edr?.enabled) return false;
    return st.rng.chance(0.4 + 0.5 * st.agent.adaptability);
  }
  if (tech.id === "exfil") {
    // Ransomware crews exfiltrate for double-extortion leverage most of the time.
    return st.rng.chance(0.75);
  }
  // cred_harvest and the rest: usually attempted if affordable.
  return st.rng.chance(0.7);
}

function applyTechniqueFlags(st: RunState, tech: Technique) {
  if (tech.id === "edr_kill") st.edrBlinded = true;
  if (tech.id === "cred_harvest") st.credStolen = true;
  if (tech.id === "exfil") st.doubleExtortion = true;
}

function checkRetreat(st: RunState): boolean {
  if (!st.inside || st.reachedImpact) return false;
  const over = st.heat - st.agent.riskTolerance;
  if (over <= K.retreatMargin) return false;
  const retreatP = clamp01(over * (1 - st.agent.riskTolerance));
  if (st.rng.chance(retreatP)) {
    emit(st, {
      stage: st.reachedStage,
      kind: "terminal",
      text: "Too hot — the adversary cuts losses and retreats to avoid attribution.",
    });
    st.terminal = { outcome: "abandoned", stage: st.reachedStage };
    return true;
  }
  return false;
}

function checkBudget(st: RunState, obj: Objective): boolean {
  if (st.budget > 0 || !obj.required) return false;
  const outcome: Outcome = st.inside ? "abandoned" : "blocked";
  emit(st, {
    stage: st.reachedStage,
    kind: "terminal",
    text: "Resources exhausted before the objective was met.",
  });
  st.terminal = { outcome, stage: st.reachedStage };
  return true;
}

/** Translate the end state into money (abstract units; see docs/MODEL.md). */
function computeEconomics(st: RunState): { net: number; loss: number } {
  const v = st.posture.targetValue;
  const backups = st.controls["backups"];
  const backupCov = backups?.enabled ? backups.coverage : 0;
  const stageReached = st.reachedIndex;

  // --- Defender loss floor by terminal state ---
  let loss = 0;
  const to = st.terminal?.outcome;
  if (to === "blocked") loss = v * 0.005;
  else if (to === "abandoned") loss = v * 0.01 * (stageReached + 1);
  else if (to === "evicted") loss = v * 0.03 * (stageReached + 1);

  // --- Payout if the adversary reached impact ---
  let payout = 0;
  let paymentProb = 0;
  const split = st.agent.goal === "ransomware" ? 0.8 : 1; // RaaS operator takes ~20%
  let launderFriction = st.cashedOut ? 0.2 : 0.6;

  if (st.reachedImpact) {
    switch (st.agent.goal) {
      case "ransomware": {
        payout = v * 0.06;
        // Calibrated to Coveware Q3 2025: ~23% of ransomware victims pay, and
        // falling. Backups and double-extortion move it; see docs/CALIBRATION.md.
        paymentProb = 0.26 * (1 - 0.55 * backupCov) + (st.doubleExtortion ? 0.08 : 0);
        if (st.detectedLate) paymentProb -= 0.05;
        paymentProb = clamp01(Math.max(0.03, paymentProb));
        const downtime = v * (backupCov > 0.4 ? 0.08 : 0.22) * (st.detectedLate ? 0.8 : 1);
        const paid = st.rng.chance(paymentProb);
        loss = downtime + (paid ? payout : 0);
        payout = paid ? payout : 0;
        break;
      }
      case "data-theft": {
        payout = v * 0.03;
        // Coveware Q3 2025: data-theft-only extortion payment rate ~19%.
        paymentProb = clamp01(0.19 - (st.detectedLate ? 0.05 : 0));
        const paid = st.rng.chance(paymentProb);
        loss = v * 0.08 + (paid ? payout : 0);
        payout = paid ? payout : 0;
        break;
      }
      case "bec": {
        payout = v * 0.04;
        // BEC is fraud, not extortion: an undetected diverted wire usually
        // clears, but out-of-band callback blocks most of it upstream.
        paymentProb = clamp01(st.detectedLate ? 0.25 : 0.5);
        const paid = st.rng.chance(paymentProb);
        loss = paid ? payout : v * 0.005;
        payout = paid ? payout : 0;
        break;
      }
      case "access-resale": {
        payout = Math.max(1000, Math.min(50000, v * 0.002));
        launderFriction = 0.1;
        loss = v * 0.002; // downstream damage not modelled; the access itself
        break;
      }
    }
  }

  const net = payout * split * (1 - launderFriction) - st.cost;
  return { net: Math.round(net), loss: Math.round(loss) };
}

/** Run one full simulation. Pure given (archetype, posture, seed). */
export function simulate(agent: Archetype, posture: Posture, seed: number): SimResult {
  const st: RunState = {
    rng: new RNG(seed),
    agent,
    posture,
    controls: controlMap(posture.controls),
    heat: 0,
    cost: 0,
    time: 0,
    budget: agent.budget,
    step: 0,
    inside: false,
    edrBlinded: false,
    credStolen: false,
    doubleExtortion: false,
    reachedImpact: false,
    cashedOut: false,
    detectedLate: false,
    reachedStage: "access",
    reachedIndex: 0,
    events: [],
  };

  emit(st, {
    stage: "access",
    kind: "start",
    text: `${agent.name} begins operating against the target (goal: ${agent.goal}).`,
  });

  const objectives = objectivesFor(agent);
  for (const obj of objectives) {
    if (st.terminal) break;
    runObjective(st, obj);
  }

  let outcome: Outcome;
  if (st.terminal) outcome = st.terminal.outcome;
  else if (st.cashedOut) outcome = "cashed_out";
  else if (st.reachedImpact) outcome = "breached";
  else outcome = "abandoned";

  const { net, loss } = computeEconomics(st);
  const detectedAtStage = st.events.find((e) => e.kind === "response")?.stage;

  return {
    seed,
    outcome,
    reachedStage: st.reachedStage,
    reachedIndex: st.reachedIndex,
    detectedAtStage,
    events: st.events,
    dwellHours: Math.round(st.time),
    adversaryCost: Math.round(st.cost),
    adversaryNet: net,
    defenderLoss: loss,
  };
}

export { TECHNIQUE_BY_ID, TECHNIQUES_BY_STAGE };
