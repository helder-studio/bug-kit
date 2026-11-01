import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConsoleCapture } from './console';
import { buildStepsPrompt, collect, createReport, githubIssueUrl } from './report';

describe('createReport', () => {
  it('builds Markdown with environment, console and sources', () => {
    const report = createReport({
      title: '  Checkout button does nothing ',
      description: 'Tapped Pay twice.',
      device: { platform: 'ios', appVersion: '1.4.0', missing: undefined },
      logs: [
        {
          time: Date.UTC(2026, 10, 1, 9, 30),
          level: 'error',
          message: 'TypeError: x is undefined',
        },
      ],
      sources: {
        network: () => [{ url: '/api/pay', status: 503 }],
        broken: () => {
          throw new Error('nope');
        },
      },
      now: Date.UTC(2026, 10, 1, 9, 31),
    });
    expect(report.title).toBe('Checkout button does nothing');
    expect(report.markdown).toContain('# Checkout button does nothing');
    expect(report.markdown).toContain('_Reported 2026-11-01T09:31:00.000Z_');
    expect(report.markdown).toContain('| appVersion | 1.4.0 |');
    expect(report.markdown).not.toContain('missing');
    expect(report.markdown).toContain('09:30:00.000 ERROR TypeError: x is undefined');
    expect(report.markdown).toContain('"status": 503');
    expect(report.markdown).toContain('(failed to read: nope)');
    expect(report.data.sources).toMatchObject({ network: [{ status: 503 }] });
  });

  it('clips huge sources and keeps the last 50 log lines', () => {
    const logs = Array.from({ length: 80 }, (_, i) => ({
      time: 0,
      level: 'log' as const,
      message: `line ${i}`,
    }));
    const report = createReport({ title: 'x', logs, sources: { big: () => 'y'.repeat(10_000) } });
    expect(report.markdown).toContain('Console (last 50)');
    expect(report.markdown).not.toContain('line 29\n');
    expect(report.markdown).toContain('line 79');
    expect(report.markdown).toContain('(6000 more characters)');
  });

  it('puts AI steps first, marked as a draft', () => {
    const report = createReport({ title: 'x', steps: '1. Open cart\n2. Tap Pay' });
    expect(report.markdown).toContain('## Steps to reproduce (AI draft, check before filing)');
    expect(buildStepsPrompt(report)).toContain('numbered steps to reproduce');
  });

  it('defaults an empty title', () => {
    expect(createReport({ title: '' }).title).toBe('Bug report');
  });
});

describe('collect', () => {
  it('stringifies source errors instead of throwing', () => {
    expect(
      collect({
        a: () => 1,
        b: () => {
          throw 'boom';
        },
      }),
    ).toEqual({ a: 1, b: '(failed to read: boom)' });
  });
});

describe('githubIssueUrl', () => {
  it('prefills title, labels and body', () => {
    const url = githubIssueUrl('helder-studio/app', createReport({ title: 'Crash on save' }));
    expect(
      url.startsWith('https://github.com/helder-studio/app/issues/new?title=Crash%20on%20save'),
    ).toBe(true);
    expect(url).toContain('labels=bug');
  });

  it('truncates long reports to stay under GitHub URL limits', () => {
    const report = createReport({
      title: 'Big',
      sources: { a: () => 'z'.repeat(3900), b: () => 'q'.repeat(3900) },
    });
    const url = githubIssueUrl('o/r', report);
    expect(url.length).toBeLessThanOrEqual(7500);
    expect(decodeURIComponent(url)).toContain('Report truncated');
  });
});

describe('console capture', () => {
  const capture = createConsoleCapture(() => 42);
  afterEach(() => capture.uninstall());

  it('keeps lines and still prints them', () => {
    const print = vi.spyOn(console, 'warn').mockImplementation(() => {});
    capture.install();
    capture.install(); // idempotent
    console.warn('careful', { id: 7 }, new Error('bad'));
    expect(capture.getLines()).toEqual([
      { time: 42, level: 'warn', message: 'careful {"id":7} Error: bad' },
    ]);
    expect(print).toHaveBeenCalledTimes(1);
    capture.uninstall();
    console.warn('after');
    expect(capture.getLines()).toHaveLength(1);
    capture.clear();
    expect(capture.getLines()).toEqual([]);
    print.mockRestore();
  });

  it('keeps only the last 200 lines', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    capture.install();
    for (let i = 0; i < 250; i++) console.log(i);
    expect(capture.getLines()).toHaveLength(200);
    expect(capture.getLines()[0]?.message).toBe('50');
    vi.restoreAllMocks();
  });
});
