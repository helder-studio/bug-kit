import { useEffect, useSyncExternalStore } from 'react';
import { bugKit, type KitOptions } from '../kit';

export interface BugKitProps extends KitOptions {
  /** Off: nothing is captured and nothing renders. Pass something like `__DEV__ || Config.QA_BUILD`. */
  enabled: boolean;
  /** Hook up a shake detector, e.g. `(open) => RNShake.addListener(open).remove`. Returns an unsubscribe. */
  shake?: (open: () => void) => (() => void) | undefined;
  /** `false` hides the floating button (open with `bugKit.open()` or a dev-dock tab). */
  button?: boolean;
}

export function useActivation({ enabled, shake, button: _b, ...options }: BugKitProps) {
  useEffect(() => {
    if (!enabled) return;
    bugKit.captureConsole();
    return () => bugKit.stopCapture();
  }, [enabled]);
  // Options are read when a report is built, so the latest props always apply.
  if (enabled) bugKit.configure(options);
  useEffect(() => (enabled && shake ? shake(bugKit.open) : undefined), [enabled, shake]);
}

export function useKitState() {
  return useSyncExternalStore(bugKit.subscribe, bugKit.getState, bugKit.getState);
}
