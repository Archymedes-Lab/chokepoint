/** A normalised global cyber-incident news item. */
export interface NewsItem {
  title: string;
  url: string;
  source: string; // domain / outlet
  country: string; // source country (best-effort)
  date: number; // epoch ms
}

export type NewsStatus = "loading" | "live" | "offline" | "error";

export interface NewsResult {
  items: NewsItem[];
  status: NewsStatus;
  via: string; // which provider answered
  note?: string;
}
