# Contributing to Chokepoint

Thanks for your interest. Chokepoint is a defensive, educational, and policy-analysis
tool, and contributions are welcome — within one firm boundary.

## The boundary (please read first)

Chokepoint models **behaviour, motivation, and outcomes at an abstract level**. It does
not, and will not, contain:

- exploit code, payloads, scripts, or tooling;
- step-by-step procedures for any attack technique;
- real indicators, infrastructure, credentials, or targeting data;
- evasion recipes or "how to defeat control X" instructions.

PRs that add operational attack detail will be declined on principle. See
[docs/ETHICS.md](docs/ETHICS.md). When in doubt, keep it at the level of "a labelled node
with a few numbers."

## Good contributions

- **Better calibration** backed by a citable public source (add it to
  [docs/SOURCES.md](docs/SOURCES.md) and note the rationale in a code comment).
- **New motivations, archetypes, controls, techniques, sectors, or interventions**
  grounded in research.
- **New emergent dynamics** — control couplings, campaign mode, lagged policy effects,
  sensitivity sweeps.
- **UI/UX, accessibility, and performance** improvements.
- **Documentation** and worked teaching examples.

## Development

```bash
bun install
bun run dev         # http://localhost:5173
bun run typecheck   # must pass
bun run build       # tsc --noEmit && vite build
```

### Conventions

- TypeScript strict mode; `noUnusedLocals`/`noUnusedParameters` are on.
- Keep the simulation cores (`src/sim/`, `src/world/`) free of UI imports — they must be
  usable headless (see [docs/EXTENDING.md](docs/EXTENDING.md)).
- One fact per catalog entry; put the *why* in `blurb`/`note`, the citation in SOURCES.
- Prefer small, readable functions; the models are meant to be audited by non-authors.

### Where things live

| Path | What |
|------|------|
| `src/world/` | The 2D ecosystem / agent-based model (primary). |
| `src/sim/` | The value-chain Encounter model (micro). |
| `src/ui/` | React views for both. |
| `docs/` | Model specs, methodology, ethics, sources. |

## Submitting

1. Open an issue describing the change (especially for calibration — link the source).
2. Keep PRs focused; include a note on how you validated the change (a headless run, a
   before/after on a metric).
3. Confirm `bun run build` is green.

By contributing you agree your contribution is licensed under the project's
[Apache-2.0](LICENSE) license.
