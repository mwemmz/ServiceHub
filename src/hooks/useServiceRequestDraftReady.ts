import { useEffect, useState } from 'react';
import { hydrateServiceRequestDraft, isServiceRequestDraftHydrated } from '@/services/serviceRequestDraft';

/** Ensures the service-request draft is loaded from storage before screens read it. */
export function useServiceRequestDraftReady(): boolean {
  const [ready, setReady] = useState(isServiceRequestDraftHydrated());

  useEffect(() => {
    if (ready) return;
    void hydrateServiceRequestDraft().then(() => setReady(true));
  }, [ready]);

  return ready;
}
