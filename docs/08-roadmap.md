# 08 · Hoja de ruta

Unifica las fases del proyecto (spec §13), las de ingesta (investigación I-1…I-6) y las
del módulo forense (F-1…F-6) en **una sola secuencia**.

**Regla:** al terminar cada fase, Claude se detiene, entrega el informe en
`docs/reports/` y espera la aprobación del operador.

| Fase | Nombre | Entregable | Incluye | Estado |
| --- | --- | --- | --- | --- |
| 0 | **VERIFICACIÓN** | Fuentes y entorno comprobados | I-1 (catálogo inicial) | ✅ Hecha · [informe](reports/phase-0-verification.md) |
| 0.5 | **DOCTRINA** | Documentación consolidada, investigación de fuentes, repo Git | — | ✅ Hecha |
| 1 | **CIMIENTOS** | Monorepo pnpm, configuración, calidad, `.env.example`, scripts de Windows | — | ✅ Hecha (pendiente de aprobación) · [informe](reports/phase-1-foundations.md) |
| 2 | **BÚNKER** | API Express + Sequelize + migraciones + seeders dev + `/api/ingest` + `/api/sync-jobs` | Aprobación del modelo (04) | ⏳ |
| 3 | **PANEL** | React con layout, tema, navegación, estados vacíos/error, lista de inteligencia con datos dummy | — | ⏳ |
| 4 | **RECONOCIMIENTO** | Runner Python + conectores + botón *Actualizar inteligencia* | I-2, I-3, I-4, I-5 | ⏳ |
| 5 | **ARSENAL** | Paquetes de conocimiento aprobados cargados, dummy eliminado, cola de revisión | F-2 | ⏳ |
| 6 | **FORENSE** | Análisis de capturas | F-1, F-3, F-4, F-5 | ⏳ |
| 7 | **AUTOMATIZACIÓN** | Programador de tareas, Parte diario, exportación de BD, alertas | I-6 | ⏳ |

## Detalle por fase

### Fase 1 — CIMIENTOS

- `package.json` raíz, `pnpm-workspace.yaml`, `apps/web`, `apps/api` vacíos pero compilables.
- TypeScript strict compartido, ESLint 10 + Prettier, Vitest.
- `services/` con `pyproject.toml` (uv), `ruff`, `pytest`.
- `.env.example` completo, `scripts/setup.ps1` (instala/verifica Node 26, pnpm 12, Python 3.15, uv).
- `docker-compose.yml` opcional con imágenes de versión fija.
- **Hecho cuando:** `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `uv run pytest` pasan en Windows.

### Fase 2 — BÚNKER

- Aprobar [04-data-model.md](04-data-model.md) → migraciones reversibles.
- Endpoints: `GET /api/health`, `POST /api/ingest`, `POST|GET|PATCH /api/sync-jobs`, `GET /api/intel`, `GET /api/sources`.
- Seeder `base` de `sources` con las fuentes aprobadas de [05](05-sources.md).
- **Hecho cuando:** migrar → seed → consultar → deshacer funciona; pruebas de validación (Zod), token interno, rate limit y CORS.

### Fase 3 — PANEL

- Layout, tema militar, 6 pantallas con navegación (contenido real solo en *Inteligencia*).
- **Hecho cuando:** lista de inteligencia con dummy, estados vacío/carga/error, `prefers-reduced-motion`.

### Fase 4 — RECONOCIMIENTO

**Prueba de concepto primero:** Steam News API + CMS del sitio oficial (si se aprueba P-04) +
YouTube Data API. Debe demostrar: detección de publicación nueva · título/URL/fecha ·
deduplicación al ejecutar dos veces · persistencia vía API · visualización en el panel ·
manejo de un conector que falla.
Después: ABI Field Index (datos técnicos → `pending`), clasificación (reglas + LLM), botón,
historial de ejecuciones. Reddit y transcripciones quedan fuera (ver [05](05-sources.md)).

### Fase 5 — ARSENAL

- Fijar formato de paquete de conocimiento (P-09) → importador idempotente → cola de revisión → aprobación del operador.
- Pantalla *Arsenal* con estado de verificación visible. Calculadora solo con mecánicas verificadas.

### Fase 6 — FORENSE

Ver [07-forensic.md](07-forensic.md): F-1 → F-3 → F-4 → F-5.

### Fase 7 — AUTOMATIZACIÓN

Programador de tareas de Windows, Parte de Inteligencia diario, `db:export`, alertas de conectores, comparador de meta.

## Criterios de aceptación transversales

Una funcionalidad **no** está terminada solo porque compile o se vea:

- Validación de entradas y salidas · manejo de errores y logs con fecha/hora.
- Pruebas automatizadas que pasan.
- Sin secretos en el repositorio.
- Protección frente a contenido externo malicioso (XSS, archivos subidos).
- Trazabilidad de los datos mostrados.
- Estados vacíos y errores visibles en la UI.
- Documentación mínima de configuración y uso.
- Funciona en Windows.
- Ninguna interacción prohibida con el cliente del juego.

## Skills de Claude (opcional, más adelante)

`CLAUDE.md` cubre hoy las reglas generales. Solo se crearán Skills específicas
(p. ej. `centinela-source-recon`, `centinela-data-quality`) si en fases posteriores
aparece trabajo repetitivo que lo justifique. No duplican esta documentación.
