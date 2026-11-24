# Calibration & Reality Check

Chokepoint is a *study of how to prevent cybercrime*, so its dynamics are anchored to the
latest public measurements rather than invented. This document records what the model is
calibrated against, where it matches reality, where it deliberately abstracts, and how it
was validated. Figures are 2025–2026 unless noted.

> The model encodes **relative** realism — orderings, elasticities, and the direction and
> rough magnitude of effects — not point predictions for any specific organisation or
> country. See [METHODOLOGY.md](METHODOLOGY.md).

---

## 1. The anchors

| Model behaviour | Real-world anchor (2025–26) | Source |
|---|---|---|
| **Ransomware payment rate ≈ 23%** (baseline, falling with defence) | 23% of victims paid in Q3 2025, down from 28% in Q1 2024 — a six-year decline | Coveware Q3 2025 |
| **Data-theft-only payment rate ≈ 19%** | 19% for extortion without encryption | Coveware Q3 2025 |
| **A breach harms even when unpaid; only payment funds the attacker** | Avg ransom payment fell to ~$140k (from ~$377k); global breach cost *fell* for the first time in 5 years | Coveware; IBM *Cost of a Data Breach 2025* |
| **Credential theft / infostealers = dominant initial access** | "Credential theft is the dominant initial access vector"; 3.3B credentials & 11.1M infected hosts in 2025 | Recorded Future; Flashpoint |
| **Exploitation of edge services rising; phishing waning** | Exploitation up ~34% as an access vector; stolen creds & perimeter exploits rising while phishing declines | Verizon DBIR 2025; Mandiant M-Trends 2025 |
| **Phishing-resistant MFA (FIDO2/passkeys) ≈ hard stop on AiTM** | Passkeys prevent phishing by design; passkey sign-ins 93% vs 78% success; every measured deployment reports fewer successful attacks | FIDO Alliance *Passkey Index 2026*; Okta |
| **Backups collapse ransom leverage** | Recoverable victims pay far less often; declining payments attributed to better protection + LE guidance not to pay | Coveware; IBM 2025 |
| **Takedowns displace rather than eliminate** | Rival gangs absorb affiliates after competitor takedowns; LockBit/Cronos saw rebound & rebranding | Cybersecurity Dive; Operation Cronos analyses |
| **Deterrence is *restrictive*, not absolute** | Randomised field trials: certainty/messaging reduces the *scope* of reoffending, not the existence of offenders | Maimon, Howell & Burruss (2021) |
| **Harm scale is national** | Global cybercrime cost ≈ $10.5T in 2025 (→$12.2T by 2031) | Cybersecurity Ventures |
| **Ransomware dwell ≈ days** | Ransomware median dwell ~6 days; global median 11 days | Mandiant M-Trends 2025 |
| **Detection latency in days** | Ransomware detected in ~19 days (loud); stealthier malware ~93 | Breach-filing analysis (1,031 filings) |
| **Breach lifecycle ~241 days** | Mean time to identify + contain; global breach cost $4.44M | IBM 2025 |
| **Investigations run 1–3 years; low clearance** | FBI CFAA hacking cases typically 1–3 years; cybercrime is uniquely hard to investigate/prosecute | FBI/legal analyses |
| **Capability takes months to field** | Standing up enforcement/defence is slow; takedowns (Cronos) are multi-year ops | Operation Cronos analyses |
| **Offenders sit in tiered jurisdictions; some shielded** | Non-cooperating safe havens; Russia's ecosystem is a state-controlled market with "controlled impunity" shielding state-useful actors | Recorded Future *Dark Covenant 3.0*; CyberPeace Institute |
| **Enforcement reach is cooperation-gated** | International cooperation hinges on harmonised law and MLATs; attribution is hard and slow | UNODC Cybercrime Module 7; attribution literature |
| **Harm is disclosed late** | Breach notification/disclosure trails discovery (regulatory lag), which itself trails the breach | Breach-notification analyses; IBM lifecycle |
| **Sectors pay at different rates** | Healthcare pays well above average (~36% in 2025, down from 61% in 2022); energy/tech highest average ransom (~$1.67M), healthcare second | Fierce Healthcare; Statista; TechTarget |
| **AI is scaling attacks** | 2025 "AI Oversight Gap": AI used across phishing and recon; shadow AI adds ~$670k to breach cost | IBM 2025 |

Full citations in [SOURCES.md](SOURCES.md).

### Sectors, AI, and scenarios

- **Sector payment propensity.** The ~23% baseline is a weighted average; each sector
  carries a multiplier so healthcare and critical infrastructure pay more (≈35%) and retail
  less, matching the sector breakdowns.
- **AI-enabled attacks.** A driver that lowers the effective skill barrier and swells the
  low-skill inflow (more opportunists), reflecting generative AI in phishing/recon.
- **Scenario presets.** Seven named worlds (`src/world/scenarios.ts`) set the drivers and
  levers together as an established regime, for side-by-side comparison. Validation of their
  steady states: Resilient Nation collapses the ecosystem (pay 2%, revenue ≈ $0, GDP 100);
  Safe-Haven Impunity lets it thrive (clearance ~5%, highest revenue); Payment Ban cuts the
  pay rate to ~11% without stopping attacks; Coordinated Crackdown halves the population but
  runs far over budget.

### Jurisdiction & disclosure (two more realism layers)

- **Origin jurisdiction.** Each offender operates from a *domestic* (reachable), *partner*
  (reachable with cooperation), or *non-cooperating haven* jurisdiction, and a share of
  haven actors are **shielded** — controlled impunity that enforcement can't touch
  regardless of cooperation. So the cooperation lever has a concrete, visible effect:
  raising it reaches into partners and havens (validation: more arrests and fewer breaches
  under high cooperation), while the shielded persist. View it with the **Origin** colour
  lens and the "offenders by origin" breakdown.
- **Disclosure lag.** Harm is booked to the model's truth immediately, but the *disclosed*
  figures authorities see trail reality by weeks (first-order lag), so the dashboard shows
  "disclosed breaches" and an "undisclosed (pending)" gap — a reminder that the picture is
  always an undercount and interventions are chosen on stale data.

### Response timescales (what makes the response realistically slow)

Time is explicit: **1 tick = 6 hours** (≈1,460 ticks per simulated year), shown as a day
clock. Three mechanisms make enforcement slow and leaky, as it is in reality:

- **Policy lag.** A funded lever (the slider) is only *fielded* capability after a
  first-order ramp of months — so moving a slider doesn't bite immediately. The sidebar
  shows "fielded X% of funded".
- **Investigations build over time.** A defender in contact accrues a *case* against an
  offender; an arrest is attempted only once the case is built, and reach into safe havens
  depends on cooperation. Most cases go cold — in-the-act capture is rare.
- **Low clearance.** The net effect is a clearance rate in the single digits under weak
  enforcement (validation: ~6.7%), rising to a minority even when arrests are heavily
  funded — never approaching 100%. Mean time to arrest lands in months. Enforcement mostly
  *deters*; it rarely incapacitates.

## 2. The core correction: harm ≠ attacker revenue

The most important calibration is that **a breach almost always does damage but only
sometimes produces revenue**. Earlier versions paid the attacker on every successful
breach; reality pays them ~1 in 4 times, and that gap is the whole point of prevention.

In the model:

- **Victim harm** (financial loss, recovery cost, downtime, records, trust) is booked on
  **every** breach.
- **Attacker revenue** is booked only when a payment roll succeeds. The baseline
  probability is **0.23**, suppressed by defensive uplift, local hardening, and cash-out
  disruption.
- **Recruitment / contagion is driven by revenue, not intrusion.** A *paid* hit recruits
  imitators far more than an unpaid one. So collective defence and a no-pay posture shrink
  the offender population over time — modelling Coveware's observation that "each avoided
  payment constricts cyber attackers of oxygen."

This is why the simulation is a prevention study: you can watch the ecosystem **starve**
when payments dry up, not just watch individual attacks fail.

## 3. Validation runs

A 1,500-tick batch (seed fixed) reproduces the expected directions:

| Posture | Payment rate | Attacker revenue | Victim loss | Population |
|---|---|---|---|---|
| Baseline (weak) | **22.8%** | $29.9M | $279M | 4,152 |
| Hardened + enforcement | ~24% *(of far fewer breaches: 71 vs 3,849)* | **$0.3M** | $2.5M | 1,886 |
| Cash-out disruption | **18.0%** | $10.3M | $260M | 4,025 |
| Diversion (root-cause) | 22.5% | $21.6M | $210M | 2,036 |

Readings that match the literature:

- **Baseline payment rate lands on 23%** — the headline Coveware figure.
- **Hardening starves the ecosystem**: breaches and attacker revenue collapse together;
  harm falls ~100×. Defence is the dominant harm-reducer.
- **Cash-out disruption cuts revenue without cutting breach volume** — it attacks the
  *money* (payment rate 23%→18%, revenue down two-thirds), matching the
  intermediary-focused disruption literature.
- **Diversion shrinks the population** by cutting recruitment at the source, with a smaller
  immediate harm effect — enforcement displaces, root-cause work reduces inflow.

Reproduce with the headless harness in [EXTENDING.md](EXTENDING.md).

## 4. What is deliberately abstract

- **Absolute dollars are illustrative.** `targetValue` is an abstract stake; payouts and
  losses are fractions of it. The model reproduces payment *rates*, *elasticities*, and
  *orderings*, not a specific organisation's invoice.
- **One landscape, one pass.** No campaigns, re-entry after eviction, or multiple
  simultaneous actors in a single run (the ecosystem handles population turnover instead).
- **Policy effects are immediate**, where real interventions lag by months.
- **Calibration is to Western/enterprise-heavy reporting** (Coveware, Mandiant, Verizon,
  IBM), which under-counts some regions and the long tail of SMB/consumer fraud.

## 5. How to keep it honest

When the next DBIR / M-Trends / Coveware / IBM figures land, update the anchors in §1,
re-tune the few constants they bear on (payment baseline in `model.ts` and
`engine.ts`; access-vector base-success in `catalog/techniques.ts`; dwell and detection
constants), re-run §3, and record the change. The goal is a model whose *relative*
conclusions a practitioner would still recognise as true.
