// @vitest-environment happy-dom
/// <reference lib="dom" />
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bugKit } from '../kit';
import { BugKit } from './BugKit';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  act(() => bugKit.close());
  bugKit.configure({});
  bugKit.stopCapture();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function mount(ui: React.ReactNode) {
  const el = document.createElement('div');
  document.body.append(el);
  act(() => createRoot(el).render(ui));
  return el;
}

describe('<BugKit> (web)', () => {
  it('renders only children when disabled', () => {
    expect(mount(<BugKit enabled={false}>app</BugKit>).textContent).toBe('app');
  });

  it('opens a dialog whose preview includes sources, console and the issue link', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const el = mount(
      <BugKit enabled repo="helder-studio/app" sources={{ cart: () => ({ items: 2 }) }} />,
    );
    console.error('payment failed');
    act(() => el.querySelector('button')?.click());
    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('"items": 2');
    expect(dialog?.textContent).toContain('ERROR payment failed');
    expect(dialog?.textContent).toContain('| platform | web |');
    expect(dialog?.querySelector('a')?.getAttribute('href')).toContain(
      'github.com/helder-studio/app/issues/new',
    );
  });

  it('drafts AI steps with your model and shows them in the report', async () => {
    const complete = vi.fn(async (_prompt: string) => '1. Open cart\n2. Tap Pay');
    const el = mount(<BugKit enabled complete={complete} />);
    act(() => bugKit.open());
    const draft = [...el.querySelectorAll('button')].find(
      (b) => b.textContent === 'Draft steps (AI)',
    );
    await act(async () => draft?.click());
    expect(complete.mock.calls[0]?.[0]).toContain('numbered steps');
    expect(el.querySelector('pre')?.textContent).toContain('1. Open cart');
  });

  it('reports a failing model without throwing', async () => {
    const el = mount(
      <BugKit
        enabled
        complete={async () => {
          throw new Error('offline');
        }}
      />,
    );
    act(() => bugKit.open());
    const draft = [...el.querySelectorAll('button')].find(
      (b) => b.textContent === 'Draft steps (AI)',
    );
    await act(async () => draft?.click());
    expect(el.textContent).toContain('AI draft failed: offline');
  });

  it('opens from a shake handler and unsubscribes on unmount', () => {
    let trigger: (() => void) | undefined;
    const off = vi.fn();
    const el = document.createElement('div');
    const root = createRoot(el);
    act(() =>
      root.render(
        <BugKit
          enabled
          button={false}
          shake={(open) => {
            trigger = open;
            return off;
          }}
        />,
      ),
    );
    expect(el.querySelector('button')).toBe(null);
    act(() => trigger?.());
    expect(bugKit.getState().open).toBe(true);
    act(() => root.unmount());
    expect(off).toHaveBeenCalled();
  });
});
