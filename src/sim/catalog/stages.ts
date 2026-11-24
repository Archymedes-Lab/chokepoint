import type { Stage, StageId } from "../types";

/** The intrusion value chain, in order. See docs/MODEL.md. */
export const STAGES: Stage[] = [
  {
    id: "access",
    index: 0,
    name: "Initial Access",
    tactic: "TA0001",
    blurb:
      "Get a foothold — bought from an access broker, harvested by an infostealer, phished, or talked out of the help desk.",
  },
  {
    id: "foothold",
    index: 1,
    name: "Foothold & Evasion",
    tactic: "TA0002 · TA0003 · TA0005",
    blurb:
      "Execute and persist while staying quiet — living off the land and blinding endpoint defences.",
  },
  {
    id: "escalate",
    index: 2,
    name: "Escalate & Move",
    tactic: "TA0004 · TA0006 · TA0008",
    blurb:
      "Harvest credentials and pivot toward domain admin, the hypervisors, and the backups.",
  },
  {
    id: "impact",
    index: 3,
    name: "Exfil & Extortion",
    tactic: "TA0010 · TA0040",
    blurb:
      "Steal the data, delete the backups, encrypt — double extortion for leverage.",
  },
  {
    id: "cashout",
    index: 4,
    name: "Monetize & Launder",
    tactic: "Cash-out",
    blurb:
      "Collect payment and launder it — the traceable, weakest link in the chain.",
  },
];

export const STAGE_BY_ID: Record<StageId, Stage> = Object.fromEntries(
  STAGES.map((s) => [s.id, s]),
) as Record<StageId, Stage>;

export const STAGE_ORDER: StageId[] = STAGES.map((s) => s.id);
