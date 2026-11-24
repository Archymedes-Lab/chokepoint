import type { Technique, StageId } from "../types";

/**
 * The behavioural catalog. Each entry is an option an adversary agent can
 * choose at a given stage. Numbers are abstract calibration values, not
 * measurements — they encode *relative* difficulty, noise, and cost drawn
 * from public research (docs/METHODOLOGY.md, docs/SOURCES.md). No entry
 * contains operational detail; `note` cites the behaviour, not a method.
 */
export const TECHNIQUES: Technique[] = [
  // ---------------- ACCESS ----------------
  {
    id: "buy_access",
    name: "Buy access from a broker",
    stage: "access",
    tactic: "TA0001",
    blurb:
      "Purchase a ready foothold (RDP/VPN/RDWeb) from an initial access broker and skip the break-in.",
    baseSuccess: 0.95,
    noise: 0.15,
    cost: 25,
    time: 2,
    skillReq: 0.1,
    counteredBy: [
      { controlId: "no_rdp", block: 0.7, hard: true },
      { controlId: "fido2", block: 0.4 },
      { controlId: "mfa_push", block: 0.2 },
    ],
    note: "IAB market: RDP/VPN remain the top advertised vectors; access is a priced commodity.",
  },
  {
    id: "infostealer",
    name: "Use infostealer logs",
    stage: "access",
    tactic: "TA0001 · T1555",
    blurb:
      "Log in with credentials and session cookies harvested from a stealer log.",
    baseSuccess: 0.75,
    noise: 0.2,
    cost: 5,
    time: 4,
    skillReq: 0.15,
    counteredBy: [
      { controlId: "fido2", block: 0.75, hard: true },
      { controlId: "cred_monitor", block: 0.45, detect: 0.2 },
      { controlId: "mfa_push", block: 0.3 },
    ],
    note: "Stealer logs supply valid SaaS/SSO credentials at scale; cookies can ride past weak MFA.",
  },
  {
    id: "aitm_phish",
    name: "Adversary-in-the-middle phishing",
    stage: "access",
    tactic: "TA0001 · T1557",
    blurb:
      "Reverse-proxy phishing kit relays the victim through the real login and captures the live session.",
    baseSuccess: 0.6,
    noise: 0.3,
    cost: 10,
    time: 6,
    skillReq: 0.3,
    counteredBy: [
      { controlId: "fido2", block: 0.9, hard: true },
      { controlId: "mfa_push", block: 0.15, detect: 0.1 },
      { controlId: "cred_monitor", detect: 0.1 },
    ],
    note: "PhaaS kits bypass OTP/push MFA by stealing the session cookie; FIDO2 defeats them by design.",
  },
  {
    id: "helpdesk_se",
    name: "Help-desk social engineering",
    stage: "access",
    tactic: "TA0001 · T1598",
    blurb:
      "Call the service desk impersonating staff to force a password reset or MFA re-enrollment.",
    baseSuccess: 0.55,
    noise: 0.35,
    cost: 8,
    time: 5,
    skillReq: 0.4,
    counteredBy: [
      { controlId: "helpdesk_verify", block: 0.8, detect: 0.3, hard: true },
      { controlId: "fido2", block: 0.3 },
    ],
    note: "Scattered-Spider-style vishing; the service desk has become the identity perimeter.",
  },
  {
    id: "exploit_edge",
    name: "Exploit an exposed edge service",
    stage: "access",
    tactic: "TA0001 · T1190",
    blurb:
      "Leverage a known vulnerability in an internet-facing appliance.",
    baseSuccess: 0.5,
    noise: 0.4,
    cost: 12,
    time: 8,
    skillReq: 0.5,
    counteredBy: [
      { controlId: "patch_edge", block: 0.75, detect: 0.2, hard: true },
      { controlId: "edr", detect: 0.2 },
    ],
    note: "Edge devices are mass-scanned and exploited within days of disclosure.",
  },

  // ---------------- FOOTHOLD ----------------
  {
    id: "lotl",
    name: "Live off the land",
    stage: "foothold",
    tactic: "TA0002 · T1059",
    blurb:
      "Use built-in admin tooling and RMM software to execute and persist without obvious malware.",
    baseSuccess: 0.8,
    noise: 0.35,
    cost: 4,
    time: 10,
    skillReq: 0.3,
    counteredBy: [
      { controlId: "edr", block: 0.35, detect: 0.45 },
      { controlId: "segmentation", detect: 0.1 },
    ],
    note: "LOTL blends into normal admin traffic; behavioural EDR is what makes it anomalous.",
  },
  {
    id: "edr_kill",
    name: "Disable endpoint defences",
    stage: "foothold",
    tactic: "TA0005 · T1562",
    blurb:
      "Deploy tooling to blind or remove endpoint protection before proceeding.",
    baseSuccess: 0.65,
    noise: 0.3,
    cost: 10,
    time: 6,
    skillReq: 0.55,
    counteredBy: [
      { controlId: "edr_tamper", block: 0.7, detect: 0.5, hard: true },
      { controlId: "edr", detect: 0.2 },
    ],
    note: "'EDR killers' (BYOVD) precede encryption; tamper protection turns the kill attempt into an alert.",
  },

  // ---------------- ESCALATE ----------------
  {
    id: "cred_harvest",
    name: "Harvest credentials",
    stage: "escalate",
    tactic: "TA0006 · T1003",
    blurb:
      "Pull secrets from memory, directories, and scripts to climb toward domain admin.",
    baseSuccess: 0.75,
    noise: 0.4,
    cost: 6,
    time: 12,
    skillReq: 0.45,
    counteredBy: [
      { controlId: "pam", block: 0.65, detect: 0.3, hard: true },
      { controlId: "edr", detect: 0.35 },
    ],
    note: "LSASS dumping / Kerberoasting; tiered admin and credential guard starve this step.",
  },
  {
    id: "lateral",
    name: "Move laterally to crown jewels",
    stage: "escalate",
    tactic: "TA0008 · T1021",
    blurb:
      "Pivot host-to-host toward backups and hypervisors using stolen credentials.",
    baseSuccess: 0.78,
    noise: 0.45,
    cost: 5,
    time: 14,
    skillReq: 0.4,
    counteredBy: [
      { controlId: "segmentation", block: 0.7, detect: 0.4, hard: true },
      { controlId: "edr", detect: 0.25 },
      { controlId: "pam", block: 0.2 },
    ],
    note: "Flat networks let crews reach the recovery plan; segmentation isolates it.",
  },

  // ---------------- IMPACT ----------------
  {
    id: "exfil",
    name: "Exfiltrate data",
    stage: "impact",
    tactic: "TA0010 · T1567",
    blurb:
      "Bulk-copy sensitive data out for double-extortion leverage before encrypting.",
    baseSuccess: 0.72,
    noise: 0.5,
    cost: 4,
    time: 10,
    skillReq: 0.35,
    counteredBy: [
      { controlId: "egress_dlp", block: 0.55, detect: 0.5, hard: false },
      { controlId: "segmentation", detect: 0.2 },
      { controlId: "edr", detect: 0.15 },
    ],
    note: "Stolen data is the real leverage; egress monitoring is the last chance to catch it.",
  },
  {
    id: "encrypt",
    name: "Delete backups & encrypt",
    stage: "impact",
    tactic: "TA0040 · T1486",
    blurb:
      "Destroy shadow copies and backups, then encrypt to force payment.",
    baseSuccess: 0.85,
    noise: 0.6,
    cost: 3,
    time: 6,
    skillReq: 0.3,
    counteredBy: [
      { controlId: "backups", block: 0.2, detect: 0.3 }, // backups don't stop encryption; they remove its leverage (modelled in economics)
      { controlId: "edr", detect: 0.3 },
      { controlId: "segmentation", block: 0.25 },
    ],
    note: "Payloads delete shadow copies first; immutable offline backups neutralise the leverage.",
  },
  {
    id: "bec_wire",
    name: "Redirect a payment (BEC)",
    stage: "impact",
    tactic: "TA0040 · T1657",
    blurb:
      "Use mailbox access to alter bank details and divert a wire transfer.",
    baseSuccess: 0.6,
    noise: 0.25,
    cost: 3,
    time: 8,
    skillReq: 0.25,
    counteredBy: [
      { controlId: "payment_callback", block: 0.85, detect: 0.2, hard: true },
      { controlId: "egress_dlp", detect: 0.1 },
    ],
    note: "Vendor bank-detail changes; out-of-band callback defeats most BEC before the wire.",
  },

  // ---------------- CASHOUT ----------------
  {
    id: "launder_crypto",
    name: "Launder via mixers",
    stage: "cashout",
    tactic: "Cash-out",
    blurb:
      "Move ransom proceeds through mixers and chain-hopping toward clean withdrawal.",
    baseSuccess: 0.8,
    noise: 0.2,
    cost: 8,
    time: 20,
    skillReq: 0.3,
    counteredBy: [], // defender has little direct control here; friction modelled in economics
    note: "Permanent ledgers make laundering the traceable weak link; many crews launder unsophisticatedly.",
  },
  {
    id: "mule_cashout",
    name: "Cash out through mules",
    stage: "cashout",
    tactic: "Cash-out",
    blurb:
      "Route diverted funds through money-mule accounts across borders.",
    baseSuccess: 0.7,
    noise: 0.25,
    cost: 6,
    time: 16,
    skillReq: 0.2,
    counteredBy: [],
    note: "Mule networks move stolen funds fast; bank fraud recall is time-critical.",
  },
];

export const TECHNIQUES_BY_STAGE: Record<StageId, Technique[]> = TECHNIQUES.reduce(
  (acc, t) => {
    (acc[t.stage] ||= []).push(t);
    return acc;
  },
  {} as Record<StageId, Technique[]>,
);

export const TECHNIQUE_BY_ID: Record<string, Technique> = Object.fromEntries(
  TECHNIQUES.map((t) => [t.id, t]),
);
