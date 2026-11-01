/** Something that adds a section to the report, e.g. `() => chaos.getLog()`. */
export type Source = () => unknown;

export interface LogLine {
  time: number;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
}

export interface ReportInput {
  title: string;
  description?: string;
  /** Free-form environment facts: app version, platform, screen size… */
  device?: Record<string, string | number | boolean | undefined>;
  logs?: LogLine[];
  sources?: Record<string, Source>;
  /** Optional AI-written steps to reproduce. */
  steps?: string;
  now?: number;
}

export interface Report {
  title: string;
  markdown: string;
  /** Machine-readable copy of everything in the Markdown. */
  data: Record<string, unknown>;
}

const MAX_SOURCE_CHARS = 4000;
const MAX_LOGS = 50;

function serialize(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function clip(text: string, max: number): string {
  return text.length > max
    ? `${text.slice(0, max)}\n… (${text.length - max} more characters)`
    : text;
}

/** Reads every source; a source that throws becomes an error note instead of breaking the report. */
export function collect(sources: Record<string, Source> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, source] of Object.entries(sources)) {
    try {
      out[name] = source();
    } catch (error) {
      out[name] = `(failed to read: ${error instanceof Error ? error.message : String(error)})`;
    }
  }
  return out;
}

export function createReport(input: ReportInput): Report {
  const at = new Date(input.now ?? Date.now()).toISOString();
  const logs = (input.logs ?? []).slice(-MAX_LOGS);
  const sources = collect(input.sources);
  const device = Object.fromEntries(
    Object.entries(input.device ?? {}).filter(([, v]) => v !== undefined),
  );

  const lines = [`# ${input.title.trim() || 'Bug report'}`, '', `_Reported ${at}_`, ''];
  if (input.description?.trim()) lines.push(input.description.trim(), '');
  if (input.steps?.trim())
    lines.push('## Steps to reproduce (AI draft, check before filing)', '', input.steps.trim(), '');
  if (Object.keys(device).length) {
    lines.push('## Environment', '', '| | |', '| --- | --- |');
    for (const [key, value] of Object.entries(device))
      lines.push(`| ${key} | ${String(value).replace(/\|/g, '\\|')} |`);
    lines.push('');
  }
  if (logs.length) {
    lines.push(`## Console (last ${logs.length})`, '', '```');
    for (const log of logs)
      lines.push(
        `${new Date(log.time).toISOString().slice(11, 23)} ${log.level.toUpperCase()} ${log.message}`,
      );
    lines.push('```', '');
  }
  for (const [name, value] of Object.entries(sources)) {
    lines.push(`## ${name}`, '', '```json', clip(serialize(value), MAX_SOURCE_CHARS), '```', '');
  }

  return {
    title: input.title.trim() || 'Bug report',
    markdown: lines.join('\n'),
    data: {
      title: input.title,
      description: input.description,
      reportedAt: at,
      steps: input.steps,
      device,
      logs,
      sources,
    },
  };
}

/** GitHub caps URLs around 8 kB; longer bodies are cut with a note to paste the full report. */
const MAX_ISSUE_URL = 7500;

/** A prefilled "new issue" URL for `owner/repo`. */
export function githubIssueUrl(repo: string, report: Report, labels: string[] = ['bug']): string {
  const base = `https://github.com/${repo}/issues/new`;
  const query = (body: string) =>
    `?title=${encodeURIComponent(report.title)}&labels=${encodeURIComponent(labels.join(','))}&body=${encodeURIComponent(body)}`;
  let body = report.markdown;
  if ((base + query(body)).length <= MAX_ISSUE_URL) return base + query(body);
  const note = '\n\n_Report truncated: paste the full report from your clipboard._';
  while (body.length > 0 && (base + query(body + note)).length > MAX_ISSUE_URL) {
    body = body.slice(0, Math.floor(body.length * 0.9));
  }
  return base + query(body + note);
}

/** Prompt asking a model for numbered steps to reproduce, from the report. */
export function buildStepsPrompt(report: Report): string {
  return `You are a QA engineer. From this bug report, write short numbered steps to reproduce the
problem, based only on what the report shows (console output, network log, app state). If the report
doesn't say enough, write the steps you can and end with "Unclear: …". Reply with only the steps.

${report.markdown}`;
}
