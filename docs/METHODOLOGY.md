# Methodology & Calibration

How the numbers were chosen, what they mean, and — just as important — what this model
does **not** claim.

---

## What kind of model this is

Chokepoint is a **stochastic, agent-based abstraction** of the cybercrime value chain.
It is closest in spirit to an operational-risk or epidemiological model: it does not
reproduce mechanisms, it reproduces *dynamics*. The unit of analysis is a decision —
"attempt technique X at stage Y given this posture" — resolved as a probability.

This design is deliberate. A defender's questions are about **leverage and prioritisation**:

- If I can fund one more control this quarter, which one moves my risk the most?
- Against a ransomware affiliate vs. a BEC crew, do my priorities change?
- How much does coverage (deployment completeness) matter vs. having the control at all?

Those questions are answerable with calibrated *relative* numbers and emergent agent
behaviour. They do **not** require — and this model does not contain — any operational
detail about how techniques are performed.

## How parameters were calibrated

The catalog numbers (`baseSuccess`, `noise`, `cost`, `skillReq`, and control
`block`/`detect` effects) were set to reproduce **qualitative findings that recur across
public threat research** (see [SOURCES.md](SOURCES.md)). The calibration targets were:

1. **Ordering of initial-access vectors.** Bought access and infostealer logins are the
   cheapest, highest-yield front doors; edge exploitation and help-desk social
   engineering cost more and demand more skill. Reflected in `cost`/`skillReq`/`base`.
2. **Hard vs. soft controls.** Research is consistent that *phishing-resistant MFA
   defeats AiTM by design*, that *no-RDP removes the brokers' top vector*, and that
   *out-of-band callback defeats most BEC*. These are modelled as `hard` effects a
   skilled operator cannot erode. EDR, by contrast, mostly makes activity **noisy** —
   it detects more than it blocks — so its effects are weighted toward `detect`.
3. **Backups don't stop encryption; they remove its leverage.** Modelled in economics
   (payment probability and downtime), not as a block on the encrypt technique.
4. **Laundering is the traceable weak link.** No direct defender block; represented as
   friction and the permanence of the ledger.
5. **Plausible end-to-end outcome rates.** The tunable constants (`heatDecay`,
   `noiseWeight`, response threshold/responsiveness) were set so that a *middling org*
   faces a substantial breach rate from a capable ransomware affiliate, which falls
   sharply as the hardening controls come on — matching the broad reality that most
   ransomware intrusions exploit unhardened identity and remote-access surfaces.

### A worked sanity check

With the default "middling org" posture, a RaaS affiliate reaches impact a majority of
the time, and is most often *evicted* (not *blocked*) — because the org has EDR but lacks
the hard identity/network controls that would deny access outright. Enabling FIDO2,
no-RDP, segmentation, PAM, tamper protection, egress/DLP and raising coverage drops the
breach rate to low single digits and converts many evictions into perimeter *blocks*.
BEC breach rates fall from high to low once out-of-band payment verification and FIDO2
are enabled. These movements are the model behaving as the literature says it should.

## What the numbers are **not**

- They are **not measurements.** There is no claim that "AiTM succeeds 60% of the time."
  0.60 encodes *"moderately reliable, more so than edge exploitation, less than using a
  valid stolen credential"* — an ordering, not a frequency.
- They are **not predictive of a specific organisation.** The model has no knowledge of
  your estate. Outputs are for reasoning and comparison, not for quoting a risk figure.
- The **economic figures are illustrative.** Payout and loss fractions of `targetValue`
  are coarse; they exist to show *direction and relative magnitude* (backups lower
  expected loss; double-extortion raises payment probability), not to price an incident.

## Known limitations

- **No time-correlated defender learning.** Detection is memoryless beyond the heat
  meter and its per-phase decay; a real SOC correlates signals across time and hosts.
- **Single adversary, single pass.** No campaigns, no re-entry after eviction, no
  simultaneous actors, no insider threat.
- **Controls are independent.** Real controls interact (e.g. segmentation amplifies EDR
  by shrinking blast radius). Only a few such couplings are modelled (EDR-blinding,
  credential-harvest boosting lateral movement).
- **Coverage is linear.** A control's benefit scales linearly with coverage; reality has
  thresholds and diminishing returns.
- **Goal set is small.** Five archetypes and four goals. Espionage, hacktivism,
  destructive-only operations, and supply-chain compromise as an *access path* are not
  separately modelled.

## Recalibrating responsibly

If you change the numbers, change them toward **published, citable findings**, and record
the rationale (a comment and, ideally, a SOURCES entry). The goal is a model whose
*relative* conclusions a practitioner would recognise as true — not a model tuned to make
any particular control look good. See [EXTENDING.md](EXTENDING.md) and
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Reproducibility

Every result is deterministic given a seed. To reproduce a figure, fix the seed and the
posture; to test a hypothesis, change exactly one thing and compare. The leverage
analysis is itself a controlled experiment: one control toggled, everything else held.
