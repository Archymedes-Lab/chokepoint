# Extending Chokepoint

The simulation core (`src/sim/`) is plain TypeScript with **no UI dependency**. You can
add to the catalog, re-calibrate, or import the engine into your own tooling. Keep every
change at the behavioural/abstraction level — see [ETHICS.md](ETHICS.md).

---

## Add a control

Edit `src/sim/catalog/controls.ts`:

```ts
{
  id: "canary_tokens",
  name: "Canary tokens / deception",
  category: "endpoint",
  blurb: "Decoy credentials and files that fire a high-fidelity alert when touched.",
  coverage: 0.4,
  enabled: false,
  effort: "low",
}
```

Then reference it from the techniques it bears on (below). The posture panel, presets,
and leverage analysis pick it up automatically.

## Add or re-point a technique

Edit `src/sim/catalog/techniques.ts`. To make the new control detect lateral movement:

```ts
// inside the "lateral" technique's counteredBy:
{ controlId: "canary_tokens", detect: 0.5 }
```

`block` reduces success (`hard: true` if a skilled operator can't erode it); `detect`
adds per-attempt detection pressure. A technique's `stage` must match an objective that
lists its `id` (see `objectivesFor` in `engine.ts`).

## Add an archetype

Edit `src/sim/catalog/archetypes.ts`. Pick a `goal` that has an objective path in
`engine.ts` (`ransomware`, `data-theft`, `bec`, `access-resale`), or add a new goal and
a matching branch in `objectivesFor`.

## Add a new goal / path

In `engine.ts`, extend the `Archetype["goal"]` union in `types.ts`, then add a `case` to
`objectivesFor` returning the ordered objective list. Flag exactly one objective
`isBreach` and one `isCashout`.

## Re-calibrate

Tunable constants live in the `K` block at the top of `engine.ts`. Posture defaults
(`responsiveness`, `responseThreshold`, `targetValue`) live in `defaultPosture()` in
`src/sim/index.ts`. Change numbers toward **published findings** and note why
([METHODOLOGY.md](METHODOLOGY.md)).

## Use the engine headless

The core has no React dependency, so you can script experiments:

```ts
import { runBatch, leverageAnalysis, defaultPosture, ARCHETYPE_BY_ID } from "./src/sim";

const agent = ARCHETYPE_BY_ID["raas_affiliate"];
const posture = defaultPosture();
posture.controls.find(c => c.id === "fido2")!.enabled = true;

console.log(runBatch(agent, posture, 5000));          // outcome distribution
console.table(leverageAnalysis(agent, posture, 500)); // ranked chokepoints
```

Run with `bun run yourscript.ts`. Because runs are seeded, results are reproducible.

## Ideas worth contributing

- **Control couplings** — e.g. segmentation amplifying EDR by shrinking blast radius.
- **Campaign mode** — re-entry after eviction; multiple sequential operations.
- **Sensitivity sweeps** — a headless harness that charts breach rate vs. one control's
  coverage from 0→1.
- **New archetypes** grounded in a named, public threat profile.
- **Better calibration** backed by a citable source added to [SOURCES.md](SOURCES.md).

## Project conventions

- TypeScript strict mode; `bun run typecheck` must pass.
- Keep `sim/` free of UI imports.
- One fact per control/technique; put the *why* in `blurb`/`note`, the citation in
  SOURCES.
- Behaviour and outcomes only. No mechanism. PRs that add operational detail are
  declined on principle, not merged-then-reverted.
