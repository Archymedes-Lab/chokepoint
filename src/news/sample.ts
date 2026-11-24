import type { NewsItem } from "./types";

/**
 * Offline fallback. These are ILLUSTRATIVE, generic category headlines — not
 * real current reports — shown only when no live source is reachable, and
 * always labelled as such in the UI. They exist so the panel is never empty
 * and the reader can see the shape of the feed. Do not present them as real.
 */
export const SAMPLE_NEWS: NewsItem[] = [
  { title: "Ransomware group claims attack on regional healthcare provider", url: "", source: "example-security-news", country: "United States", date: Date.now() - 2 * 3600e3 },
  { title: "Manufacturing firm discloses data breach affecting customer records", url: "", source: "example-security-news", country: "Germany", date: Date.now() - 5 * 3600e3 },
  { title: "National CERT warns of exploited edge-device vulnerability", url: "", source: "example-cert", country: "United Kingdom", date: Date.now() - 9 * 3600e3 },
  { title: "Phishing campaign targets financial-sector employees", url: "", source: "example-security-news", country: "India", date: Date.now() - 14 * 3600e3 },
  { title: "Law enforcement announces infrastructure takedown of extortion network", url: "", source: "example-gov", country: "Netherlands", date: Date.now() - 20 * 3600e3 },
  { title: "Infostealer logs linked to cloud-account compromises", url: "", source: "example-security-news", country: "Brazil", date: Date.now() - 26 * 3600e3 },
  { title: "Public-sector agency restores services after cyber incident", url: "", source: "example-local-news", country: "Australia", date: Date.now() - 33 * 3600e3 },
  { title: "Business-email-compromise fraud ring charged in multi-country operation", url: "", source: "example-gov", country: "Nigeria", date: Date.now() - 40 * 3600e3 },
];
