# The Chokepoint Model

This document specifies exactly how the simulation works: the state it tracks, how an
agent decides what to do, how attempts resolve, how detection and eviction fire, and
how outcomes turn into money. It is the reference for anyone reading `src/sim/engine.ts`.

> **Framing.** Every number here is an *abstraction-level calibration value* encoding
> relative difficulty, noise, and cost — not a measurement and not a mechanism. The
> model answers "which posture produces better outcomes against which adversary," not
> "how is any technique performed." See [METHODOLOGY.md](METHODOLOGY.md) and
> [ETHICS.md](ETHICS.md).

---

## 1. The value chain (stages)

An operation proceeds through up to five ordered stages. Which stages apply depends on
the adversary's **goal** (§5).

| # | Stage | ATT&CK | Meaning |
|---|-------|--------|---------|
| 0 | **Initial Access** | TA0001 | Get a foothold. |
| 1 | **Foothold & Evasion** | TA0002/3/5 | Execute, persist, evade. |
| 2 | **Escalate & Move** | TA0004/6/8 | Harvest credentials, reach the crown jewels. |
| 3 | **Exfil & Extortion** | TA0010/0040 | Steal data, destroy backups, encrypt. |
| 4 | **Monetize & Launder** | — | Collect and launder the proceeds. |

## 2. Objectives

Each stage is expressed as one or more **objectives**. An objective is *required* or
*optional* and owns a small set of candidate techniques. The agent must complete each
required objective (succeed at one of its techniques) to advance. Optional objectives
(e.g. *disable endpoint defences*, *harvest credentials before moving*) are attempted
only when the agent judges them worthwhile, and are skipped after a single miss.

One objective per goal is flagged **isBreach** (reaching it = impact has occurred) and
one is flagged **isCashout** (monetisation).

## 3. Run state

A single run (`RunState`) tracks:

- `heat` ∈ [0,1] — accumulated detection pressure.
- `cost`, `time`, `budget` — resource units spent, dwell hours, resources remaining.
- `inside` — whether initial access has been achieved.
- `edrBlinded` — endpoint defences were disabled this run.
- `credStolen` — credentials harvested (boosts lateral movement).
- `doubleExtortion` — data was exfiltrated before encryption (raises ransom leverage).
- `reachedImpact`, `cashedOut`, `detectedLate` — economic flags.
- `events[]` — the ordered, narrated log.
- `terminal` — set when the run ends early (blocked / evicted / abandoned).

## 4. The decision function (the behavioural core)

At each objective the agent scores every affordable, skill-feasible candidate technique
and chooses via a softmax (temperature ¼), so similar options vary between runs:

```
score(t) =  effSuccess(t)          · (1 − 0.6 · det(t) · riskAversion)
          − 0.5 · (cost(t)/budget)                      ← budget pressure
          − 0.15 · det(t) · riskAversion                ← flat risk penalty
```

where `riskAversion = 1 − agent.riskTolerance`. The consequence:

- A control that drives `effSuccess` down or `det` up makes a technique *unattractive*,
  so the agent **chooses a different route** — emergent, posture-driven behaviour.
- Risk-averse agents (sophisticated intruder) weight detection heavily and avoid noisy
  techniques; risk-tolerant ones (smash-and-grab) push through.

### Effective success

```
effSuccess(t) = baseSuccess(t) · Π over enabled controls c countering t:
                   (1 − reduction(c))

reduction(c) = block(c) · coverage(c) · softFactor
softFactor   = 1                       if the effect is "hard"
             = (1 − 0.4 · skill)       otherwise   ← skill erodes soft controls
```

A **hard** control (e.g. FIDO2 vs. AiTM phishing, no-RDP vs. bought access) cannot be
skilled around; at full coverage it nearly zeroes the technique. A **soft** control is
partially overcome by a capable operator. If the agent blinded EDR this run, EDR-based
reductions are cut to 30%. Harvested credentials add +0.10 to lateral-movement success.

### Detection pressure per attempt

```
det(t) = clamp01(
           inherentNoise(t) · (1 − 0.3 · skill) · 0.22      ← quieter when skilled
         + Σ over enabled controls c countering t: detect(c) · coverage(c)
         )
```

Each attempt adds `det(t)` to `heat` (clamped at 1). Between phases, `heat` **decays**
to 68% of its value — attackers pace themselves and defender alertness cools. This decay
is why a patient operation can slip through where a rushed one trips the wire.

## 5. Goal-specific paths

| Goal | Objective path |
|------|----------------|
| `ransomware` | access → *(edr_kill?)* → lotl → *(cred_harvest?)* → lateral → *(exfil?)* → **encrypt** → launder |
| `data-theft` | access → *(edr_kill?)* → lotl → *(cred_harvest?)* → lateral → **exfil** → launder |
| `bec` | access(phish) → **bec_wire** → mule_cashout |
| `access-resale` | access → **sale** (resolved directly; the broker's payday) |

Parentheses = optional objectives.

## 6. Detection, response, and termination

After every attempt (and after each success) the model checks for a defender response:

```
if heat ≥ responseThreshold:
    over        = (heat − threshold) / (1 − threshold)
    respChance  = responsiveness · lerp(0.3, 1, over)
    if roll(respChance):
        if impact already reached  → detectedLate = true   (limits damage, not terminal)
        else if inside             → EVICTED  (terminal)
        else                       → BLOCKED  (terminal; caught at the perimeter)
```

Other terminations:

- **Retreat** — if the agent is inside, pre-impact, and `heat` exceeds its
  `riskTolerance` by more than 0.25, it may abandon to avoid attribution (more likely
  the more risk-averse it is).
- **Out of options** — no affordable/feasible technique for a required objective →
  *blocked* (at access) or *abandoned* (inside).
- **Out of budget** — resources exhausted mid-objective → abandoned/blocked.

### Outcomes

| Outcome | Meaning | Defender |
|---------|---------|----------|
| `blocked` | Never got a foothold. | ✅ win |
| `evicted` | Detected and removed before impact. | ✅ win |
| `abandoned` | Gave up (too hot / out of budget). | ✅ win |
| `breached` | Reached impact. | ❌ loss |
| `cashed_out` | Reached impact **and** monetised. | ❌ loss |

(Because laundering rarely fails *operationally*, most impact-reachers land in
`cashed_out`; `breached` is the small remainder who hit impact but couldn't move the
money. Treat `breached + cashed_out` as the **breach rate**.)

## 7. Economics (abstract units)

`targetValue` (what's at stake, in dollars) scales everything. Resource units are an
abstract effort currency and are intentionally *not* converted to dollars in the net —
they stay small relative to payouts, so `adversaryNet ≈ realised payout share`.

**Payout & payment probability** (sampled per run):

- *Ransomware*: ransom ≈ `v·0.06`; pay-probability starts at 0.5, is cut by immutable
  backups (`×(1 − 0.55·coverage)`), raised by double-extortion (`+0.2`), lowered if
  detected late. Operator takes 20% (affiliate keeps 80%). Laundering friction 20%
  (60% if cash-out failed). Defender loss = downtime (`v·0.08` with good backups, else
  `v·0.22`) + ransom if paid.
- *Data-theft*: extortion ≈ `v·0.03`, pay-probability ~0.35; defender loss `v·0.08` +
  payment.
- *BEC*: diverted wire ≈ `v·0.04`, pay-probability ~0.7; defender loss = the wire.
- *Access-resale*: sale price `clamp(v·0.002, $1k, $50k)`; the broker's payday.

**Defender loss floor** by terminal state (if impact not reached): blocked `v·0.005`;
abandoned `v·0.01·(stage+1)`; evicted `v·0.03·(stage+1)` — later evictions cost more.

## 8. Leverage analysis

For a fixed `(archetype, posture)`, the baseline batch is run, then for **each enabled
control** the batch is re-run with that one control disabled. The reported `breachDelta`
is the percentage-point rise in breach rate from removing it; `lossDelta` the rise in
mean defender loss. Controls are ranked by `breachDelta`. This is **counterfactual** and
**posture-specific**: a control scores high only when it plugs a gap nothing else covers
against *this* adversary. Change the posture and the ranking changes — that's the point.

## 9. Determinism

All randomness comes from a seedable `mulberry32` PRNG. A single run is pure in
`(archetype, posture, seed)`; a batch derives distinct per-run seeds from a base seed.
Comparisons between postures are therefore attributable to the controls, not to noise.

## 10. Tunable constants

All in one `K` block at the top of `engine.ts`: `skillPunch`, `skillQuiet`,
`edrBlindFactor`, `noiseWeight`, `heatDecay`, `retreatMargin`,
`maxAttemptsPerObjective`, `credHarvestBoost`. Calibration rationale is in
[METHODOLOGY.md](METHODOLOGY.md).
