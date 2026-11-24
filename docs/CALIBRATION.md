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

Full citations in [SOURCES.md](SOURCES.md).

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
