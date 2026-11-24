# Sources

Chokepoint's parameters and structure are calibrated from public research. These are
representative references, grouped by theme. They inform the model's *relative*
calibration — none is quoted as a measured rate, and none supplies operational detail.
Retrieved 2026-11.

> Calibration philosophy and what the numbers do/don't claim: [METHODOLOGY.md](METHODOLOGY.md).

## Offender motivation & typology (the "why")

- *Characterising Cybercriminals: A Review* — arXiv 2202.07419.
- *Cybercrime Offender Profiles: Psychological Characteristics* — Atlantis Press.
- *Profiling the Cybercriminal: A Systematic Review of Research* — IEEE CyberSA 2021.
- *Exploring Cybercriminal Activities, Behaviors, and Profiles* — Springer, 2026.

## Pathways in & desistance (recruitment, diversion)

- *Pathways Into, Desistance From, and Risk Factors Related to Cyber-Dependent Crime* — Victims & Offenders, 2024.
- *Pathways Out of Cybercrime: Perceived Desistance From Criminal Hacking* — 2026.
- *From curiosity to crime: Exploring pathways into criminal hacking* — Computers in Human Behavior, 2026.
- Europol, *Youth Pathways into Cybercrime* (white paper); UK National Crime Agency, *Pathways Into Cyber Crime*.

## Decision theory (Routine Activity / Rational Choice)

- *Applying Routine Activity Theory to Cybercrime: A Theoretical and Empirical Analysis* — Deviant Behavior.
- *Cyber-Routine Activity Theory* — Oxford Research Encyclopedia of Criminology.
- *Rational choice and situational convergence* — Frontiers in Psychology, 2026.

## Deterrence & enforcement

- *Cybercrime and Punishment* — Journal of Legal Studies, 49(2).
- *Deterring Cybercrime: Focus on Intermediaries* — Berkeley Technology Law Journal, 32(3).
- *An evaluation of police interventions for cybercrime prevention* — Cambridge UCAM-CL-TR-983.
- *Deterrence and Dissuasion in Cyberspace* — International Security (MIT Press).

## Displacement & situational prevention

- *Crime displacement: what we know, what we don't know, and what it means for crime reduction* — J. Experimental Criminology, 2014.
- *Situational Crime Prevention (SCP) techniques to prevent and control cybercrimes* — Computers & Security, 2022.
- *The ripple effect of Operation Cookie Monster: the impact of an illicit market takedown* — J. Experimental Criminology, 2026.
- *Adaptation strategies of cybercriminals to interventions* — (Routledge).

## Ecosystem disruption & policy (the levers)

- *Booting the Booters: Evaluating the Effects of Police Interventions in the Market for DoS* — IMC.
- *Assessing the Aftermath: the Effects of a Global Takedown against DDoS-for-hire* — USENIX Security 2025.
- *International Law Enforcement on Ransomware: Operation Cronos and LockBit 3.0* — Political Science Quarterly.
- *Hit 'Em Where it Hurts: Understanding and Disrupting the Resourcing Phase* — Institute for Security + Technology.
- INTERPOL / CSCRC, *A Comparative Threat Assessment on Counter-Ransomware Interventions*, 2024.
- *International legal responses to ransomware: toward a ban on payments?* — 2025.
- RUSI, *Ransomware: A Perfect Storm*.

## Latest quantitative anchors (2025–2026)

Used to calibrate payment rates, access vectors, dwell time, intervention effects and harm
scale — see [CALIBRATION.md](CALIBRATION.md).

- **Payment rates & ransom economics** — Coveware, *Q3 2025 Ransomware Report* (23% ransomware / 19% data-theft payment rate; avg payment ~$140k); BleepingComputer & Help Net Security coverage; CSO Online.
- **Breach cost** — IBM, *Cost of a Data Breach Report 2025* (first decline in five years; lifecycle and initial-vector breakdowns).
- **Initial access vectors** — Verizon, *2025 DBIR* (exploitation +34%; credential abuse; third-party involvement ~30%; ransomware in ~44% of breaches); Mandiant/Google Cloud, *M-Trends 2025* (stolen credentials & exploits rising, phishing waning; dwell times).
- **Phishing-resistant MFA** — FIDO Alliance, *Passkey Index 2026* (36% of sign-ins; 93% vs 78% success); Okta, *Phishing is a trap. Passkeys aren't.*
- **Infostealer scale** — Recorded Future, *2025 Identity Threat Landscape* (credential theft the dominant access vector); Flashpoint, *Stealer Log Statistics 2025/26* (11.1M infected hosts; 3.3B credentials).
- **Takedown effects / displacement** — Cybersecurity Dive, *Ransomware gangs capitalize on takedowns of competitors*; Operation Cronos / LockBit analyses.
- **Deterrence** — Maimon, Howell & Burruss, *Restrictive deterrence and the scope of hackers' reoffending* (randomised field trials, Computers in Human Behavior, 2021).
- **Harm scale** — Cybersecurity Ventures, *2025 Cybersecurity Almanac* ($10.5T in 2025; $12.2T by 2031).

## Agent-based modelling for cybercrime policy

- *Modelling and simulation for cybercrime policy analysis* (thesis).
- *AML-CFSim: An agent-based simulation model for anti-money laundering from cyber-enabled fraud* — Expert Systems with Applications, 2025.
- *A Data-Driven Model for Forensic Policy Making in Electronic Banking Using Agent-Based modelling*.

---

## Value-chain / TTP research (the Encounter model)

These inform the micro model's stages, techniques, and controls — behaviour and
economics only, never mechanism. See also [CATALOG.md](CATALOG.md).

- **Initial access brokers** — Flare/BleepingComputer *IAB Economy*; Rapid7 *IABs shift to high-value targets & premium pricing*; Cyberint/Check Point *IAB Report 2025*; CrowdStrike *Access Brokers*.
- **Infostealers** — ReliaQuest *The Infostealer Pipeline*; KELA *Inside the Infostealer Epidemic*; Cloudflare *Lumma Stealer playbook*; Hakai *Stealer Logs: 590M+ credentials*.
- **Phishing / AiTM** — Flare *Phishing Kits Economy*; Microsoft *Tycoon2FA* and *the hidden phishing network*; Cloud Security Alliance *Starkiller: real-time MFA bypass*.
- **Ransomware-as-a-service** — Sophos/Secureworks *Ransomware groups evolve affiliate models*; BleepingComputer *DragonForce white-label*; Group-IB/Infosecurity *Lynx RaaS*; ACSC *INC Ransom affiliate model*.
- **Social engineering** — CISA *Scattered Spider (AA23-320A)*; Google/Mandiant *vishing analysis*; DirSec *help-desk social engineering*.
- **TTPs & ATT&CK** — MITRE *Ransomware techniques in ATT&CK*; Kaspersky *Common TTPs of modern ransomware groups*; ESET *RansomHub / EDR killers*.
- **Laundering** — *From payday to payoff* (Conti blockchain analysis); Kwan & Leuprecht *Crypto-Crime Tumblers*; U.S. Secret Service *cryptocurrency mixers advisory*; FATF *Illicit financial flows from cyber-enabled fraud*.
- **Supply chain** — *Taxonomy of attacks on open-source software supply chains* (arXiv); ICSE 2026 *Closing the chain: SolarWinds, Log4j, XZ Utils*.

---

*If you re-calibrate the model, add the citable source you used here and note the
rationale in code — see [CONTRIBUTING.md](../CONTRIBUTING.md).*
