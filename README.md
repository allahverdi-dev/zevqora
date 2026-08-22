# ZEVQORA

**AI Agent Control Plane.** Observe. Evaluate. Govern.

> Control what your agents can do.

ZEVQORA is a control plane for teams running LLM agents in production. It gives
you full execution traces for every run, automated quality evaluation, granular
tool permissions, and a human-in-the-loop approval gate in front of destructive
actions.

---

## ⚠️ What this release actually is

**This is a frontend-only release. ZEVQORA does not execute real AI agents.**

There is no backend, no database, and no model provider integration. The
application simulates agent execution against a fixed, deterministic dataset in
order to demonstrate the intended product experience end to end.

Specifically:

- Every run, trace, policy and evaluation you see is **seeded mock data**.
- The Simulator runs a **scripted, deterministic engine** in the browser — it
  does not call OpenAI, Anthropic, Google or any other provider.
- Policy edits and approval decisions change **in-session frontend state only**.
  They are not persisted and are **not enforced against any live runtime**.
- The workspace (*Acme Cloud*), the account (*Lead Architect*), and every agent,
  incident and customer record are **fictional**.

The architecture is deliberately built so a real backend can be added later
without rewriting the UI — see [Backend-ready boundary](#backend-ready-boundary).

---

## Screenshots

The application implements all thirteen approved screens across two design
exports. To capture them, run `npm run dev` and visit:

| Screen | Route |
| --- | --- |
| Landing | `/` |
| Dashboard / Overview | `/dashboard` |
| Agent Fleet | `/agents` |
| Runs Explorer | `/runs` |
| Trace Inspection | `/runs/rn_8b9f4e2d_c1` |
| Simulator | `/simulator` |
| Evaluations | `/evaluations` |
| Experiments | `/experiments` |
| Approval Queue | `/approvals` |
| Policies & Guardrails | `/policies` |
| Incidents Command Center | `/incidents` |
| Fleet Analytics | `/analytics` |
| Settings | `/settings` |

No primary sidebar destination is a placeholder — every entry in the approved
navigation routes to a fully implemented, functional screen.

The application was built from an approved Google Stitch design export (two
archives covering all thirteen screens). Those source archives and the
extracted reference screenshots/HTML are development-time material only —
kept locally for visual comparison during the build, not published in this
repository.

---

## Capabilities

**Observability**
- Runs Explorer over a 1,248-run corpus with search, environment/status/agent/
  model/period filters, sortable columns and pagination. Filter state lives in
  the URL, so a filtered view is linkable and the back button works.
- Full execution traces: an interactive event hierarchy from run start through
  model invocations, tool calls, policy interventions, human approval and
  completion, with a typed metadata inspector.

**Governance**
- Policies with typed effects (`allow`, `deny`, `require_approval`,
  `rate_limit`, `redact`), severity, attached agents and an editable rule
  definition.
- A human approval gate that genuinely halts execution and branches on the
  decision.

**Quality**
- Evaluation suites with per-criterion scoring, regression thresholds, model
  comparison curves and run history.
- Experiments: A/B comparisons of agent configurations, prompts and models,
  with data-driven metric-comparison and traffic-allocation charts, a
  functional experiment directory, and a demo experiment-creation flow.

**Simulation**
- A working agent sandbox: pick an agent, send a message, watch the trace build
  progressively, hit the policy gate, approve or reject, and see the run
  continue or terminate with live token/cost/latency telemetry.

**Human-in-the-loop control**
- A dedicated Approval Queue with urgency filtering, a context/risk inspector,
  an execution summary, and a genuinely stateful approve/reject flow that
  updates the dashboard's pending count and a recent-decision history in the
  same session.

**Incident response**
- An Incidents Command Center with severity filtering, a structured timeline
  (including raw tool-error payloads), and simulated Pause Agent / Rollback
  mitigations gated behind a confirmation dialog that says plainly that no
  live agent is affected. Timelines export as real local JSON files.

**Fleet-wide telemetry**
- Analytics with 24H/7D/30D period switching that changes every figure on the
  screen, a latency-distribution matrix across pipeline stages, model-usage
  breakdown, and functional CSV/JSON export of the active snapshot.

**Platform configuration**
- Settings for organization identity, environment switching (which updates the
  sidebar's live environment indicator), execution rate limits, and API key
  management backed by fictional, masked demo credentials only.

---

## Technology

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript (strict) |
| Build | Vite 7 |
| Routing | React Router 7 |
| Styling | Modern CSS — custom properties + CSS Modules |
| Icons | Lucide React |
| Charts | Hand-rolled SVG components |
| Testing | Vitest + React Testing Library |

**No CSS framework, no component library, no charting library.** The design
system is a token layer in plain CSS. Charts are ~80-line SVG components — a
charting dependency would have cost more bundle weight than it saved while
giving less control over the visual language.

### Design tokens

`DESIGN.md` from the approved export is converted into CSS custom properties in
[`src/styles/tokens.css`](./src/styles/tokens.css):

- Olive/charcoal tonal surface ramp (`#0c0f06` → `#333629`), depth via **tonal
  stepping and 1px trace outlines**, not shadows.
- Signal lime (`#bff440`) reserved strictly for active states, primary actions
  and "agent-alive" indicators — never for large surfaces.
- 4px spacing baseline; restrained 2–12px radii.
- **Manrope** for narrative UI, **IBM Plex Mono** for all machine-generated
  data: run IDs, model IDs, timestamps, costs, token counts, durations, tool
  names, policy expressions.

> **Note on `DESIGN.md`:** its frontmatter token block and the prose
> "Elevation/Shapes" section specify *different* palettes. The frontmatter
> values are the ones wired into the Stitch HTML and visible in the approved
> renders, so those are implemented; the prose section is treated as superseded
> narrative intent.

---

## Architecture

```
src/
├── app/            App shell composition, router, providers
├── routes/         One module per screen
├── components/
│   ├── ui/         Button, Badge, Dialog, Panel, DataTable, States…
│   ├── shell/      AppShell, Sidebar, Topbar, GlobalSearch, PageHeader
│   ├── charts/     SVG chart components
│   └── trace/      Trace nodes and the event inspector
├── features/       Screen-specific logic (dashboard, runs, simulator…)
├── domain/         Typed domain models
├── services/
│   ├── contracts/  Repository interfaces  ← the backend seam
│   └── mock/       In-memory implementations
├── mocks/          Seed data
├── hooks/          useAsync, useSession
├── lib/            Formatters, seeded RNG, clock
├── styles/         Token layer
└── tests/
```

### Backend-ready boundary

**UI code never imports mock data.** Every screen depends on an interface in
`services/contracts`:

```ts
export interface AgentRepository {
  list(filter?: AgentFilter): Promise<Agent[]>
  getById(id: AgentId): Promise<Agent | null>
  getByIds(ids: readonly AgentId[]): Promise<Agent[]>
  listModels(): Promise<AgentModel[]>
}
```

`services/index.ts` is the single composition root that chooses an
implementation. Adding a backend means writing `ApiAgentRepository` and changing
that one file:

```ts
const useApi = import.meta.env.VITE_API_URL !== undefined
return {
  agents: useApi ? new ApiAgentRepository(client) : new MockAgentRepository(),
  // …
}
```

No component, hook or feature module changes.

Every repository method is `async` even though the mock layer could answer
synchronously — so call sites already handle latency, loading and failure the
way they will have to against a network.

Every repository added for the second design export — **experiments**,
**approvals**, **incidents**, **analytics** (fleet snapshot) and **settings**
— follows the same contract-first shape: a `services/contracts` interface, a
`MockXRepository` implementation, seed data in `@/mocks`, and a UI layer that
only ever imports the contract.

This boundary is enforced by tests (`src/tests/architecture.test.ts`) that fail
the build if a UI module imports from `@/mocks` or constructs a repository
directly.

### Shared state across screens

Where two screens read the same concept, they read it through the *same*
repository rather than maintaining independent copies:

- **Approvals** — the dashboard's Pending Approvals panel and the dedicated
  Approval Queue both call `ApprovalRepository`. Approving a request in either
  place removes it from both.
- **Incidents** — the dashboard's Active Incidents panel and the Incidents
  Command Center both call `IncidentRepository.listOpen()` / `.list()`.
- **Environment** — `EnvironmentProvider` (`src/app/providers`) is the single
  reactive source for the active environment. Settings' environment switch
  calls `SettingsRepository.setEnvironment()`; the sidebar's environment pill
  subscribes to the same provider, so it updates immediately rather than on
  next navigation.

### Simulator architecture

The Simulator is not a chain of `setTimeout` calls inside a component.

```
SimulatorEngine  (framework-agnostic, injectable clock)
      ↓ state snapshots
useSimulator     (subscribes, disposes on unmount)
      ↓
React
```

`SimulatorEngine` owns the run lifecycle across
`idle → running → awaiting_approval → completed | rejected | cancelled | failed`.

Scheduling invariants, all covered by tests:

- Exactly one timer is ever outstanding.
- At the approval gate the engine schedules **nothing** — it genuinely waits.
- Every scheduled callback re-checks a run generation counter, so a timer queued
  before a cancel or restart cannot mutate the new run.
- `dispose()` clears timers and listeners on unmount.

Timers are injected, so tests drive the engine with a virtual clock and assert
real lifecycle behaviour without waiting on wall time.

### Mock data

The dataset is generated from **fixed seeds** (`mulberry32`), so it is identical
on every load and in every test run — a control plane whose numbers shuffle on
refresh reads as fake. Timestamps derive from a fixed instant rather than
`Date.now()`, so relative labels stay stable.

The seed data is **coherent across screens**: a run in the Runs Explorer
resolves to a real fleet agent, opens a real trace, and references policies that
exist on the Policies screen. This is verified by tests.

> **Deliberate reconciliations**, all made the same way: keep the number an
> individual approved screen actually shows, resolve the underlying data so it
> is real and shared rather than a duplicated literal, and document the
> divergence here.
>
> - The Stitch screens used different agent names on different screens
>   (`DataExtractor`, `Customer Support Agent`, `SupportBot Alpha`,
>   `CustomerSupport-v2` all appear). The Agent Fleet names were adopted as
>   canonical everywhere, and the fleet carries six agents rather than three so
>   every reference resolves to a real record; the first row of cards still
>   reproduces the approved screen exactly.
> - The approved Dashboard shows "Active Incidents (3)"; the approved Incidents
>   Command Center separately shows "OPEN INCIDENTS: 12" and lists three
>   *different* named incidents. Both panels now read the same
>   `IncidentRepository` (six incidents total, including the dashboard's
>   original three), and the dashboard panel's count is live rather than a
>   fixed literal — so it now honestly reads "(6)" instead of a "(3)" that
>   would otherwise be disconnected from the data behind it. The same applies
>   to Approvals: the two new canonical requests (`AG-410-DP`, `AG-105-NW`)
>   replaced two generic filler entries so the pending count stays at the
>   approved literal of 12 rather than drifting to 15.
> - The approved Settings screen's organization name ("Acme Corp Control")
>   conflicts with the workspace name shown everywhere else in the product
>   ("Acme Cloud"). "Acme Cloud" was kept for consistency with the sidebar,
>   session and dashboard.

---

## Accessibility

- Semantic HTML with correct landmark structure and contiguous heading order
  (verified per route).
- Real `<button>` and `<a>` elements — no `href="#"`, no click handlers on divs.
- Skip link as the first tab stop.
- Visible `:focus-visible` rings (2px lime, never suppressed).
- `aria-current="page"` on active navigation; `aria-sort` on sortable columns.
- Dialogs trap focus, close on Escape, and restore focus to their opener.
- Off-canvas panels use `visibility: hidden`, so a closed drawer is not
  keyboard-focusable or announced.
- `aria-live` regions for toasts and the approval gate; the gate announces
  assertively because execution has halted awaiting a decision.
- Accessible names on every icon-only control; labels on every form control.
- Charts expose a `<title>` plus, where the data matters, a visually hidden
  data table.
- **Colour is never the only status indicator** — every status pairs a colour
  with an icon and a text label.
- `prefers-reduced-motion: reduce` is respected globally; the Simulator remains
  fully understandable with animation disabled.

---

## Responsive behaviour

Desktop fidelity comes first; below the desktop breakpoints the product is
re-composed rather than shrunk. Verified at 1600 / 1440 / 1280 / 1024 / 768 /
430 / 390 / 360 px with **no horizontal viewport overflow at any width**.

| Range | Behaviour |
| --- | --- |
| ≥ 1280px | Persistent 264px sidebar, docked inspector, multi-column bento |
| 1024–1280px | Sidebar narrows to 240px, side panels stack |
| ≤ 1024px | Sidebar becomes an overlay drawer; inspector becomes a sheet |
| ≤ 768px | Single-column layouts; tables scroll inside their own container |
| ≤ 430px | Navigation drawer, larger touch targets, trace stays usable |

Dense tables keep their columns and scroll horizontally **inside their own
container** rather than exploding into stacked cards — the density is the
product.

---

## Local development

Requires Node 20+.

```bash
npm install
```

```bash
npm run dev
```

### Production build

```bash
npm run build
```

```bash
npm run preview
```

### Quality commands

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest (single run) |

---

## Testing

147 tests across six suites. They target behaviour, not implementation
details — there are no snapshot tests.

| Suite | Covers |
| --- | --- |
| `simulator-engine` | Start, progression, approval pause, approve/reject branching, cancellation, timer cleanup, stale-callback safety, telemetry accrual |
| `repositories` | Filtering, sorting, pagination, run lookup, policy state, evaluation scoring, experiment creation, approval urgency filtering and resolution, incident severity filtering and mitigation, analytics period scaling, settings/API-key mutation, dashboard-metric/repository consistency, canonical model catalog coherence, cross-screen data coherence, determinism |
| `ui` | Runs filtering and sorting, trace event selection, inspector updates, policy selection and saving, evaluation suite switching, experiment selection, approval queue filtering/approve/reject, incident filtering/timeline/mitigation confirmation, analytics period switching, settings updates and key generation, agent-card accessibility, shell navigation state |
| `routing` | Every registered route (all thirteen screens), run detail by URL param, invalid run, 404, no placeholder hrefs, no pending sidebar markers |
| `chart-math` | Per-metric normalization and percentile-fraction helpers, in isolation from any component |
| `architecture` | Repository boundary enforcement, no Stitch artifacts, no `alert()` |

```bash
npm run test:run
```

---

## Known limitations

- No backend, authentication, or persistence. Refreshing discards every
  in-session change: policy edits, approval/incident decisions, experiment
  creation, and settings updates.
- The Simulator follows scripted scenarios; it does not generate novel agent
  behaviour.
- Some controls are intentionally inert and say so via a toast rather than
  failing silently: the Runs/Dashboard CSV and report exports, agent/policy
  creation, logo upload, and Team/Security/Billing configuration (Analytics
  and Incidents exports, by contrast, genuinely write a local file — see
  above).
- Charts are presentational SVG without tooltips or zoom.
- No E2E suite — critical flows are covered by integration tests instead.

---

## Future backend roadmap

- Authentication, organisations/workspaces, RBAC
- PostgreSQL for agents, runs, traces, policies, evaluations
- Real agent telemetry ingestion and model-provider integrations
- SSE/WebSockets for live run streaming
- Background workers for evaluation suites
- Encrypted provider credential storage
- GitHub and Slack integrations, webhooks
- Audit logs and billing

---

## A note on traces and model reasoning

ZEVQORA records what the **control plane** observed about each step: the prompt
sent, the tool selected, the arguments passed, the tokens billed, and the
decision the application acted on.

Fields labelled *execution summary*, *decision summary* or *tool-selection
summary* are application-authored records — **not** a model's private internal
chain-of-thought. ZEVQORA does not claim to expose provider-internal reasoning,
and the mock data is written to reflect that distinction.

---

## AI-assisted development disclosure

This project was built through an AI-assisted workflow:

- **Product direction and requirements** — human, with ChatGPT used to help
  shape and iterate on the product brief
- **UI design** — generated with Google Stitch, then reviewed and approved by a
  human before implementation began
- **Implementation** — written by Claude Code (Anthropic) from the approved
  design export
- **Review, testing, and iteration** — human-directed, with automated
  typechecking, linting and tests gating the result

The implementation is not hand-written without AI assistance, and this README
does not claim otherwise. The architectural decisions, design-source
reconciliations and trade-offs documented above were made during that process
and are described here as they were actually resolved.

---

## License

Portfolio demonstration project. The ZEVQORA brand, the Acme Cloud workspace and
all data in this repository are fictional.
