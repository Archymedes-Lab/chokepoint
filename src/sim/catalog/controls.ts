import type { Control } from "../types";

/**
 * Defensive controls the simulated organisation can deploy. Defaults below
 * describe a middling org: some identity hygiene, basic EDR, little else.
 * Toggle and tune these in the app to see posture change outcomes.
 *
 * `coverage` is deployment completeness, not quality. A control at 0.6
 * coverage leaves 40% of the attack surface exposed to the techniques it
 * would otherwise counter.
 */
export const DEFAULT_CONTROLS: Control[] = [
  {
    id: "fido2",
    name: "Phishing-resistant MFA (FIDO2 / passkeys)",
    category: "identity",
    blurb:
      "Origin-bound credentials that adversary-in-the-middle phishing kits cannot proxy. The single strongest front-door control.",
    coverage: 0.5,
    enabled: false,
    effort: "medium",
  },
  {
    id: "mfa_push",
    name: "App / push MFA",
    category: "identity",
    blurb:
      "Raises the bar over passwords, but AiTM kits relay the session and push-bombing wears users down.",
    coverage: 0.8,
    enabled: true,
    effort: "low",
  },
  {
    id: "no_rdp",
    name: "No internet-facing RDP; VPN behind MFA",
    category: "network",
    blurb:
      "Removes the remote-access surface initial access brokers most often sell (RDP/VPN/RDWeb).",
    coverage: 0.6,
    enabled: false,
    effort: "medium",
  },
  {
    id: "patch_edge",
    name: "Rapid edge / KEV patching",
    category: "process",
    blurb:
      "Closes internet-facing and known-exploited vulnerabilities before they are mass-exploited.",
    coverage: 0.5,
    enabled: true,
    effort: "medium",
  },
  {
    id: "cred_monitor",
    name: "Credential-exposure monitoring",
    category: "intel",
    blurb:
      "Watches infostealer logs and dumps for your domains and auto-triggers resets — assumes passwords are already stolen.",
    coverage: 0.4,
    enabled: false,
    effort: "low",
  },
  {
    id: "helpdesk_verify",
    name: "Help-desk identity verification",
    category: "process",
    blurb:
      "Callback / video proofing and a cooldown before a reset or re-enrolled device gets privileges. Closes the social-engineering perimeter.",
    coverage: 0.3,
    enabled: false,
    effort: "low",
  },
  {
    id: "edr",
    name: "Behavioural EDR",
    category: "endpoint",
    blurb:
      "Flags living-off-the-land and anomalous admin tooling that signature AV misses.",
    coverage: 0.7,
    enabled: true,
    effort: "medium",
  },
  {
    id: "edr_tamper",
    name: "EDR tamper protection + driver blocklist",
    category: "endpoint",
    blurb:
      "Resists 'EDR killer' tooling (BYOVD) and alerts when agents go dark — absence is a signal.",
    coverage: 0.5,
    enabled: false,
    effort: "low",
  },
  {
    id: "segmentation",
    name: "Network segmentation",
    category: "network",
    blurb:
      "Blocks workstation-to-workstation movement and walls off the crown jewels.",
    coverage: 0.4,
    enabled: false,
    effort: "high",
  },
  {
    id: "pam",
    name: "Tiered admin + PAM / LSASS protection",
    category: "identity",
    blurb:
      "Just-in-time elevation, credential guard, and managed service accounts — starves credential harvesting.",
    coverage: 0.4,
    enabled: false,
    effort: "high",
  },
  {
    id: "backups",
    name: "Immutable, offline, tested backups",
    category: "data",
    blurb:
      "Turns an encryption event into a restore and removes half of double-extortion leverage.",
    coverage: 0.6,
    enabled: true,
    effort: "medium",
  },
  {
    id: "egress_dlp",
    name: "Egress monitoring / DLP",
    category: "data",
    blurb:
      "Catches bulk exfiltration in the window before encryption — the only chance to stop the data-leak half.",
    coverage: 0.3,
    enabled: false,
    effort: "medium",
  },
  {
    id: "payment_callback",
    name: "Out-of-band payment verification",
    category: "process",
    blurb:
      "Callback on any bank-detail change — defeats BEC before the wire. Cheapest high-value control.",
    coverage: 0.5,
    enabled: false,
    effort: "low",
  },
];

/** A fresh, independent copy of the defaults (avoid shared mutable state). */
export function defaultControls(): Control[] {
  return DEFAULT_CONTROLS.map((c) => ({ ...c }));
}
