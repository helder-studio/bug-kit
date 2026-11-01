import { type CSSProperties, useEffect, useState } from 'react';
import { bugKit } from '../kit';
import { type BugKitProps, useActivation, useKitState } from './shared';

declare const navigator:
  | { userAgent?: string; clipboard?: { writeText(text: string): Promise<void> } }
  | undefined;
declare const screen: { width: number; height: number } | undefined;
declare const location: { href: string } | undefined;

/** Web: a "Report a bug" button and dialog that builds, copies or files a Markdown report. */
export function BugKit(props: BugKitProps & { children?: React.ReactNode }) {
  useActivation(props);
  useEffect(() => {
    if (!props.enabled) return;
    bugKit.setPlatformDevice({
      platform: 'web',
      userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
      screen: typeof screen === 'undefined' ? undefined : `${screen.width}×${screen.height}`,
      url: typeof location === 'undefined' ? undefined : location.href,
    });
  }, [props.enabled]);
  const { open } = useKitState();
  if (!props.enabled) return <>{props.children}</>;
  return (
    <>
      {props.children}
      {props.button !== false && (
        <button type="button" onClick={bugKit.open} style={fab}>
          🐞 Report a bug
        </button>
      )}
      {open && <WebDialog />}
    </>
  );
}

const font = '13px system-ui, sans-serif';
const fab: CSSProperties = {
  position: 'fixed',
  right: 12,
  bottom: 52,
  zIndex: 2147483647,
  padding: '6px 12px',
  border: 0,
  borderRadius: 999,
  font: '600 12px system-ui, sans-serif',
  color: '#fff',
  background: '#e37400',
  cursor: 'pointer',
};
const field: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  font,
  padding: 8,
  marginTop: 4,
};

function WebDialog() {
  const { drafting, steps, error } = useKitState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const report = bugKit.report(title, description);
  const issueUrl = bugKit.issueUrl(report);
  // `steps` changes the report; reading it keeps the preview in sync.
  void steps;

  return (
    <section
      role="dialog"
      aria-label="Report a bug"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 92,
        zIndex: 2147483647,
        width: 440,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: '75vh',
        overflow: 'auto',
        padding: 16,
        borderRadius: 12,
        background: '#fff',
        color: '#202124',
        boxShadow: '0 8px 32px rgba(0,0,0,.24)',
        font,
      }}
    >
      <label>
        What went wrong?
        <input
          value={title}
          onChange={(e) => setTitle((e.target as unknown as { value: string }).value)}
          style={field}
        />
      </label>
      <label style={{ display: 'block', marginTop: 8 }}>
        Details (optional)
        <textarea
          value={description}
          onChange={(e) => setDescription((e.target as unknown as { value: string }).value)}
          rows={3}
          style={field}
        />
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {bugKit.getOptions().complete && (
          <button
            type="button"
            disabled={drafting}
            onClick={() => void bugKit.draftSteps(title, description)}
          >
            {drafting ? 'Drafting…' : 'Draft steps (AI)'}
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            void navigator?.clipboard?.writeText(report.markdown).then(() => setCopied(true))
          }
        >
          {copied ? 'Copied ✓' : 'Copy report'}
        </button>
        {issueUrl && (
          <a href={issueUrl} target="_blank" rel="noopener noreferrer">
            Open GitHub issue
          </a>
        )}
        <button type="button" onClick={bugKit.close}>
          Close
        </button>
      </div>
      {error && <p style={{ color: '#d93025' }}>AI draft failed: {error}</p>}
      <p style={{ color: '#5f6368', margin: '12px 0 4px' }}>
        Preview (check it for private data before sharing)
      </p>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          background: '#f8f9fa',
          padding: 8,
          borderRadius: 8,
          margin: 0,
        }}
      >
        {report.markdown}
      </pre>
    </section>
  );
}
