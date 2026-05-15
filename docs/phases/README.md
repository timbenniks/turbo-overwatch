# Build phases

Detailed work plans for shipping v1 of the Overwatch dashboard per [claude_overwatch-dashboard-spec.md](../claude_overwatch-dashboard-spec.md).

Each phase is sized to be picked up in a single working session. Phases are ordered — later phases assume earlier ones are done.

| # | Phase | Est. | Output |
|---|-------|------|--------|
| 1 | [Foundation](./phase-1-foundation.md) | ½ day | Next 16 app boots with Tailwind 4 theme tokens wired |
| 2 | [Data layer](./phase-2-data-layer.md) | 1 day | Typed cached API client + hero theme/asset maps |
| 3 | [Primitives](./phase-3-primitives.md) | ½ day | Formatters, observation helpers, small shared components |
| 4 | [Home page](./phase-4-home.md) | 1.5 days | `/` renders end-to-end against live data |
| 5 | [Hero detail page](./phase-5-hero-detail.md) | 1.5 days | `/hero/[key]` themed per hero |
| 6 | [Interactivity + edge cases](./phase-6-interactivity.md) | 1 day | Tabs, filters, empty states, 429 handling |
| 7 | [Polish](./phase-7-polish.md) | 1 day | Best moments lazy fetch, responsive QA, a11y |

**Total:** ~7 working days for one engineer.

## Working rules

- **Don't skip ahead.** Each phase has hard prerequisites listed at the top.
- **Verify acceptance criteria before moving on.** The criteria are the contract.
- **Update the phase file as you go** — strike through completed deliverables, note any deviations.
- **Player ID for v1:** hard-coded `b3nx-21103`.
- **Reference spec:** [claude_overwatch-dashboard-spec.md](../claude_overwatch-dashboard-spec.md) is the source of truth for product/visual decisions. These phase files describe *how* to build it; the spec describes *what*.
