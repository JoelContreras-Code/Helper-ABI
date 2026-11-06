# 02 · Arquitectura y stack

## 1. Política de versiones

**Regla:** usar siempre la **última versión estable o LTS** disponible. Nunca versiones
`alpha`, `beta`, `rc` ni `latest` sin fijar. Si la versión más nueva rompe la
compatibilidad con otra pieza del stack, se usa la más nueva que sea compatible y se
documenta. Justificación en [ADR-0001](adr/0001-latest-stable-versions.md).

Versiones comprobadas el **06/11/2026** (se fijan exactas en `package.json` / `pyproject.toml` en la Fase 1):

| Capa | Tecnología | Versión | Nota |
| --- | --- | --- | --- |
| Runtime | **Node.js** | **26 LTS** (26.13.x "Lithium") | Sustituye a Node 22 de la spec original. Instalada en el equipo: 24.11 → hay que actualizar |
| Paquetes JS | **pnpm** (workspaces) | 12.x | Instalada: 9.13 → actualizar con Corepack |
| Lenguaje | **TypeScript** (`strict`) | **6.0.3** | TS 7.0.2 ya existe, pero `typescript-eslint` solo soporta `< 6.1`. Se sube a 7 cuando el linter lo soporte |
| Frontend | **React** | 19.3 | |
| Build web | **Vite** + `@vitejs/plugin-react` | 8.3 / 6.2 | |
| Estilos | **Tailwind CSS** + `@tailwindcss/vite` | 4.3 | |
| Animaciones | **Motion** | 14.x | |
| Rutas web | **React Router** | 8.x | No estaba en la spec original; hace falta para las 5 pantallas |
| Datos web | **TanStack Query** | 5.x | |
| Gráficas | **Recharts** | 3.x | |
| API | **Express** | 5.3 | |
| ORM | **Sequelize** + `sequelize-cli` | 6.37 / 6.6 | Sequelize 7 sigue en *alpha* (7.0.0-alpha.48) → no se usa |
| BD desarrollo | **SQLite** (`sqlite3`) | 6.x | |
| BD producción (opcional) | **PostgreSQL** (`pg`) | PostgreSQL 18 · `pg` 8.x | Se cambia solo con el `.env` |
| Validación | **Zod** | 4.x | |
| Seguridad HTTP | `helmet`, `cors`, `express-rate-limit`, `multer` | 8 / 2 / 8 / 2 | |
| Calidad JS | ESLint + `typescript-eslint` + Prettier | 10 / 8.72 / 3.9 | |
| Pruebas JS | **Vitest** | 5.x | |
| Workers | **Python** | **3.15** | Sustituye a 3.11. Instalada: 3.14 → instalar 3.15 |
| Entorno Python | **uv** | 0.13.x | Ver ADR-0001 (alternativa: `venv` + `pip`) |
| Librerías Python | `httpx`, `feedparser`, `beautifulsoup4`, `lxml`, `pydantic`, `rapidfuzz` | últimas estables | Todas tienen soporte para 3.15 (comprobado en PyPI) |
| Calidad Python | `ruff` + `pytest` | 0.17 / 9.2 | |
| IA local | **LM Studio** | última | Qwen2.5 7B Instruct (texto) · Qwen2.5-VL 7B (visión). Revisar modelos más nuevos que quepan en 8 GB en la Fase 4 |
| Contenedores (opcional) | Docker Compose | `node:26-alpine`, `python:3.15-slim` con tag exacto | Nunca `latest` |

> ⚠️ Riesgo conocido: las versiones muy recientes pueden traer incompatibilidades no
> documentadas entre sí. Cada fase verifica con `pnpm install`, `lint`, `typecheck` y
> `test` antes de darse por terminada.

## 2. Diagrama

```text
┌──────────────────────────────────────────────┐
│  apps/web · React + Tailwind + Motion        │  ← Panel de mando (navegador)
└───────────────────────┬──────────────────────┘
                        │ HTTP/JSON (TanStack Query)
┌───────────────────────▼──────────────────────┐
│  apps/api · Express + Sequelize              │  ← ÚNICO dueño de la BD
│  · crea sync_jobs y lanza el runner Python   │
└───────┬───────────────────────────▲──────────┘
        │ ORM                       │ POST /api/ingest (token interno)
┌───────▼────────┐      ┌───────────┴───────────────────────┐
│ SQLite / PG    │      │ services/ (Python)                │
│ migraciones    │      │  recon/     → conectores          │
│ seeders        │      │  forensic/  → capturas de muerte  │
└────────────────┘      │  common/    → cliente API y LLM   │
                        └───────────┬───────────────────────┘
                                    │ HTTP local
                        ┌───────────▼──────────┐
                        │ LM Studio :1234      │
                        └──────────────────────┘
```

### Reglas de oro

1. **Solo la API toca la base de datos.** Los workers Python envían JSON a la API; la API
   valida con Zod y guarda con Sequelize. Nada de SQL armado a mano.
2. **Un fallo no tumba al resto:** cada conector se ejecuta aislado; el trabajo termina
   como `partial` si alguno falla.
3. **El LLM trabaja después de la extracción**, nunca la sustituye.

### Cómo se dispara una sincronización (unifica spec §4 e investigación §4–6)

Hay un único punto de entrada: el **runner** de Python `python -m recon run`.

| Disparador | Qué hace |
| --- | --- |
| Botón **Actualizar inteligencia** del panel | `POST /api/sync-jobs` → la API crea el registro `sync_job` y lanza el runner como proceso hijo con el `job_id` |
| **Programador de tareas de Windows** | Ejecuta un script que llama a `POST /api/sync-jobs` (la API debe estar encendida) |
| Cron interno (opcional) | La API programa el mismo `POST` mientras está encendida |

El runner consulta los conectores activos, envía los resultados a `/api/ingest` y
reporta el estado por fuente a `PATCH /api/sync-jobs/:id`.

## 3. Estructura de carpetas

La raíz es la carpeta **`Helper ABI`** (repo de GitHub: `Helper-ABI`).

```text
Helper ABI/
├── CLAUDE.md                    # Operating rules for Claude
├── README.md
├── .gitignore  .gitattributes  .editorconfig
├── .env.example                 # Public template, no secrets
├── package.json                 # Root monorepo scripts
├── pnpm-workspace.yaml
├── docker-compose.yml           # Optional local environment
├── docs/                        # This documentation (see docs/README.md)
├── apps/
│   ├── web/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app/             # Routes and layout
│   │       ├── pages/           # Command, Intel, Arsenal, Forensic, Economy
│   │       ├── components/      # Reusable UI
│   │       ├── features/        # Per-module logic
│   │       ├── hooks/
│   │       ├── lib/             # API client, utils
│   │       └── styles/          # Military Tailwind theme
│   └── api/
│       ├── .sequelizerc
│       └── src/
│           ├── server.ts
│           ├── config/          # Database config per environment
│           ├── models/
│           ├── migrations/      # Versioned schema (only place the schema lives)
│           ├── seeders/
│           │   ├── dev/         # Dummy data (testing only)
│           │   └── base/        # Approved real data
│           ├── routes/
│           ├── controllers/
│           ├── services/
│           ├── validators/      # Zod schemas
│           └── middlewares/     # Errors, internal auth, rate limit
├── services/                    # Python workers
│   ├── pyproject.toml           # Dependencies (managed with uv)
│   ├── recon/                   # Source connectors + runner
│   ├── forensic/                # Death screenshot analysis
│   ├── common/                  # API and LLM clients, logging
│   └── tests/
├── data/
│   ├── knowledge/               # Approved knowledge packages (JSON)
│   ├── exports/                 # DB exports (git-ignored)
│   └── screenshots/             # Death screenshots (git-ignored)
└── scripts/
    ├── setup.ps1                # Windows setup
    └── reset-db.ps1
```

## 4. Base de datos portable

- El esquema vive **solo** en `migrations/`. `pnpm db:migrate` crea todas las tablas.
- Los datos se cargan con seeders, nunca pegando SQL.
- `pnpm db:seed:dev` → datos dummy para probar la UI; `pnpm db:seed:undo:dev` los elimina.
- `pnpm db:seed:base` → carga **solo registros aprobados** desde `data/knowledge/*.json`.
- `pnpm db:export` → vuelca tablas a JSON en `data/exports/` conservando IDs, relaciones,
  unidades, procedencia, estados y fechas. La importación es **idempotente**.
- Modelo detallado: [04-data-model.md](04-data-model.md).

## 5. Entornos

| Archivo | Uso | ¿Va a Git? |
| --- | --- | --- |
| `.env.example` | Plantilla con todas las variables, sin secretos | ✅ |
| `.env.development` | Local, SQLite, datos dummy permitidos | ❌ |
| `.env.test` | Pruebas automáticas con BD temporal | ❌ |
| `.env.production` | PostgreSQL, sin seeders dev | ❌ |

Variables mínimas: `NODE_ENV`, `DB_DIALECT`, `DB_STORAGE` o `DATABASE_URL`, `API_PORT`,
`WEB_ORIGIN`, `INGEST_TOKEN`, `LMSTUDIO_URL`, `LLM_TEXT_MODEL`, `LLM_VISION_MODEL`,
`HTTP_USER_AGENT`, `HTTP_MIN_DELAY_MS`. Opcionales: `YOUTUBE_API_KEY` (conector de
YouTube), `DISCORD_BOT_TOKEN` (solo si se monta el seguimiento de anuncios, 05 §2.5).

## 6. Pantallas del panel

1. **Centro de mando:** resumen del día, alertas del meta, estado de fuentes, tasa de supervivencia.
2. **Inteligencia:** noticias, videos y partes diarios con filtros por fuente y categoría; botón *Actualizar inteligencia*.
3. **Arsenal:** munición y armaduras con su estado de verificación; calculadora de penetración (solo mecánicas verificadas).
4. **Forense:** subir captura y ver el informe.
5. **Economía:** registro de raids y gráfica de ganancia/pérdida.
6. **Revisión:** cola de datos pendientes, discrepancias y aprobaciones (requerida por 03).

Estilo: tema oscuro, verde oliva y ámbar, tipografía monoespaciada en datos, animaciones
≤ 200 ms y `prefers-reduced-motion` respetado. Estados vacíos y de error siempre visibles.

## 7. Seguridad

- **Capturas:** validar tipo real (PNG/JPG por *magic bytes*, no solo extensión), tamaño
  máximo, renombrar con UUID; nunca servirlas con su nombre original.
- **XSS:** todo texto externo (Reddit, wikis, noticias) se muestra escapado por React;
  prohibido `dangerouslySetInnerHTML` con contenido recolectado. Si hay que mostrar HTML
  de noticias, se sanitiza en la API antes de guardarlo.
- **Ingesta:** `/api/ingest` con token interno (`INGEST_TOKEN`), rate limit y validación Zod.
- **CORS:** solo `WEB_ORIGIN` (la URL local del panel). `helmet` activo.
- **SQL:** solo Sequelize con parámetros; nada de concatenar SQL.
- **Secretos:** solo en `.env.*`; nunca en código, Dockerfiles, logs ni Git.
- **Red:** la API escucha en `127.0.0.1` por defecto (uso personal, no expuesta a la red).
