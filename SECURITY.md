# Security & Responsible Use

## Scope

Chokepoint is an abstract simulation for defensive planning, policy analysis, and
education. It has **no backend, makes no network calls at runtime, and collects no data**
(the only persistence is a theme preference in the browser's `localStorage`). There is no
server to attack and no user data to breach.

## Reporting a vulnerability

If you find a genuine security issue in the application code (for example, a dependency
vulnerability or a way the static build could be abused), please open a GitHub issue
marked **[security]**, or contact the maintainers privately if you prefer. We aim to
acknowledge within a few days.

## Reporting a scope concern

Chokepoint's integrity depends on staying at the behavioural/abstraction level. If you
believe a change, an issue, or a PR has introduced — or is requesting — operational
attack detail (exploit code, payloads, step-by-step technique procedures, evasion
recipes, real indicators or targeting data), please flag it. We would rather
over-correct toward abstraction. See [docs/ETHICS.md](docs/ETHICS.md).

## Not a live tool

Conclusions drawn from the model are for reasoning and discussion, not a measurement of
any real organisation's or population's risk. Validate with **authorised** testing only.
Never use any security tool, or conclusions drawn from one, against systems you are not
authorised to assess.
