# The Catalog

Everything the simulation reasons over is data, defined in `src/sim/catalog/`. This is
the human-readable reference. All entries are **behavioural abstractions** — a name, an
ATT&CK tag, and calibration numbers. None describe how to perform anything.

---

## Adversary archetypes (`archetypes.ts`)

| Archetype | Skill | Budget | Risk tol. | Adapt | Goal | Buys access |
|-----------|:-----:|:------:|:---------:|:-----:|------|:-----------:|
| **RaaS affiliate** | 0.70 | 120 | 0.55 | 0.75 | ransomware | 60% |
| **Initial access broker** | 0.60 | 60 | 0.40 | 0.60 | access-resale | 0% |
| **BEC / fraud crew** | 0.40 | 40 | 0.50 | 0.50 | bec | 20% |
| **Smash-and-grab extortionist** | 0.50 | 70 | 0.70 | 0.55 | data-theft | 70% |
| **Sophisticated intruder** | 0.90 | 200 | 0.30 | 0.90 | data-theft | 30% |

- **Skill** erodes soft controls and lowers noise.
- **Risk tolerance** governs how long an agent operates while "hot" before retreating.
- **Adaptability** is the chance to pivot to an alternate technique after a block.

---

## Techniques (`techniques.ts`)

Columns: *base* = success absent controls; *noise* = telemetry per attempt; *cost* =
resource units; *skill* = minimum to attempt. "Countered by" lists the controls that
bear on it (**hard** = cannot be skilled around).

### Stage 0 — Initial Access

| Technique | Base | Noise | Cost | Skill | Countered by |
|-----------|:----:|:-----:|:----:|:-----:|--------------|
| Buy access from a broker | 0.95 | 0.15 | 25 | 0.10 | no-RDP **hard**, FIDO2, push-MFA |
| Use infostealer logs | 0.75 | 0.20 | 5 | 0.15 | FIDO2 **hard**, credential monitoring, push-MFA |
| Adversary-in-the-middle phishing | 0.60 | 0.30 | 10 | 0.30 | FIDO2 **hard**, push-MFA, credential monitoring |
| Help-desk social engineering | 0.55 | 0.35 | 8 | 0.40 | help-desk verification **hard**, FIDO2 |
| Exploit an exposed edge service | 0.50 | 0.40 | 12 | 0.50 | edge patching **hard**, EDR |

### Stage 1 — Foothold & Evasion

| Technique | Base | Noise | Cost | Skill | Countered by |
|-----------|:----:|:-----:|:----:|:-----:|--------------|
| Live off the land | 0.80 | 0.35 | 4 | 0.30 | EDR (detect-heavy), segmentation |
| Disable endpoint defences *(optional)* | 0.65 | 0.30 | 10 | 0.55 | EDR tamper protection **hard**, EDR |

### Stage 2 — Escalate & Move

| Technique | Base | Noise | Cost | Skill | Countered by |
|-----------|:----:|:-----:|:----:|:-----:|--------------|
| Harvest credentials *(optional)* | 0.75 | 0.40 | 6 | 0.45 | PAM/LSASS protection **hard**, EDR |
| Move laterally to crown jewels | 0.78 | 0.45 | 5 | 0.40 | segmentation **hard**, EDR, PAM |

### Stage 3 — Exfil & Extortion

| Technique | Base | Noise | Cost | Skill | Countered by |
|-----------|:----:|:-----:|:----:|:-----:|--------------|
| Exfiltrate data *(optional for ransomware)* | 0.72 | 0.50 | 4 | 0.35 | egress/DLP, segmentation, EDR |
| Delete backups & encrypt | 0.85 | 0.60 | 3 | 0.30 | backups*, EDR, segmentation |
| Redirect a payment (BEC) | 0.60 | 0.25 | 3 | 0.25 | out-of-band payment verification **hard** |

\* Immutable backups barely reduce the *act* of encryption — their value is modelled in
the **economics** (they collapse ransom-payment probability and downtime), which is
exactly how they work in reality.

### Stage 4 — Monetize & Launder

| Technique | Base | Noise | Cost | Skill | Countered by |
|-----------|:----:|:-----:|:----:|:-----:|--------------|
| Launder via mixers | 0.80 | 0.20 | 8 | 0.30 | — (friction modelled in economics) |
| Cash out through mules | 0.70 | 0.25 | 6 | 0.20 | — |

The defender has little *direct* control at cash-out; its value to the chain is that the
ledger is permanent, which the model reflects as laundering friction rather than a block.

---

## Controls (`controls.ts`)

Default coverage/enabled reflect a *middling organisation*. `coverage` is deployment
completeness, not quality: a control at 0.6 leaves 40% of its surface exposed.

| Control | Category | Default | Effort | Primarily counters |
|---------|----------|:-------:|:------:|--------------------|
| Phishing-resistant MFA (FIDO2/passkeys) | identity | off · 0.5 | med | bought access, infostealer, AiTM, help-desk |
| App / push MFA | identity | on · 0.8 | low | bought access, infostealer, AiTM |
| No internet-facing RDP; VPN behind MFA | network | off · 0.6 | med | bought access |
| Rapid edge / KEV patching | process | on · 0.5 | med | edge exploitation |
| Credential-exposure monitoring | intel | off · 0.4 | low | infostealer, AiTM |
| Help-desk identity verification | process | off · 0.3 | low | help-desk social engineering |
| Behavioural EDR | endpoint | on · 0.7 | med | LOTL, cred harvest, lateral, exfil, encrypt |
| EDR tamper protection + driver blocklist | endpoint | off · 0.5 | low | disable-defences |
| Network segmentation | network | off · 0.4 | high | lateral movement, exfil, encrypt |
| Tiered admin + PAM / LSASS protection | identity | off · 0.4 | high | credential harvest, lateral |
| Immutable, offline, tested backups | data | on · 0.6 | med | encryption *leverage* (economics) |
| Egress monitoring / DLP | data | off · 0.3 | med | data exfiltration |
| Out-of-band payment verification | process | off · 0.5 | low | BEC payment redirect |

---

## Control → technique map (at a glance)

```
FIDO2 / passkeys ........ hard-stops AiTM & infostealer logins; dents bought access & help-desk
No internet-facing RDP .. hard-stops the access brokers' most-sold vector
Help-desk verification .. hard-stops Scattered-Spider-style social engineering
Edge/KEV patching ....... hard-stops edge-service exploitation
EDR ..................... makes living-off-the-land & harvesting *noisy* (detection, not block)
EDR tamper protection ... hard-stops the "EDR killer" step that precedes encryption
Segmentation ............ hard-stops lateral movement to backups/hypervisors
PAM / LSASS protection .. hard-stops credential harvesting
Immutable backups ....... collapses ransom leverage and downtime (economics)
Egress / DLP ............ catches bulk exfiltration before encryption
Payment callback ........ hard-stops BEC before the wire
Credential monitoring ... shrinks the window stolen credentials stay useful
```

To change any of this, edit the catalog files — see [EXTENDING.md](EXTENDING.md).
