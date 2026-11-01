import type { LogLine } from './report';

const LEVELS = ['log', 'info', 'warn', 'error'] as const;
const MAX_LINES = 200;
const INSTALLED = Symbol.for('helder-studio.bug-kit.console');

type Console = Record<(typeof LEVELS)[number], (...args: unknown[]) => void>;
const registry = globalThis as unknown as Record<symbol, Partial<Console> | undefined>;

function format(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ')
    .slice(0, 1000);
}

/** Keeps the last 200 console lines while still printing them. Idempotent. */
export function createConsoleCapture(now: () => number = Date.now) {
  let lines: LogLine[] = [];
  return {
    getLines: () => lines,
    clear() {
      lines = [];
    },
    install() {
      if (registry[INSTALLED]) return;
      const target = console as unknown as Console;
      const saved: Partial<Console> = {};
      for (const level of LEVELS) {
        const original = target[level];
        saved[level] = original;
        target[level] = (...args: unknown[]) => {
          lines = [...lines.slice(-(MAX_LINES - 1)), { time: now(), level, message: format(args) }];
          original.apply(console, args);
        };
      }
      registry[INSTALLED] = saved;
    },
    uninstall() {
      const saved = registry[INSTALLED];
      if (!saved) return;
      Object.assign(console, saved);
      registry[INSTALLED] = undefined;
    },
  };
}
