# Ethics, Scope & Responsible Use

Chokepoint exists to help defenders. This document states plainly what it is for, what
it deliberately is not, and why it is safe to publish as open source.

## Intended use

- **Defensive planning.** Reason about your security posture and prioritise controls
  (Encounter model).
- **Policy analysis.** Compare authority interventions — arrests, takedowns, cash-out
  disruption, hardening, cooperation, diversion — and see displacement before committing
  to it (Ecosystem model).
- **Education & training.** Teach how the cybercrime ecosystem is structured, what
  motivates offenders, and why specific controls and policies are high-leverage. Useful
  for SOC onboarding, tabletop prep, policy workshops, and criminology teaching.
- **Forensic & intelligence reasoning.** A readable behavioural model of offender
  motivation and decision-making.
- **Communication.** Give leaders and policymakers a concrete, interactive way to show
  *why* a control or intervention matters, in outcome terms.

## On studying motivation openly

This project deliberately models offender **motivation and psychology** — the "why." That
is not a transgression; it is standard criminology, and it is how deterrence, diversion,
and disruption are designed. Understanding why people offend, and modelling it in the
open, is a defender's and an authority's advantage — not a gift to offenders, who already
know their own motives. Everything here stays at the level of *motivation, incentives, and
population dynamics*; none of it describes how to carry out an attack.

## Scope boundary (what keeps this safe)

Chokepoint is an **abstraction-level model**. It deliberately contains **none** of the
following, and contributions adding them will be declined:

- No exploit code, payloads, scripts, or tooling.
- No step-by-step procedures for any technique.
- No real indicators, infrastructure, credentials, or targeting data.
- No evasion recipes, no "how to defeat control X" instructions.

A technique in this model is a *labelled node with a few numbers*. "Adversary-in-the-
middle phishing, base success 0.6, countered hard by FIDO2" tells a defender what to
prioritise; it tells no one how to run a phishing operation. That line — **behaviour and
outcomes, yes; mechanism, no** — is the project's design invariant.

## Why open-sourcing this is appropriate

The structure of the cybercrime value chain, the role of initial access brokers and RaaS
affiliates, and the controls that counter them are **well-documented in public vendor,
academic, and government research** ([SOURCES.md](SOURCES.md)). This project synthesises
that public knowledge into a defensive decision tool. It gives defenders leverage without
handing attackers anything they do not already have — attackers do not need a blue-team
prioritisation simulator.

## Runtime safety

- **No backend, no telemetry, no network calls at runtime.** The app is a static bundle
  that runs entirely in the browser. It does not phone home and collects nothing.
- **No data about you.** The only persistence is a theme preference in `localStorage`.

## Operator responsibility

The model's outputs are for reasoning, not for quoting as your organisation's measured
risk. Validate conclusions with **authorised** testing (your own red team, or a
contracted assessment with written rules of engagement). Never use any security tool —
including conclusions drawn from this one — against systems you are not authorised to
test.

## Reporting a concern

If you believe a change has pushed the project past the scope boundary above — or you
find anything resembling operational detail — please open an issue or follow
[SECURITY.md](../SECURITY.md). We would rather over-correct toward abstraction.
