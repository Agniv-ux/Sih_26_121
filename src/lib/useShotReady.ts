import { useEffect } from 'react';

/** Signals the screenshot script that a non-map page has rendered. */
export function useShotReady(ready = true) {
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => (window.__nwisReady = true), 300);
    return () => window.clearTimeout(id);
  }, [ready]);
}
