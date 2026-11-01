export type { LogLine, Report, ReportInput, Source } from './core/report';
export { buildStepsPrompt, collect, createReport, githubIssueUrl } from './core/report';
export { type BugKitController, bugKit, type KitOptions } from './kit';
export { BugKit, BugKitPanel, bugKitTab } from './native/BugKit';
export type { BugKitProps } from './react/shared';
