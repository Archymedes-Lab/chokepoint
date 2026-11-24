<div align="center">

# 🛡️ Chokepoint

**A dynamic, agent-based simulator of the cybercrime ecosystem — for defenders,
authorities, and researchers.**

Watch thousands of offenders act on their *motivations*, see the damage ripple through a
nation's economy in real time, and find the policy lever that actually reduces harm —
instead of just displacing it.

`Apache-2.0` · `TypeScript + React` · `No backend` · `Defensive / educational use only`

</div>

---

## The idea

Cybercrime looks like chaos. It isn't. It's a population of people responding to
incentives — money, hardship, ideology, status, cheap tooling — inside an economy of
targets, under a set of authorities who can only afford to do so much. Model the
*motivation* and the *dynamics*, and the chaos becomes legible: you can see **why**
offending rises, **where** the harm lands, and **which** response works against **which**
kind of offender.

That's the thesis of this project, and the reason it's open: **understanding how and why
they operate — out in the open — is how defenders and authorities get ahead of them.**

It is built as **a study of how to actually prevent cybercrime**, so its dynamics are
anchored to the latest public data (Coveware, Verizon DBIR, Mandiant M-Trends, IBM, FIDO
Alliance). The central, evidence-based mechanism: **a breach almost always does harm, but
only ~23% of victims pay** — and only payment funds the attacker and recruits the next one.
So defence and a no-pay posture don't just block attacks, they *starve the ecosystem*. See
[docs/CALIBRATION.md](docs/CALIBRATION.md).

Chokepoint has two linked models:

### 1. Ecosystem (the main view) — a 2D agent-based world

A pixel-art landscape of economic sectors (finance, crypto, government, critical
infrastructure, healthcare, retail). **Thousands of offender agents**, each with a
motivation and a disposition, move through it and choose targets by **expected utility**:

- **Psychology, not scripts.** Each offender weighs reward (scaled by greed and cash-out
  ease) against the certainty and severity of punishment and the moral cost of the harm.
  Deter them and they lie low or quit; harden one sector and they **displace** to softer
  ones. Behaviour emerges.
- **External causes.** Sliders for economic strain, tooling availability, perceived
  impunity, cash-out ease, and social contagion — the forces that grow or shrink the
  population.
- **Defenders and the state, visible.** SOC / blue-team units (blue) hunt the noisiest
  offenders and patch weak targets; government takedowns (amber) strike infrastructure.
  Fund the levers and more of them appear on the board.
- **Authority levers on a limited budget.** Arrests, infrastructure takedowns, cash-out
  disruption, defensive uplift, international cooperation, and upstream diversion — you
  can't fund them all, so you must prioritise.
- **Damage in many dimensions.** Direct loss, recovery cost, GDP health, public trust,
  downtime, records stolen, victims, breaches — rippling across interdependent sectors.
- **An advisor that decomplexifies.** It reads the live population and names the
  highest-leverage move, and why — the right lever changes as the population changes.
- **Forensic inspection.** Click any offender to read their profile, history, and the
  live reasoning behind their next move.

### 2. Encounter (the drill-down) — one org vs. one adversary

Zoom all the way in: a single organisation's defensive posture against a single
adversary moving through the intrusion value chain (access → foothold → escalation →
exfil/extortion → cash-out). Step through one intrusion, or run thousands to rank which
controls break the chain. The forensic companion to the population view. See
[docs/MODEL.md](docs/MODEL.md).

## What this is **not**

An **abstract, probabilistic model** — it simulates *motivation, decisions, and
outcomes*, never mechanisms. It contains **no exploit code, no payloads, no operational
attack detail**, runs entirely in the browser, and makes no network calls. It is a
decision-support and teaching tool for defenders, authorities, and researchers — not an
attack tool. See [docs/ETHICS.md](docs/ETHICS.md).

---

## Quickstart

Requires [Bun](https://bun.sh) (or Node 18+ with npm).

```bash
bun install
bun run dev        # http://localhost:5173
```

Build a static bundle (host it anywhere — there's no server):

```bash
bun run build
bun run preview
```

## Using the ecosystem

1. **Press play** and watch the population operate. Red pulses are breaches; sectors
   redden as their economy takes damage.
2. **Move the external-cause sliders** — raise economic strain or tooling availability and
   watch recruitment and the motivation mix shift.
3. **Pull the authority levers** — but mind the enforcement-budget meter. Try "arrests
   only," then "cash-out disruption + cooperation," then "diversion." Compare the GDP,
   trust, and loss metrics.
4. **Read the advisor**, and test it: does the lever it recommends actually move the
   numbers more than the others?
5. **Harden everything** and watch harm concentrate in the softest sectors — that's
   displacement, and it's why enforcement and root-cause work have to go together.
6. **Click an offender** to see who they are and why they're doing it.

---

## Who it's for

- **Defenders & CISOs** — reason about posture and prioritise controls (Encounter view).
- **Authorities & policymakers** — compare interventions and see displacement before it
  happens (Ecosystem view).
- **Forensic & intelligence analysts** — a readable behavioural model of offender
  motivation and decision-making.
- **Educators & researchers** — an interactive way to teach the criminology and economics
  of cybercrime.

## Documentation

| Doc | What's in it |
|-----|--------------|
| [CALIBRATION.md](docs/CALIBRATION.md) | What the model is anchored to in 2025–26 data, the harm-vs-revenue correction, and validation runs. |
| [WORLD.md](docs/WORLD.md) | The ecosystem model: agents, psychology, drivers, levers, metrics, the advisor, displacement. |
| [MODEL.md](docs/MODEL.md) | The Encounter model: stages, decision function, resolution, economics. |
| [CATALOG.md](docs/CATALOG.md) | Stages, techniques, controls, and archetypes for the Encounter model. |
| [METHODOLOGY.md](docs/METHODOLOGY.md) | How parameters were calibrated; what the model does and does **not** claim. |
| [ETHICS.md](docs/ETHICS.md) | Scope, intended use, and why this is safe to publish openly. |
| [EXTENDING.md](docs/EXTENDING.md) | Add motivations, controls, sectors, interventions; run the models headless. |
| [SOURCES.md](docs/SOURCES.md) | The criminology, policy, and threat research behind the models. |

## Repository layout

```
src/
├── world/      ← the 2D ecosystem model (agents, psychology, render) — PRIMARY
├── sim/        ← the value-chain Encounter model (engine, catalog) — drill-down
├── ui/         ← React views: Ecosystem, WorldControls, WorldDashboard, Inspector,
│                 PosturePanel, SingleRun, MonteCarlo
└── App.tsx
docs/           ← WORLD · MODEL · CATALOG · METHODOLOGY · ETHICS · EXTENDING · SOURCES
```

Both model cores are plain TypeScript with no UI dependency — import them into a notebook
or your own tooling (see [docs/EXTENDING.md](docs/EXTENDING.md)).

## Contributing

Issues and PRs welcome — especially calibration backed by public research. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ETHICS.md](docs/ETHICS.md): contributions
stay at the behavioural/abstraction level, never operational attack detail.

## License

[Apache-2.0](LICENSE). Offered for defensive security, policy analysis, research, and
education.
