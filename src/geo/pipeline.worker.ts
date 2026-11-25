/// <reference lib="webworker" />
/**
 * Off-main-thread pipeline: raw feeds → parsed articles → incidents.
 * Keeps the globe and the simulation smooth while ~2,000 headlines are
 * parsed, clustered and geolocated.
 */
import { buildIncidents, type RawArticle } from "./extract";
import { dedupe, parseFeed, type FeedDoc } from "./rss";

export type PipelineIn = { docs?: FeedDoc[]; raw?: RawArticle[] };
export type PipelineOut = { incidents: ReturnType<typeof buildIncidents>; articles: number };

self.onmessage = (e: MessageEvent<PipelineIn>) => {
  const raw = [...(e.data.raw ?? []), ...(e.data.docs ?? []).flatMap(parseFeed)];
  const arts = dedupe(raw);
  const out: PipelineOut = { incidents: buildIncidents(arts), articles: arts.length };
  (self as unknown as Worker).postMessage(out);
};
