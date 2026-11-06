# CLAUDE.md — Reglas operativas de Helper-ABI

Proyecto **Operación Centinela**: app personal que recolecta información pública de
**Arena Breakout: Infinite (PC)**, la verifica y la resume con un LLM local.
Documentación completa: [`docs/README.md`](docs/README.md).

## Antes de cualquier tarea

1. Lee el documento de `docs/` que corresponda a la tarea (índice en `docs/README.md`).
2. Revisa `docs/10-decisions.md`: lo que ya se decidió no se vuelve a discutir.
3. Inspecciona el código existente antes de modificarlo.
4. Propón el cambio mínimo; señala supuestos y preguntas bloqueantes.

## Al terminar cada fase

- Detente y espera la aprobación del operador antes de pasar a la siguiente fase.
- Entrega: archivos creados/modificados, decisiones, comandos ejecutados, pruebas y
  resultados, riesgos, pasos exactos para que el operador lo verifique.
- Guarda el informe en `docs/reports/phase-N-<name>.md`.
- Explica todo como a un principiante (el operador no tiene experiencia programando).
  Usa Windows/PowerShell como referencia.

## Límites que nunca se cruzan

- **Nunca** interactuar con el cliente del juego, su memoria, archivos, procesos,
  tráfico, SDK/tokens de cuenta ni el anticheat. El análisis forense es siempre
  **después** de la partida, sobre capturas guardadas.
- **Nunca** eludir protecciones anti-bot (Cloudflare, Vercel, CAPTCHAs, proxies,
  navegadores "stealth", User-Agent falso). Si una fuente bloquea → consulta manual.
- Respetar `robots.txt` y términos de uso; User-Agent identificable; ≥ 2 s entre peticiones.
- Solo **Arena Breakout: Infinite de PC**. Nada de Arena Breakout móvil ni Escape from Tarkov.
- **No inventar** cifras, URLs, nombres, parches ni mecánicas. Desconocido = `null`.
- La IA (incluido Claude) no aprueba datos críticos: el operador aprueba.
- No borrar ni sobrescribir historial de datos sin autorización.
- Secretos solo en `.env.*` (nunca en código, Dockerfiles ni Git).

## Arquitectura en una línea

`apps/web` (React) → `apps/api` (Express + Sequelize, **único dueño de la BD**) ←
`services/` (Python, envía JSON a `/api/ingest`, nunca escribe SQL) → LM Studio `:1234`.

## Versiones (política: última estable/LTS, nunca alpha/beta)

Node 26 LTS · pnpm 12 · TypeScript 7 · React 19 · Vite 8 · Tailwind 4 · Express 5 ·
Sequelize 6 (v7 aún en alpha) · Zod 4 · Vitest 5 · ESLint 10 · Python 3.15.
Detalle y justificación: `docs/02-architecture.md` y `docs/adr/0001-latest-stable-versions.md`.

## Comandos

- `pnpm check` → formato, lint, tipos y pruebas (JS + Python). **Debe pasar antes de cada commit.**
- `pnpm dev` (API :4000 + panel :5173) · `pnpm build` · `pnpm py:test` · `pnpm py:lint`.
- En PowerShell, recargar el PATH si una herramienta recién instalada no aparece:
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.
- Dependencias nuevas: versión exacta, sin excepciones a la antigüedad mínima de pnpm,
  y `allowBuilds` solo si el paquete lo necesita de verdad.

## Convenciones de código

- Código, nombres, comentarios y commits en **inglés**; documentación para el operador en español.
- TypeScript `strict`, sin `any` injustificado; async/await.
- Python con type hints, `ruff` y `pytest`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- Ramas: `main` (estable) y `dev` (trabajo).
- La raíz del proyecto es la carpeta `Helper ABI` (el repo en GitHub se llama `Helper-ABI`).
  Las rutas tienen un espacio: siempre entre comillas en PowerShell.
