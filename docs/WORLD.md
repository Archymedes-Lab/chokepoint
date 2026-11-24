# The Ecosystem Model (2D Agent-Based Simulation)

The ecosystem view is Chokepoint's primary model: a **real-time, agent-based
simulation** of the cybercrime population. Thousands of offender agents, each with a
motivation and a disposition, move through a landscape of economic sectors, choose
targets by **expected utility**, and generate harm you can watch ripple across
interdependent districts. Authorities pull policy levers; the population responds; macro
patterns — deterrence, desistance, **displacement** — emerge rather than being scripted.

It is a criminological decision-support and teaching tool. It models offender
*motivation, choices, and population dynamics*. It is abstract: agents reason about
**sectors of the economy**, never about mechanisms, and the simulation performs no
real-world action. See [ETHICS.md](ETHICS.md).

---

## 1. Why a population model

A single intrusion (the [Encounter model](MODEL.md)) answers "which control stops this
attacker." But the questions authorities and strategists actually face are collective:

- Where does the offender population *come from*, and what makes it grow?
- If you arrest, take down infrastructure, disrupt cash-out, harden targets, or invest
  upstream in diversion — which one actually reduces national harm, and which just
  **displaces** it?
- How do motivation and external conditions change which lever works?

Those are emergent, population-level questions. They need many interacting agents, not
one. This model is grounded in the criminology of cybercrime — Routine Activity Theory,
Rational Choice Theory, deterrence theory, strain theory, and crime-displacement
research (see [SOURCES.md](SOURCES.md)).

## 2. The world

A 2D landscape of six **sectors** (Finance, Crypto/Exchanges, Government, Critical
Infrastructure, Healthcare, Retail & SMB). Each sector has:

- a share of the economy (`gdpWeight`) and a societal-**harm** weight (healthcare and
  critical infrastructure score highest);
- a **baseDefense** (raised by the hardening lever) and many **target nodes** (orgs)
  with their own value, local defence, and operational health;
- **coupling** to other sectors — damage to finance or critical infrastructure drags its
  neighbours down (economic cascade).

Sector economies are 0–100 health with **proportional recovery**, so harm settles at an
equilibrium set by the attack rate rather than collapsing to zero.

## 3. The offenders

Each agent carries a **motivation** and a disposition (skill, risk tolerance, conscience,
greed, deterrability, an aspiration level, accumulated wealth, and heat/notoriety). The
five motivations (see [psychology.ts](../src/world/psychology.ts)) abstract the
typologies that recur in the literature:

| Motivation | In a sentence | Hit hardest by |
|------------|---------------|----------------|
| **Economic / strain** | Money and hardship; pragmatic, chases payout. | Cash-out disruption, diversion |
| **Professional / organised** | Calculating, ROI-driven, low risk appetite. | Takedowns, cash-out disruption |
| **Ideological / grievance** | A cause, not money; targets "the system". | International cooperation |
| **Thrill / status** | The challenge and notoriety; often young. | Peers / diversion, not prison |
| **Opportunistic / low-skill** | Enabled entirely by cheap tooling. | Takedowns |

### The decision (the "why")

When an agent seeks work it samples a handful of targets and picks the one with the
highest **expected utility**:

```
EU = pSuccess · reward        (reward scaled by greed, cash-out ease, sector bias,
                               and — for status-seekers — notoriety)
   − pCaught · severity · deterrability
   − morality · moralWeight · sectorHarm       (conscience; overridden for ideologues)
   − effort (distance + capability gap)
```

If even the best option is negative, the agent is **deterred** — it lies low or desists.
Change a driver, a defence, or an intervention and the utilities move, so targeting,
persistence, and desistance all **emerge**. This is Rational Choice / Routine Activity
theory made executable: a motivated offender, a suitable target, and the absence of a
capable guardian.

## 4. External causes (drivers)

Five macro drivers — the forces outside any one offender — shape recruitment and
behaviour:

- **Economic strain** → more economically-motivated entrants, more risk-taking.
- **Tooling availability** (cheap RaaS/kits) → lowers the skill barrier; breeds opportunists.
- **Perceived impunity** → entry and boldness.
- **Cash-out ease** (crypto liquidity) → realised reward.
- **Social contagion** → visible success recruits imitators of whatever type is winning.

## 5. Authority levers (interventions)

Each lever is a 0–1 investment with a cost; together they draw on a limited **enforcement
budget**, so authorities must *prioritise* — you cannot max everything, which is the
whole point.

| Lever | Mechanism in the model |
|-------|------------------------|
| **Arrest certainty** | Raises probability of being caught → deterrence + incapacitation (jailing). |
| **Infrastructure takedowns** | Lowers effective tooling availability → raises the skill barrier. |
| **Cash-out disruption** | Cuts realised reward → collapses profit-driven EU. |
| **Defensive uplift (hardening)** | Raises sector baseDefense → fewer suitable targets (watch displacement). |
| **International cooperation** | Extends reach into safe-haven jurisdictions; makes arrests stick. |
| **Diversion programs** | Reduces strain-driven recruitment and raises desistance — the root-cause lever. |
| **Ransom-payment ban / norm** | Suppresses ransom payment directly — cheap on budget, politically fraught, but it cuts the attacker's revenue (and thus recruitment) at the source. |

Interventions feed back into the **effective drivers** (e.g. arrests lower perceived
impunity; takedowns lower tooling availability; cash-out disruption lowers crypto
liquidity), which is how enforcement changes the conditions that produce offenders.

### Defender & government units (visible activity)

The response isn't abstract — you watch it operate:

- **Defender / SOC units** (blue) are fielded in proportion to the *defensive uplift*,
  *arrest certainty*, and *cooperation* investments. They hunt the noisiest active
  offenders, close in faster than offenders move, and attempt a capture on contact
  (harder against safe-haven offenders unless cooperation is funded); between pursuits
  they **patch** weak nodes, raising local defence. Their captures, and the nodes they
  patch, are tracked in the Defence & Government Activity panel.
- **Government takedown strikes** (amber) fire periodically when the *takedown* lever is
  funded, hitting high-value infrastructure (crypto, critical, finance first), hardening
  those nodes, and posting to the investigator feed.

So the same levers that shift the *conditions* also put more blue units and more strikes
on the board — the visible hand of the defence and the state.

## 6. Dynamics each tick

1. **Recruitment** — new agents spawn at a rate driven by strain, tooling, impunity, and
   contagion, dampened by diversion. Their motivation mix reflects the current drivers.
2. **Agent step** — a state machine: `seek → travel → operate → cash`, with `lay_low`
   (deterred), `jailed` (incapacitated, then recidivism or desistance), and `desisted`.
3. **Resolution** — an attempt succeeds against `skill − defence`; success damages the
   node and sector economy, pays the offender (scaled by cash-out ease), raises heat and
   contagion, and books harm across every metric. The hit node's defences nudge up
   (adaptive defender).
4. **Economy** — sectors recover proportionally, cascade drag flows across couplings,
   node defences fade, hardening raises baselines, public trust recovers.
5. **Metrics & events** — harm aggregates; notable breaches and arrests post to the
   investigator feed.

## 7. Multiple dimensions of damage

Harm is deliberately *not* a single number. The dashboard tracks **direct financial
loss, recovery cost, GDP health, public trust, downtime hours, records stolen, victim
organisations, and breaches**, plus per-sector economic health and the live motivation
mix. Different interventions move different metrics — which is exactly the trade-off
authorities must reason about.

## 8. Displacement — the honest result

Hardening targets without addressing motivation tends to **displace** offenders toward
softer sectors (healthcare and retail stay least-defended) rather than remove them from
the game — visible in the per-sector economy bars and reflected in the advisor's caveat.
This is one of the most important and most ignored findings in crime prevention, and the
model surfaces it on purpose.

## 9. The advisor ("decomplexify")

The advisor reads the live population and names the single highest-leverage response,
scoring each lever by the pressure it would relieve **minus what you've already invested
in it** (so a maxed lever won't be recommended again, and the advice tracks the shifting
population). It embodies the project's thesis: *once you can see the motivation driving
the harm, the right response stops being a guess.*

## 10. Forensic inspection

Click any offender to open its **forensic profile**: motivation, disposition meters,
history (proceeds, aspiration, ops, times caught), and the live expected-utility
reasoning behind its current move — a readable behavioural attribution for investigators
and students.

## 11. Determinism & performance

All randomness is from a seedable PRNG, so a world is reproducible from its seed. The
model runs up to ~5,000 concurrent agents on a fixed step; the UI renders a pixel canvas
at animation-frame rate and advances the simulation 1–8 steps per frame (the speed
control).

## 12. Limitations

Calibrated for **relative, qualitative** realism, not prediction of any real population.
Among the simplifications: a single landscape and economy; coarse sector coupling; linear
coverage/effort; no within-agent learning beyond heat; no explicit markets, forums, or
affiliate structures (those live in the Encounter model); and policy effects that are
immediate rather than lagged. See [METHODOLOGY.md](METHODOLOGY.md) for the calibration
philosophy, which applies to both models.
