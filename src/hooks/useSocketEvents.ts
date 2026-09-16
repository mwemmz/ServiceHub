import { useEffect } from 'react';
import { socketService } from '@/services/socketService';

/**
 * Subscribe to one or more socket events and call the handler whenever any fire.
 * Pass a stable handler (e.g. useAsyncData's `reload`) to avoid re-subscribing.
 */
export function useSocketEvents(events: string | string[], handler: () => void, enabled = true): void {
  const key = Array.isArray(events) ? events.join(',') : events;
  useEffect(() => {
    if (!enabled) return;
    const list = key.split(',');
    list.forEach((event) => socketService.on(event, handler));
    return () => list.forEach((event) => socketService.off(event, handler));
  }, [key, handler, enabled]);
}