import { useEffect, useState } from 'react';
import { fetchHealth, type HealthResponse } from '../../lib/api';

type State =
  | { kind: 'loading' }
  | { kind: 'online'; health: HealthResponse }
  | { kind: 'offline'; message: string };

/** Shows whether the API is reachable. Real data fetching moves to TanStack Query in phase 3. */
export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((health) => {
        setState({ kind: 'online', health });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Error desconocido';
        setState({ kind: 'offline', message });
      });
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded border border-olive-800 bg-olive-900 p-4 font-mono text-sm"
    >
      <span className="text-olive-400">API · </span>
      {state.kind === 'loading' && <span className="text-olive-300">Comprobando…</span>}
      {state.kind === 'online' && (
        <span className="text-emerald-400">
          En línea · {state.health.service} v{state.health.version}
        </span>
      )}
      {state.kind === 'offline' && (
        <span className="text-amber-400">
          Sin conexión · {state.message}. ¿Está corriendo <code>pnpm dev:api</code>?
        </span>
      )}
    </div>
  );
}
