<div align="center">

# @helder-studio/bug-kit

**Bug reports that already contain the answer. Free, no backend, no account.**

A 🐞 button (or a shake) that builds one Markdown report with device info, recent console output and
the state of every dev tool you use, then shares it or opens a prefilled GitHub issue. React Native
and web.

[![npm](https://img.shields.io/npm/v/@helder-studio/bug-kit?color=cb3837&logo=npm)](https://www.npmjs.com/package/@helder-studio/bug-kit)
[![bundle size](https://img.shields.io/bundlejs/size/@helder-studio/bug-kit?label=min%2Bgzip)](https://bundlejs.com/?q=@helder-studio/bug-kit)
[![CI](https://github.com/helder-studio/bug-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/helder-studio/bug-kit/actions/workflows/ci.yml)
[![provenance](https://img.shields.io/badge/npm-provenance-2ea44f?logo=sigstore)](https://www.npmjs.com/package/@helder-studio/bug-kit#provenance)
[![license](https://img.shields.io/npm/l/@helder-studio/bug-kit?color=blue)](./LICENSE)

<!-- demo GIF -->

</div>

```sh
npm install @helder-studio/bug-kit
```

## Why

"It didn't work" is the most common bug report. What you need is the device, the last errors, which
requests failed and whether the tester had the clock set to next week. Paid SDKs collect that into
their own dashboards. Bug Kit puts it in a plain report the tester shares however they like.

## Quick start

```tsx
import { BugKit } from '@helder-studio/bug-kit';

<BugKit enabled={__DEV__ || Config.QA_BUILD} repo="your-org/your-app">
  <App />
</BugKit>;
```

## Features

- 🐞 **One tap or a shake**: floating button, `bugKit.open()`, or your own shake detector
- 📋 **Everything in one report**: environment, the last console lines, and any app state you plug in
- 🔌 **Plugs into the toolkit**: network-chaos log, timewarp state, quarantine list, a11y warnings,
  LLM calls, or your own Redux / Zustand / query cache
- 🐙 **GitHub-ready**: a prefilled "new issue" link, safely truncated to GitHub's URL limit
- 🤖 **AI steps to reproduce (opt-in)**: your model drafts them from the report; marked as a draft
- 🔒 **Nothing leaves the device by itself**: the tester sees the full preview before sharing
- 🚫 **Production-safe**: `enabled={false}` captures nothing, and `/noop` drops it from release bundles

## Plug in your tools

```tsx
import { chaos } from '@helder-studio/network-chaos';
import { timewarp } from '@helder-studio/timewarp';
import { llmLens } from '@helder-studio/llm-lens';

<BugKit
  enabled={qa}
  repo="your-org/your-app"
  device={{ appVersion: '1.4.0', build: '812', user: 'qa-anna' }}
  sources={{
    network: () => chaos.getLog().slice(0, 20),
    time: () => timewarp.getState(),
    quarantine: () => quarantine.list(),
    llm: () => llmLens.getCalls().slice(0, 10),
    cart: () => store.getState().cart,
  }}
  shake={(open) => RNShake.addListener(open).remove} // any shake library
/>;
```

A source that throws becomes a note in the report instead of breaking it. Long sources are clipped.

## AI steps to reproduce (opt-in)

```tsx
<BugKit
  enabled={qa}
  complete={async (prompt) => {
    const res = await fetch('https://dev.example.com/api/llm', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    return (await res.json()).text; // your backend calls the model, e.g. Claude via @anthropic-ai/sdk
  }}
/>;
```

## API

| Export                         | What it does                                          |
| ------------------------------ | ----------------------------------------------------- |
| `<BugKit enabled … />`         | button, form, preview, share / copy / GitHub issue    |
| `bugKit.open()` / `.close()`   | open the form from your own code                      |
| `bugKit.report(title, text?)`  | `{ title, markdown, data }` with everything collected |
| `createReport(input)`          | build a report yourself (tests, crash handlers)       |
| `githubIssueUrl(repo, report)` | prefilled issue URL, truncated under GitHub's limit   |
| `bugKitTab`                    | dev-dock tab (React Native)                           |

Props: `enabled`, `repo`, `labels`, `device`, `sources`, `complete`, `shake`, `button`.

## Compared with other tools

Instabug and Shake are full SaaS products with dashboards (and pricing). Sentry's feedback widget
needs a Sentry project. Bug Kit is a free report generator: no backend, no account, and it carries
the state of your dev tools.

## Support

If this saves you time, you can buy me a coffee on Ko-fi. It keeps the helder-studio libraries maintained.

<a href="https://ko-fi.com/gorian" target="_blank" rel="noopener">
  <img src="https://storage.ko-fi.com/cdn/kofi3.png?v=6" alt="Support me on Ko-fi" height="40">
</a>

## License

[MIT](./LICENSE) © [Helder Studio](https://www.helderstudio.com/en/)
