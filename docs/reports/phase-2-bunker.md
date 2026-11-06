# FASE 2 — BÚNKER

> **Fecha:** 06/11/2026 · **Estado:** ✅ terminada, pendiente de aprobación del operador
> **Rama:** `dev`

## 1. Qué se hizo

### Base de datos

- **6 tablas** del dominio de recolección, en 3 migraciones reversibles:
  `sources`, `source_sync_states`, `sync_jobs`, `sync_job_results`, `intel_items`, `intel_item_tags`.
  Las demás tablas del modelo aprobado se crean en sus fases (ver [04](../04-data-model.md)).
- Claves foráneas activas. Borrar una fuente que ya tiene contenido recolectado **está bloqueado**: el historial no se pierde.
- Un elemento por (`source`, `external_id`): la deduplicación también está garantizada por la base de datos.
- **Catálogo de fuentes** en [`data/knowledge/sources.json`](../../data/knowledge/sources.json) (11 fuentes),
  validado con Zod. Solo **3 fuentes** pueden automatizarse hoy: `steam_news`, `official_cms` y `abi_field_index`.
- Datos de prueba `DUMMY_` (4 noticias ficticias) que se cargan y se eliminan con un comando.

### API

| Endpoint | Para qué |
| --- | --- |
| `GET /api/sources` | Catálogo con estado de sincronización |
| `GET /api/intel` | Noticias recolectadas (filtros por fuente y categoría, paginación) |
| `POST /api/ingest` 🔒 | El runner de Python entrega lo recolectado |
| `POST/GET /api/sync-jobs` | Crear y consultar sincronizaciones (botón *Actualizar inteligencia*) |
| `PATCH /api/sync-jobs/:id` 🔒 | El runner reporta progreso y resultados |

Contrato completo: [11-api-reference.md](../11-api-reference.md).

### Seguridad aplicada

- Token interno comparado en tiempo constante; límite de peticiones (120/min ingesta, 30/min trabajos).
- Escrituras solo con `Content-Type: application/json`, lo que impide que otra página web dispare acciones.
- URLs solo `http(s)`; textos con longitud máxima; campos desconocidos rechazados; lote de ingesta en una transacción.
- La API **no arranca** si hay migraciones pendientes, y avisa de cómo resolverlo.
- `db:seed:dev` se niega a correr en producción; `db:migrate:undo` exige confirmación en producción.

### Herramientas

- `pnpm db:migrate | db:status | db:seed:base | db:seed:dev | db:seed:undo:dev | db:migrate:undo`.
- `scripts/reset-db.ps1 [-WithDummyData] [-Force]`: reconstruye la base local (solo desarrollo + SQLite).
- `scripts/setup.ps1` ahora también prepara la base de datos.

## 2. Decisiones técnicas

- **Umzug 3** en lugar de `sequelize-cli`, que dependía de versiones antiguas → [ADR-0003](../adr/0003-umzug-migrations.md).
- **Estado final calculado por la API**: el runner dice "terminé" y la API decide `success`/`partial`/`failed`
  según los resultados, así nunca aparece "completado" con una fuente caída.
- El cursor de una fuente solo avanza si esa fuente terminó bien.
- Un trabajo abandonado (> 2 h activo) se marca como fallido al crear el siguiente.
- **Steam habilitada** tras leer sus términos (permiten uso personal). **YouTube deshabilitada** hasta revisar sus términos en la Fase 4.
- `sqlite3` autorizado a ejecutar su instalación (descarga su binario precompilado).

Registradas en [`../10-decisions.md`](../10-decisions.md) (D-25 a D-31).

## 3. Pruebas y resultados

| Verificación | Resultado |
| --- | --- |
| `pnpm check` (formato, lint, tipos, pruebas JS + Python) | ✅ Exit 0 |
| Pruebas API | ✅ **61/61**: entorno (5), app/seguridad (6), migraciones (4), seeders (7), ingesta (20), trabajos (14), inteligencia/fuentes (5) |
| Pruebas panel / Python | ✅ 4/4 · 4/4 |
| Migraciones en archivo real: aplicar → estado → revertir una → aplicar | ✅ |
| `db:seed:base` dos veces seguidas | ✅ sin duplicados |
| `db:seed:dev` → `db:seed:undo:dev` | ✅ elimina todo lo `DUMMY_` |
| `reset-db.ps1 -WithDummyData -Force` y `setup.ps1` | ✅ |
| Simulación del runner contra la API real | ✅ trabajo `queued → running → partial`; cursor de Steam avanzó, el de la fuente fallida no; 401 sin token; 409 en fuente manual |
| Versión compilada (`node dist/...`) | ✅ encuentra las migraciones y arranca |
| PostgreSQL | ⚠️ **No probado**: Docker Desktop no estaba abierto. El código lo soporta (`DB_DIALECT=postgres`) |

## 4. Cómo lo verificas tú

1. Abre una terminal nueva en VS Code.
2. `pnpm db:status` → debe decir `Executed (3)` y `Pending (0)`.
3. `pnpm db:seed:dev` (carga noticias de prueba) y luego `pnpm dev`.
4. Abre en el navegador:
   - **http://127.0.0.1:4000/api/sources** → las 11 fuentes; `steam_news` con `"can_automate": true`.
   - **http://127.0.0.1:4000/api/intel** → 4 noticias que empiezan por `DUMMY_`.
   - **http://127.0.0.1:4000/api/intel?category=events** → solo 1.
5. `Ctrl + C`, después `pnpm db:seed:undo:dev`, y recarga `/api/intel` con `pnpm dev`: debe salir `"total": 0`.

## 5. Riesgos y pendientes

- ⚠️ `db:migrate:undo` borra los datos de las tablas que revierte. En desarrollo no pide confirmación.
- ⚠️ PostgreSQL sin probar: hacerlo cuando abras Docker Desktop (o en la Fase 7).
- ⏳ El botón del panel crea el trabajo, pero el runner de Python que lo ejecuta llega en la **Fase 4**.
- ⏳ La pantalla de inteligencia del panel llega en la **Fase 3**.
