'use client';

import { useCallback, useRef } from 'react';

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Wake lock can fail (e.g. low battery, not visible) — non-fatal.
    }
  }, []);

  const release = useCallback(async () => {
    try {
      await lockRef.current?.release();
    } catch {
      // ignore
    } finally {
      lockRef.current = null;
    }
  }, []);

  return { acquire, release };
}
