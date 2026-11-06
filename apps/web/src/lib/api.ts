export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  time: string;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.status === 'ok' &&
    typeof record.service === 'string' &&
    typeof record.version === 'string' &&
    typeof record.time === 'string'
  );
}

/** Calls GET /api/health (proxied to the API by Vite in development). */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/health', { signal: signal ?? null });
  if (!response.ok) {
    throw new Error(`La API respondió HTTP ${String(response.status)}`);
  }
  const body: unknown = await response.json();
  if (!isHealthResponse(body)) {
    throw new Error('Respuesta inesperada de la API');
  }
  return body;
}
