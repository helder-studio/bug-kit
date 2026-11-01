# @helder-studio/bug-kit

Shared rules, commands and conventions: @AGENTS.md

Builds a Markdown bug report (environment, console, plugged-in app/tool state, optional AI steps)
and shares it or opens a prefilled GitHub issue. React Native + web. Plan: workspace
`docs/next-plan.md` §3.

## Layout

- `src/core/report.ts`: `createReport`, `collect` (sources never throw), `githubIssueUrl`
  (truncated under 7.5k chars), `buildStepsPrompt`.
- `src/core/console.ts`: console capture, last 200 lines, idempotent via a global symbol.
- `src/kit.ts`: `bugKit` controller (options, open state, AI draft via user `complete`).
- `src/react/`: web button + dialog (copy, GitHub link). `src/native/`: button, Modal form, Share,
  `BugKitPanel`, `bugKitTab`.

## Decisions

- No dependency on the other helder tools: users pass `sources` functions.
- Shake is an adapter prop (`shake(open) => unsubscribe`); no accelerometer dependency.
- Screenshots not included yet (would need `react-native-view-shot` as an optional peer).

## Commands

`pnpm verify`, `pnpm changeset`.
