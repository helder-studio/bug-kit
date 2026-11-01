import { createConsoleCapture } from './core/console';
import {
  buildStepsPrompt,
  createReport,
  githubIssueUrl,
  type Report,
  type Source,
} from './core/report';

export interface KitOptions {
  /** Extra report sections, e.g. `{ network: () => chaos.getLog(), time: () => timewarp.getState() }`. */
  sources?: Record<string, Source>;
  /** Environment facts added to every report (app version, build, user role…). */
  device?: Record<string, string | number | boolean | undefined>;
  /** `owner/repo` for "Open GitHub issue". */
  repo?: string;
  labels?: string[];
  /** Your model, for AI-drafted steps to reproduce (opt-in). Call your backend, never ship a key. */
  complete?: (prompt: string) => Promise<string>;
}

type KitState = { open: boolean; drafting: boolean; steps: string | null; error: string | null };

const capture = createConsoleCapture();
let options: KitOptions = {};
let platformDevice: KitOptions['device'] = {};
let state: KitState = { open: false, drafting: false, steps: null, error: null };
const listeners = new Set<() => void>();

function set(patch: Partial<KitState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

/** The bug-report controller. `<BugKit enabled>` sets it up; call `bugKit.open()` from anywhere. */
export const bugKit = {
  getState: () => state,
  getOptions: () => options,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  configure(next: KitOptions) {
    options = next;
  },
  /** Platform facts filled in by the web / native component. */
  setPlatformDevice(device: KitOptions['device']) {
    platformDevice = device;
  },
  /** Start keeping the last 200 console lines (dev builds). */
  captureConsole: () => capture.install(),
  stopCapture: () => capture.uninstall(),
  open: () => set({ open: true }),
  close: () => set({ open: false, steps: null, error: null }),

  report(title: string, description?: string): Report {
    return createReport({
      title,
      ...(description !== undefined && { description }),
      device: { ...platformDevice, ...options.device },
      logs: capture.getLines(),
      ...(options.sources && { sources: options.sources }),
      ...(state.steps && { steps: state.steps }),
    });
  },

  issueUrl: (report: Report) =>
    options.repo ? githubIssueUrl(options.repo, report, options.labels) : undefined,

  /** Asks the configured model for steps to reproduce; they're added to the next report. */
  async draftSteps(title: string, description?: string): Promise<string | null> {
    if (!options.complete) return null;
    set({ drafting: true, error: null });
    try {
      const steps = (
        await options.complete(buildStepsPrompt(bugKit.report(title, description)))
      ).trim();
      set({ drafting: false, steps });
      return steps;
    } catch (error) {
      set({ drafting: false, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  },
};

export type BugKitController = typeof bugKit;
