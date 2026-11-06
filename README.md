# Helper-ABI · Operación Centinela

> *"La información es munición."*

Aplicación personal de inteligencia táctica para **Arena Breakout: Infinite (PC)**.
Recolecta información **pública** (noticias oficiales, notas de parche, videos y fuentes
comunitarias), la verifica con procedencia y la resume con un **modelo de IA local**
(LM Studio), sin costo de tokens.

> ⚠️ La aplicación **nunca** interactúa con el cliente del juego, su memoria, archivos,
> tráfico ni anticheat. Solo consume fuentes públicas en internet.

## Estado

🚧 En construcción. Fase actual: **1 CIMIENTOS** (base del monorepo).
Ver la [hoja de ruta](docs/08-roadmap.md).

## Cómo empezar (Windows)

Requisitos: Windows 10/11 con `winget` y Git. El script instala o verifica el resto
(Node 26, pnpm 12, uv y Python 3.15) y crea tu `.env.development`.

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\setup.ps1"
pnpm check   # every quality check: format, lint, types, tests (JS + Python)
pnpm dev     # API on http://127.0.0.1:4000 + panel on http://127.0.0.1:5173
```

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Arranca la API y el panel en modo desarrollo |
| `pnpm dev:api` / `pnpm dev:web` | Arranca solo uno de los dos |
| `pnpm build` | Compila la API y el panel para producción |
| `pnpm test` / `pnpm py:test` | Pruebas de JavaScript / Python |
| `pnpm lint` / `pnpm py:lint` | Revisa el estilo del código |
| `pnpm format` / `pnpm py:format` | Formatea el código automáticamente |
| `pnpm check` | Todo lo anterior junto (debe pasar antes de cada commit) |

## Stack

React 19 · Vite 8 · Tailwind 4 · Express 5 · Sequelize 6 · SQLite/PostgreSQL ·
Python 3.15 · LM Studio · pnpm workspaces. Detalle en [docs/02-architecture.md](docs/02-architecture.md).

## Documentación

Empieza por [docs/README.md](docs/README.md).

## Uso

Proyecto de uso personal y no comercial. El contenido recolectado pertenece a sus autores
y se usa con atribución, respetando los términos de cada fuente.
