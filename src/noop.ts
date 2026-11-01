import type { ReactNode } from 'react';
import type { BugKitController } from './kit';
import type { BugKitProps } from './react/shared';

export type { LogLine, Report, ReportInput, Source } from './core/report';
export { buildStepsPrompt, collect, createReport, githubIssueUrl } from './core/report';
export type { BugKitController, KitOptions } from './kit';
export type { BugKitProps } from './react/shared';

const noop = () => {};

/** Production stand-in: alias `@helder-studio/bug-kit` to `@helder-studio/bug-kit/noop`. */
export const bugKit: BugKitController = {
  getState: () => ({ open: false, drafting: false, steps: null, error: null }),
  getOptions: () => ({}),
  subscribe: () => noop,
  configure: noop,
  setPlatformDevice: noop,
  captureConsole: noop,
  stopCapture: noop,
  open: noop,
  close: noop,
  report: (title) => ({ title, markdown: '', data: {} }),
  issueUrl: () => undefined,
  draftSteps: async () => null,
};

export function BugKit({ children }: BugKitProps & { children?: ReactNode }): ReactNode {
  return children ?? null;
}

export function BugKitPanel(): null {
  return null;
}

export const bugKitTab = { id: 'bug-kit', title: 'Bug', render: () => null };
