import { ApiStatus } from '../features/system/ApiStatus';

const SCREENS = [
  'Centro de mando',
  'Inteligencia',
  'Arsenal',
  'Forense',
  'Economía',
  'Revisión',
] as const;

export function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-olive-800 px-6 py-4">
        <p className="font-mono text-xs tracking-[0.3em] text-amber-400">HELPER-ABI</p>
        <h1 className="text-2xl font-bold tracking-wide">OPERACIÓN CENTINELA</h1>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-8 md:grid-cols-[220px_1fr]">
        <nav aria-label="Secciones">
          <ul className="space-y-1">
            {SCREENS.map((screen) => (
              <li
                key={screen}
                className="rounded px-3 py-2 text-olive-300 opacity-60"
                aria-disabled="true"
              >
                {screen}
              </li>
            ))}
          </ul>
          <p className="mt-3 px-3 font-mono text-xs text-olive-400">Pantallas: Fase 3 (PANEL)</p>
        </nav>

        <section aria-labelledby="system-status" className="space-y-4">
          <h2 id="system-status" className="text-lg font-semibold">
            Estado del sistema
          </h2>
          <ApiStatus />
        </section>
      </main>
    </div>
  );
}
